import React from "react";
import type { Hazard } from "../../schema";

// One line-icon set on a 48 x 48 grid, stroked with currentColor.
const paths: Record<Exclude<Hazard, "none">, React.ReactNode> = {
  storm: (
    <>
      <path d="M14 30h20a8 8 0 0 0 0-16 11 11 0 0 0-21 3 6.5 6.5 0 0 0 1 13z" />
      <path d="M25 30l-5 8h7l-4 7" />
    </>
  ),
  sunset: (
    <>
      <path d="M6 34h36M12 40h24" />
      <path d="M14 34a10 10 0 0 1 20 0" />
      <path d="M24 12v6M10 20l4 4M38 20l-4 4" />
    </>
  ),
  battery: (
    <>
      <rect x="6" y="16" width="32" height="16" rx="3" />
      <path d="M42 21v6" />
      <path d="M11 21v6" strokeWidth={5} />
    </>
  ),
  creek: (
    <>
      <path d="M4 18c5-4 9 4 14 0s9 4 14 0 9 4 12 0" />
      <path d="M4 26c5-4 9 4 14 0s9 4 14 0 9 4 12 0" />
      <path d="M4 34c5-4 9 4 14 0s9 4 14 0 9 4 12 0" />
    </>
  ),
  avalanche: (
    <>
      <path d="M4 40l16-28 8 12 4-5 12 21z" />
      <path d="M18 28c3 2 5 0 8 2M24 34c3 2 6 0 9 2" />
    </>
  ),
  wet_rock: (
    <>
      <path d="M6 40l6-14 10-6 12 4 8 16z" />
      <path d="M30 6c-3 5-5 7-5 10a5 5 0 0 0 10 0c0-3-2-5-5-10z" />
    </>
  ),
  blind_drop: (
    <>
      <path d="M4 18h18l4 4v20" />
      <path d="M32 22h12M32 30h8M32 38h4" strokeDasharray="2 4" />
      <circle cx="12" cy="12" r="0.5" />
    </>
  ),
  heat: (
    <>
      <circle cx="24" cy="24" r="8" />
      <path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M14 34l-4 4" />
    </>
  ),
  whiteout: (
    <>
      <path d="M6 16h30M10 24h32M6 32h26M14 40h22" />
    </>
  ),
  cutoff: (
    <>
      <circle cx="24" cy="26" r="16" />
      <path d="M24 16v10l7 5M20 6h8" />
    </>
  ),
  snowfield: (
    <>
      <path d="M4 40L40 14v26z" />
      <path d="M14 36l4-3M22 36l8-6M30 36l6-4" />
      <path d="M12 8v10M7.7 10.5l8.6 5M16.3 10.5l-8.6 5" />
    </>
  ),
};

export const hazardName: Record<Hazard, string> = {
  storm: "Storm", sunset: "Sunset", battery: "Battery", creek: "Creek",
  avalanche: "Avalanche", wet_rock: "Wet rock", blind_drop: "Blind drop",
  heat: "Heat", whiteout: "Whiteout", cutoff: "Cutoff", snowfield: "Snowfield", none: "",
};

export const HazardIcon: React.FC<{ hazard: Hazard; size: number; color: string }> = ({ hazard, size, color }) =>
  hazard === "none" ? null : (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color}
      strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ color }}>
      {paths[hazard]}
    </svg>
  );
