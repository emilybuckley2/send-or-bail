import React from "react";
import { Composition, Still } from "remotion";
import "./fonts";
import questions from "../../data/questions.json";
import { Cover } from "./stills/Cover";
import { Feed } from "./stills/Feed";
import { PREVOTE_FRAMES, PreVoteReel } from "./reels/PreVoteReel";
import type { Question } from "../schema";

const sample = questions[0] as Question;

export const Root: React.FC = () => (
  <>
    <Still id="Cover" component={Cover} width={1080} height={1920} defaultProps={{ q: sample }} />
    <Still id="Feed" component={Feed} width={1080} height={1350} defaultProps={{ q: sample }} />
    <Composition id="PreVote" component={PreVoteReel} width={1080} height={1920} fps={30}
      durationInFrames={PREVOTE_FRAMES} defaultProps={{ q: sample, music: null }} />
  </>
);
