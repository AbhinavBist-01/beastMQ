import React from "react";

interface BeastLogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export function BeastLogo({ className = "", size = 28, glow = true }: BeastLogoProps) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {glow && (
        <div
          className="absolute inset-0 rounded-lg bg-[#00FF66] opacity-30 blur-md pointer-events-none transition-opacity duration-300 group-hover:opacity-60"
          style={{ width: size, height: size }}
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 transition-transform duration-300 group-hover:scale-105"
      >
        <polygon
          points="16,2 29,8 26,24 16,30 6,24 3,8"
          fill="#0D1117"
          stroke="#00FF66"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M10 9L16 16L13 22"
          stroke="#00FF66"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M22 9L16 16L19 22"
          stroke="#00FF66"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="16" r="2.25" fill="#00FF66" />
        <line
          x1="16"
          y1="5"
          x2="16"
          y2="10"
          stroke="#4EFE82"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function BeastBrand({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight text-white ${className}`}>
      <span className="text-base font-mono tracking-wider font-extrabold flex items-center">
        beast<span className="text-[#00FF66]">MQ</span>
      </span>
    </div>
  );
}
