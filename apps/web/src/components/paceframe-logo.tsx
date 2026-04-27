type PaceframeLogoProps = {
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap = {
  sm: 44,
  md: 58,
  lg: 76
};

export function PaceframeLogo({ size = 'md' }: PaceframeLogoProps) {
  const dimension = sizeMap[size];

  return (
    <div
      className="paceframe-logo"
      style={{
        width: dimension,
        height: dimension
      }}
      aria-hidden="true"
    >
      <span className="paceframe-logo-core" />
      <span className="paceframe-logo-beam paceframe-logo-beam-top" />
      <span className="paceframe-logo-beam paceframe-logo-beam-right" />
      <span className="paceframe-logo-beam paceframe-logo-beam-bottom" />
    </div>
  );
}
