import {Config} from '@remotion/cli/config';
// Render in a headless Chrome shell (full Chrome produced mosaic frames in the PG19 build).
// Set REMOTION_BROWSER_EXECUTABLE to a chrome-headless-shell binary, or let Remotion download one.
if (process.env.REMOTION_BROWSER_EXECUTABLE) Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
Config.setVideoImageFormat('png');
Config.setConcurrency(4);
