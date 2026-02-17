import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 55"
      aria-label="I.B.R.B TV Logo"
      {...props}
    >
      <text
        x="0"
        y="32"
        fontFamily="Poppins, sans-serif"
        fontSize="32"
        fontWeight="bold"
      >
        <tspan fill="hsl(var(--primary))">I.B.R.B </tspan>
        <tspan fill="hsl(var(--destructive))">TV</tspan>
      </text>
      <text
        x="0"
        y="50"
        fontFamily="Poppins, sans-serif"
        fontSize="14"
        fontWeight="normal"
        fill="hsl(var(--muted-foreground))"
      >
        Evangelizando para Cristo
      </text>
    </svg>
  );
}
