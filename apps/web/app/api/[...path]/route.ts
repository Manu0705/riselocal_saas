import { NextRequest, NextResponse } from 'next/server';
import { buildUpstreamApiUrl, getApiBaseCandidates } from '@/lib/api-endpoint';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: {
    path: string[];
  };
};

function getRequestHost(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '';
  return host.split(',')[0].trim().toLowerCase().split(':')[0];
}

function getProxyCandidates(request: NextRequest): string[] {
  const requestHost = getRequestHost(request);

  return getApiBaseCandidates()
    .map((base) => base.trim())
    .filter((base) => /^https?:\/\/.+/i.test(base))
    .filter((base, index, items) => items.indexOf(base) === index)
    .filter((base) => {
      try {
        return new URL(base).host.toLowerCase() !== requestHost;
      } catch {
        return false;
      }
    })
    .sort((left, right) => {
      const rank = (candidate: string) => {
        const host = new URL(candidate).host.toLowerCase();
        if (host.startsWith('api.')) return 0;
        if (host.includes('onrender.com')) return 1;
        return 10;
      };

      return rank(left) - rank(right);
    });
}

function createUpstreamHeaders(request: NextRequest): Headers {
  const headers = new Headers(request.headers);

  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');
  headers.delete('x-forwarded-for');
  headers.delete('x-forwarded-host');
  headers.delete('x-forwarded-port');
  headers.delete('x-forwarded-proto');

  return headers;
}

function createProxyResponse(response: Response, body: ArrayBuffer): NextResponse {
  const headers = new Headers();
  const contentType = response.headers.get('content-type');
  const cacheControl = response.headers.get('cache-control');

  if (contentType) {
    headers.set('content-type', contentType);
  }

  if (cacheControl) {
    headers.set('cache-control', cacheControl);
  }

  return new NextResponse(body, {
    status: response.status,
    headers,
  });
}

async function proxyRequest(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const upstreamPath = `/${(context.params.path || []).join('/')}${request.nextUrl.search}`;
  const method = request.method.toUpperCase();
  const headers = createUpstreamHeaders(request);
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer();
  const proxyCandidates = getProxyCandidates(request);

  if (proxyCandidates.length === 0) {
    return NextResponse.json(
      {
        success: false,
        message: 'No valid upstream API candidates are configured.',
      },
      { status: 502 },
    );
  }

  let lastError: unknown = null;

  for (let index = 0; index < proxyCandidates.length; index += 1) {
    const base = proxyCandidates[index];
    const isLastCandidate = index === proxyCandidates.length - 1;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      const controller = new AbortController();
      timeoutId = globalThis.setTimeout(() => controller.abort(), 7000);
      const response = await fetch(buildUpstreamApiUrl(base, upstreamPath), {
        method,
        headers,
        body: body && body.byteLength > 0 ? body : undefined,
        cache: 'no-store',
        redirect: 'manual',
        signal: controller.signal,
      });
      globalThis.clearTimeout(timeoutId);

      const vercelErrorHeader = response.headers.get('x-vercel-error')?.toUpperCase();
      const shouldFailOver =
        (!isLastCandidate && response.status >= 500) ||
        response.status === 508 ||
        vercelErrorHeader === 'INFINITE_LOOP_DETECTED';

      if (shouldFailOver) {
        lastError = new Error(`Upstream candidate ${base} returned ${response.status}`);
        continue;
      }

      const responseBody = await response.arrayBuffer();
      return createProxyResponse(response, responseBody);
    } catch (error) {
      lastError = error;
    } finally {
      if (timeoutId) {
        globalThis.clearTimeout(timeoutId);
      }
    }
  }

  return NextResponse.json(
    {
      success: false,
      message: lastError instanceof Error ? lastError.message : 'Unable to reach upstream API',
    },
    { status: 502 },
  );
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}
