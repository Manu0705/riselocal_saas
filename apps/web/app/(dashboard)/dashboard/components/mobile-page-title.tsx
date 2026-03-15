type Props = {
  title: string;
};

export default function MobilePageTitle({ title }: Readonly<Props>) {
  return (
    <h1
      style={{
        width: '100%',
        minHeight: 32,
        margin: '0 0 14px',
        fontSize: 22,
        lineHeight: '32px',
        fontWeight: 600,
        letterSpacing: '-0.3px',
        color: 'var(--text)',
      }}
    >
      {title}
    </h1>
  );
}
