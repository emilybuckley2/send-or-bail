import React from "react";
import { Composition, Still } from "remotion";
import "./fonts";
import questions from "../../data/questions.json";
import { Cover } from "./stills/Cover";
import { Feed } from "./stills/Feed";
import { PREVOTE_FRAMES, PreVoteReel } from "./reels/PreVoteReel";
import { RESULTS_FRAMES, ResultsReel } from "./reels/ResultsReel";
import type { Question, Result } from "../schema";

const sample = questions[0] as Question;
const sampleResult: Result = {
  questionId: sample.id, countA: 58, countB: 41, unclear: 3, source: "manual", tallied_at: "",
  topComments: [
    { handle: "@ridge_rat", text: "Thunder is the sky telling you to bail. I listen.", choice: "B" },
    { handle: "@vert.junkie", text: "4 miles is like 40 minutes. Send it and run.", choice: "A" },
    { handle: "@slowhiker", text: "Bail. The ridge will be there next week.", choice: "B" },
  ],
};

export const Root: React.FC = () => (
  <>
    <Still id="Cover" component={Cover} width={1080} height={1920} defaultProps={{ q: sample }} />
    <Still id="Feed" component={Feed} width={1080} height={1350} defaultProps={{ q: sample }} />
    <Composition id="PreVote" component={PreVoteReel} width={1080} height={1920} fps={30}
      durationInFrames={PREVOTE_FRAMES} defaultProps={{ q: sample, music: null }} />
    <Composition id="Results" component={ResultsReel} width={1080} height={1920} fps={30}
      durationInFrames={RESULTS_FRAMES} defaultProps={{ q: sample, r: sampleResult, music: null }} />
    <Still id="ResultsStill" component={ResultsReel} width={1080} height={1920}
      defaultProps={{ q: sample, r: sampleResult, music: null, still: true }} />
  </>
);
