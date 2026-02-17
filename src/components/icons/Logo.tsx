import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 40"
      aria-label="I.B.R.B TV Logo"
      {...props}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Background Logo: A subtle play icon in a circle */}
      <g transform="translate(5, 3)" opacity="0.1">
        <circle cx="12" cy="12" r="12" fill="hsl(var(--primary))" />
        <path d="M 9 7 L 17 12 L 9 17 Z" fill="hsl(var(--background))" />
      </g>

      <g>
        <text
          x="0"
          y="22"
          fontFamily="Poppins, sans-serif"
          fontSize="22"
          fontWeight="bold"
          fill="url(#logo-gradient)"
        >
          I.B.R.B TV
        </text>
        <text
          x="0"
          y="36"
          fontFamily="Poppins, sans-serif"
          fontSize="9"
          fontWeight="normal"
          fill="hsl(var(--muted-foreground))"
        >
          Evangelizando para Cristo
        </text>
      </g>
    </svg>
  );
}
