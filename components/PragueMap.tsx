"use client";

interface PragueMapProps {
  activeDistrict: number;
  onSelectDistrict: (id: number) => void;
}

const DISTRICT_PATHS: Record<number, { d: string; cx: number; cy: number }> = {
  1: { d: "M185,155 L205,145 L220,150 L225,165 L215,175 L200,175 L185,170 Z", cx: 205, cy: 160 },
  2: { d: "M200,175 L215,175 L225,165 L235,170 L235,185 L225,195 L210,195 L200,185 Z", cx: 217, cy: 183 },
  3: { d: "M235,155 L255,150 L265,160 L260,175 L245,180 L235,170 L225,165 Z", cx: 247, cy: 165 },
  4: { d: "M200,195 L225,195 L240,205 L245,225 L235,240 L210,240 L195,225 L195,210 Z", cx: 220, cy: 218 },
  5: { d: "M155,165 L175,155 L185,155 L185,170 L180,185 L165,195 L150,190 L145,175 Z", cx: 165, cy: 177 },
  6: { d: "M130,130 L155,120 L175,125 L185,140 L185,155 L175,155 L155,165 L140,160 L130,145 Z", cx: 158, cy: 142 },
  7: { d: "M185,125 L210,120 L225,130 L225,145 L220,150 L205,145 L185,155 L185,140 Z", cx: 205, cy: 137 },
  8: { d: "M225,115 L250,110 L265,120 L265,140 L255,150 L235,155 L225,145 L225,130 Z", cx: 247, cy: 132 },
  9: { d: "M265,110 L290,105 L305,115 L305,135 L295,145 L275,150 L265,140 L265,120 Z", cx: 283, cy: 127 },
  10: { d: "M260,175 L280,170 L300,175 L305,195 L295,210 L275,210 L260,200 L255,185 Z", cx: 280, cy: 190 },
  11: { d: "M235,240 L255,235 L275,240 L280,260 L265,275 L245,275 L230,260 Z", cx: 257, cy: 257 },
  12: { d: "M195,240 L215,240 L235,240 L230,260 L220,275 L200,275 L185,260 Z", cx: 212, cy: 258 },
  13: { d: "M105,145 L130,130 L140,145 L140,160 L130,175 L115,175 L100,165 Z", cx: 122, cy: 155 },
  14: { d: "M295,145 L315,140 L335,150 L335,170 L320,180 L300,175 L290,165 Z", cx: 315, cy: 160 },
  15: { d: "M300,195 L320,180 L340,185 L345,205 L335,220 L315,220 L300,210 Z", cx: 322, cy: 200 },
  16: { d: "M155,195 L165,195 L180,200 L185,215 L175,230 L160,230 L145,220 L145,205 Z", cx: 163, cy: 213 },
  17: { d: "M95,115 L120,105 L135,115 L130,130 L115,135 L100,130 Z", cx: 115, cy: 120 },
  18: { d: "M245,90 L270,85 L290,90 L290,105 L275,110 L255,108 L245,100 Z", cx: 268, cy: 97 },
  19: { d: "M290,85 L315,80 L330,90 L330,110 L315,115 L300,108 L290,100 Z", cx: 310, cy: 97 },
  20: { d: "M275,240 L295,235 L310,245 L310,265 L295,275 L275,270 L270,255 Z", cx: 292, cy: 255 },
  21: { d: "M330,110 L355,105 L370,115 L365,135 L350,140 L335,135 L325,120 Z", cx: 350, cy: 122 },
  22: { d: "M335,220 L355,215 L375,225 L375,250 L360,260 L340,255 L330,240 Z", cx: 355, cy: 237 },
};

export function PragueMap({ activeDistrict, onSelectDistrict }: PragueMapProps) {
  return (
    <div className="relative w-full">
      <svg viewBox="80 70 310 220" className="w-full h-auto">
        {Object.entries(DISTRICT_PATHS).map(([idStr, { d, cx, cy }]) => {
          const id = Number(idStr);
          const isActive = id === activeDistrict;
          return (
            <g key={id} onClick={() => onSelectDistrict(id)} className="cursor-pointer">
              <path
                d={d}
                fill={isActive ? "var(--accent)" : "var(--secondary)"}
                stroke={isActive ? "var(--primary)" : "var(--border)"}
                strokeWidth={isActive ? 2 : 0.8}
                opacity={isActive ? 1 : 0.7}
                className="transition-all duration-200 hover:opacity-100 hover:fill-[var(--accent)]"
              />
              <text
                x={cx}
                y={cy + 4}
                textAnchor="middle"
                fontSize={isActive ? 9 : 7}
                fontWeight={isActive ? 700 : 400}
                fill={isActive ? "white" : "var(--foreground)"}
                className="pointer-events-none select-none"
              >
                {id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
