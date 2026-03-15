export default function HowItWorks() {
  const steps = [
    {
      title: 'Contact Us',
      desc: 'Call or WhatsApp us to get started',
    },
    {
      title: 'Book Home Visit',
      desc: 'Choose a convenient date & time',
    },
    {
      title: 'Select Fabric',
      desc: 'Browse our catalogues and designs',
    },
    {
      title: 'Installation',
      desc: 'We deliver and install at your home',
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>How It Works</h2>

      <div style={{ display: 'grid', gap: 12 }}>
        {steps.map((step, i) => (
          <div
            key={i}
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
