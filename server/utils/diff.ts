import { createTwoFilesPatch } from "diff";

export function buildUnifiedDiff(
  filename: string,
  original: string,
  patched: string
) {
  return createTwoFilesPatch(
    filename,
    filename,
    original,
    patched,
    "before",
    "after",
    // what does this signify here?
    // basically tells diff, hey! i wanna see upto 3 lines of code before and after the line of the code that changes
    { context: 3 }
  );
}
