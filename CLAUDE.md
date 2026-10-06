# Send or Bail? content engine

Daily trail decision game on Instagram (@sendorbail). Each morning one fictional on-trail scenario
goes out as a 9 second Reel; viewers comment their call (usually SEND or BAIL). No results posts,
no first comments, no web app. Everything is rendered from `data/questions.json`.

## Setup in a fresh session

```
npm ci
export REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
npm run validate && npm test
```

## Weekly run (the routine does this every Sunday)

1. Read `data/questions.json`. Note the last scheduled date and every existing headline and scenario.
2. Write 7 new scenarios to `data/candidates/<first-date>.json` following the editorial rules below.
   Fields per candidate: `category, type, scenario, choiceA, choiceB, map (hazards, optional
   milesOut/milesToGoal/gainFt/window/goalLabel), headline, caption, hashtags, realityCheck?`.
   Leave out `id`, `date`, `status`, `seed`; `plan-week` assigns them.
3. `npm run cli -- plan-week data/candidates/<first-date>.json` validates, assigns the next 7 dates,
   renders each Reel and stages `media/<date>/`. Fix any lint error it reports and rerun.
4. Commit everything (questions.json, candidates, media) and push. Media links are pinned to the
   commit SHA, so commit before scheduling.
5. `npm run cli -- schedule <first-date>` writes `out/schedule/<first-date>.json`: one Buffer payload
   per day (text, dueAt in ET, videoUrl, thumbnailOffsetMs). Create each as an Instagram Reel on the
   `sendorbail` channel (id `6ac510396a5c39ccb6311648`, organization `6a49474ab297c51c7661e1c5`) with
   `mode: customScheduled`, `schedulingType: automatic`, `shouldShareToFeed: true`, no first comment.
   Confirm each returned status is `scheduled`, then record the Buffer post ids in `data/posts.json`,
   commit and push.
6. Finish with a short summary: the 7 headlines, dates, and anything that needs Emily's attention.

Posts go out at 7:30am ET. Never post results, never set a first comment, never auto-publish to any
channel other than `sendorbail`.

## Editorial rules (apply to every generated string)

- Trail choices only: a decision the viewer makes in the moment, on the trail, about route,
  conditions, gear or pace. Both choices are actions. Reject verdicts on other people and anything
  at camp, in a tent or off the trail.
- Default choices are SEND IT / BAIL (keywords SEND / BAIL). Use a custom pair only when SEND/BAIL
  makes no sense (shoes ON/OFF, GPS/SIGN, CROSS/AROUND). Keywords: one uppercase word, different.
- Answerable in under 10 seconds. 2 to 3 short scenario lines with concrete numbers (miles, minutes,
  feet gained, temperature). Elevation is always feet gained.
- Fictional and stylized. No real peaks, trails, parks, brands or people.
- Tone: outdoorsy, smart, slightly irreverent, gender neutral, credible to people who go outside.
  Never mock a group of people. Humor lives in the situation, not in joke formats.
- Mix per week: at least 3 judgment, 1 route, 1 gear, at most 1 pace, and 4 or more categories
  (Trail running, Hiking, Backpacking, Climbing, Skiing, Mountain biking, Navigation, Endurance,
  Paddling, Scrambling). Spread hazards; don't repeat last week's setups.
- Headline: short, punchy, fits two lines at 100px (under 36 characters). Caption: one short line,
  blank line, then exactly `Comment KEYWORD_A or KEYWORD_B.` Nothing after it.
- Hashtags: exactly 5, lowercase, broad hiking and outdoors first (`#hiking #outdoors #mountains
  #getoutside #backcountry #hikingadventures`), one for the sport, always `#sendorbail` last.
- `realityCheck` (1 to 2 calm sentences) when the hazard is real: storm, avalanche, whiteout, heat,
  snowfield, swift water. It is stored, not posted.
- No em-dashes or en-dashes anywhere. No emoji on screen; captions carry none either.

## Layout

- `src/brand.ts` holds every brand string. `src/schema.ts` is the data model (zod).
- `src/render/` is Remotion: `map/` (terrain, trail, icons), `reels/PreVoteReel.tsx`,
  `stills/Cover.tsx` (also the 4:5 feed image). `src/render/run.ts` renders from Node.
- `src/music/synth.ts` generates the royalty-free beds in `assets/music/`; `npm run music` rebuilds them.
- `src/tally/` and `reels/ResultsReel.tsx` exist but are switched off (no results posts).
- `media/<date>/` is what Buffer downloads. Keep the repo public and never rewrite history there.
