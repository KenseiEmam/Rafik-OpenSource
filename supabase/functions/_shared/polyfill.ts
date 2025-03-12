// polyfill.ts
// Import writeAll from std@0.81.0 to match what’s used in the error stack
import { writeAll } from "https://deno.land/std@0.81.0/io/util.ts";
if (typeof Deno.writeAll !== "function") {
  // @ts-ignore: we're adding a function to Deno that may not exist
  Deno.writeAll = writeAll;
}
