import { z } from "zod";

export const Hazard = z.enum([
  "storm", "sunset", "battery", "creek", "avalanche", "wet_rock",
  "blind_drop", "heat", "whiteout", "cutoff", "snowfield", "none",
]);
export type Hazard = z.infer<typeof Hazard>;

const Keyword = z.string().regex(/^[A-Z]+$/, "keyword must be one uppercase word");
const Choice = z.object({ label: z.string().min(1), keyword: Keyword });

export const Question = z
  .object({
    id: z.string().regex(/^si-\d{4}$/),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
    status: z.enum(["candidate", "approved", "scheduled", "posted", "rejected"]),
    category: z.string(),
    type: z.enum(["judgment", "gear", "route", "pace"]),
    scenario: z.array(z.string()).min(2).max(3),
    choiceA: Choice,
    choiceB: Choice,
    map: z.object({
      seed: z.number().int(),
      milesOut: z.number().optional(),
      milesToGoal: z.number().optional(),
      gainFt: z.number().optional(),
      hazards: z.array(Hazard),
      window: z.string().optional(),
      goalLabel: z.string().optional(),
    }),
    realityCheck: z.string().optional(),
    musicTrack: z.string().optional(),
    headline: z.string(),
    caption: z.string(),
    // Instagram allows at most 5 hashtags per post.
    hashtags: z.array(z.string().regex(/^#[a-z0-9]+$/)).max(5).optional(),
  })
  .refine((q) => q.choiceA.keyword !== q.choiceB.keyword, "keywords must differ");
export type Question = z.infer<typeof Question>;
