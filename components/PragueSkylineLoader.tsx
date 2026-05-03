"use client";

export function PragueSkylineLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <svg viewBox="0 0 400 100" className="w-64 h-16 overflow-visible">
        {/* Prague skyline silhouette */}
        <defs>
          <linearGradient id="skyline-fill" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="var(--accent)" stopOpacity="1">
              <animate attributeName="offset" values="0;1;0" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {/* Simplified Prague skyline */}
        <path
          d="M0,90 L20,90 L20,60 L30,60 L30,50 L35,45 L40,50 L40,60 L50,60 L50,70 L60,70 L60,55 L65,50 L70,55 L70,70 L80,70 L80,40 L85,35 L90,40 L90,70 L100,70 L100,50 L110,50 L110,30 L115,20 L120,30 L120,50 L130,50 L130,70 L140,70 L140,45 L145,40 L150,45 L150,70 L160,70 L160,55 L170,55 L170,65 L180,65 L180,35 L185,25 L190,35 L190,65 L200,65 L200,50 L210,50 L210,60 L220,60 L220,45 L225,40 L230,45 L230,60 L240,60 L240,70 L250,70 L250,55 L255,50 L260,55 L260,70 L270,70 L270,40 L275,30 L280,40 L280,70 L290,70 L290,60 L300,60 L300,75 L310,75 L310,55 L315,50 L320,55 L320,75 L330,75 L330,60 L340,60 L340,70 L350,70 L350,80 L360,80 L360,65 L370,65 L370,80 L380,80 L380,75 L390,75 L390,85 L400,85 L400,90 Z"
          fill="url(#skyline-fill)"
          stroke="var(--accent)"
          strokeWidth="0.5"
          opacity="0.8"
        />
        {/* River */}
        <path
          d="M0,95 Q100,92 200,95 Q300,98 400,95"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1"
          opacity="0.4"
          strokeDasharray="4 4"
        >
          <animate attributeName="stroke-dashoffset" values="0;-8" dur="1s" repeatCount="indefinite" />
        </path>
      </svg>
      <p className="text-xs text-muted-foreground mt-3 animate-pulse">Loading data...</p>
    </div>
  );
}
