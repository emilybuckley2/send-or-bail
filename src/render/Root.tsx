import React from "react";
import { Composition, Still } from "remotion";
import "./fonts";
import questions from "../../data/questions.json";
import { Cover } from "./stills/Cover";
import type { Question } from "../schema";

const sample = questions[0] as Question;

export const Root: React.FC = () => (
  <>
    <Still id="Cover" component={Cover} width={1080} height={1920} defaultProps={{ q: sample }} />
  </>
);
