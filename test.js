import {clippie} from "./index.js";

// nothing is implemented in jsdom
test("copy", async () => {
  expect(await clippie("test")).toEqual(false);
});
