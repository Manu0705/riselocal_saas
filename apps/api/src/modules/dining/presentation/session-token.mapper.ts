import type { Request } from 'express';
import type {
  GenerateSessionTokenRequestDTO,
  GetParticipantsRequestDTO,
  JoinSessionRequestDTO,
  LeaveSessionRequestDTO,
  RegenerateSessionTokenRequestDTO,
  SessionTokenRequestContextDTO,
  ValidateSessionTokenRequestDTO,
} from './session-token.dto';

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asNullableString(value: unknown): string | null {
  const parsed = asString(value);
  return parsed.length > 0 ? parsed : null;
}

function asOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') {
    return true;
  }

  if (normalized === 'false' || normalized === '0') {
    return false;
  }

  return undefined;
}

export function mapSessionTokenContext(req: Request): SessionTokenRequestContextDTO {
  return {
    tenantId: asString(req.params.tenantId || req.tenant?.id || req.user?.tenantId),
    locationId: asString(req.body?.locationId || req.query.locationId || req.headers['x-location-id']),
    actorId: asNullableString(req.user?.id),
  };
}

export function mapGenerateTokenRequest(req: Request): GenerateSessionTokenRequestDTO {
  return {
    sessionId: asString(req.body?.sessionId),
    expiresAt: req.body?.expiresAt ? String(req.body.expiresAt) : undefined,
    joinBaseUrl: asNullableString(req.body?.joinBaseUrl) ?? undefined,
  };
}

export function mapValidateTokenRequest(req: Request): ValidateSessionTokenRequestDTO {
  return {
    token: asString(req.body?.token || req.query.token),
  };
}

export function mapJoinSessionRequest(req: Request): JoinSessionRequestDTO {
  return {
    token: asString(req.body?.token),
    role: asString(req.body?.role),
    deviceId: asString(req.body?.deviceId),
    displayName: asNullableString(req.body?.displayName),
  };
}

export function mapLeaveSessionRequest(req: Request): LeaveSessionRequestDTO {
  return {
    token: asString(req.body?.token),
    role: asString(req.body?.role),
    deviceId: asString(req.body?.deviceId),
  };
}

export function mapRegenerateTokenRequest(req: Request): RegenerateSessionTokenRequestDTO {
  return {
    sessionId: asString(req.body?.sessionId),
    expiresAt: req.body?.expiresAt ? String(req.body.expiresAt) : undefined,
    joinBaseUrl: asNullableString(req.body?.joinBaseUrl) ?? undefined,
  };
}

export function mapGetParticipantsRequest(req: Request): GetParticipantsRequestDTO {
  return {
    sessionId: asString(req.query.sessionId || req.body?.sessionId),
    includeLeft: asOptionalBoolean(req.query.includeLeft ?? req.body?.includeLeft),
  };
}
