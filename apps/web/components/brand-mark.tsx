type BrandMarkProps = Readonly<{ className: string }>;

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id="cadence-mark-gradient"
          x1="8"
          y1="24"
          x2="55"
          y2="43"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6D28D9" />
          <stop offset="0.52" stopColor="#F43F5E" />
          <stop offset="1" stopColor="#FB923C" />
        </linearGradient>
      </defs>
      <path
        d="M51.5 16.5C44.4 8.8 34.7 6.2 25 9.1 13.2 12.6 6.5 22 7 33.4c.5 11.1 7.6 19.7 18.2 21.8 10.4 2.1 20.7-3.2 25.8-13.1"
        stroke="url(#cadence-mark-gradient)"
        strokeWidth="12"
        strokeLinecap="butt"
      />
    </svg>
  );
}
