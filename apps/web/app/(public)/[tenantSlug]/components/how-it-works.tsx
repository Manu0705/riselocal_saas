type HowItWorksStep = {
  title: string;
  desc: string;
};

type Props = {
  title?: string;
  subtitle?: string;
  steps?: HowItWorksStep[];
};

const defaultSteps: HowItWorksStep[] = [
  {
    title: 'Contact Us',
    desc: 'Call or WhatsApp us to get started',
  },
  {
    title: 'Book Home Visit',
    desc: 'Choose a convenient date & time',
  },
  {
    title: 'Select Service',
    desc: 'Browse the options and tell us what you need',
  },
  {
    title: 'Confirm and Follow Up',
    desc: 'We respond quickly and move your enquiry forward',
  },
];

export default function HowItWorks({ title = 'How It Works', subtitle, steps = defaultSteps }: Readonly<Props>) {
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: subtitle ? 6 : 12 }}>{title}</h2>
      {subtitle ? (
        <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--muted)' }}>{subtitle}</p>
      ) : null}

      <div style={{ display: 'grid', gap: 12 }}>
        {steps.map((step, i) => (
          <div
            key={`${step.title}-${i}`}
            style={{
              border: '1px solid #eee',
              borderRadius: 12,
              padding: 12,
              background: '#fafafa',
            }}
          >
            <div style={{ fontWeight: 600 }}>
              {i + 1}. {step.title}
            </div>

            <div style={{ fontSize: 14, marginTop: 4 }}>{step.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
