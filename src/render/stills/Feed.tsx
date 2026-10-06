import React from "react";
import { AbsoluteFill } from "remotion";
import type { Question } from "../../schema";
import { color } from "../theme";
import { Cover } from "./Cover";

// 4:5 grid version: the cover's content band (no Reel safe-zone padding), cropped to 1080 x 1350.
export const Feed: React.FC<{ q: Question }> = ({ q }) => (
  <AbsoluteFill style={{ background: color.paper, overflow: "hidden" }}>
    <div style={{ position: "absolute", top: -205, left: 0, width: 1080, height: 1920 }}>
      <Cover q={q} />
    </div>
  </AbsoluteFill>
);
