import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import { continueRender, delayRender } from "remotion";

const handle = delayRender("fonts");
document.fonts.ready.then(() => continueRender(handle));
