import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 20"
      width="100"
      height="20"
      aria-label="IBRBTV Logo"
      {...props}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <text
        x="0"
        y="15"
        fontFamily="Poppins, sans-serif"
        fontSize="16"
        fontWeight="bold"
        fill="url(#logo-gradient)"
      >
        IBRBTV
      </text>
      <text
        x="68"
        y="15"
        fontFamily="Poppins, sans-serif"
        fontSize="16"
        fontWeight="normal"
        fill="hsl(var(--foreground))"
        opacity="0.8"
      >
        Replay
      </text>
    </svg>
  );
}
