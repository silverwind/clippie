import {clippie} from "./index.js";
import {Blob} from "blob-polyfill";

let clipboard = [];

// nothing is implemented in jsdom
beforeAll(() => {
  navigator.clipboard = {
    writeText: async text => clipboard.push(text),
    write: async items => {
      for (const item of items) {
        clipboard.push(await item.blob.text());
      }
    },
  };
  globalThis.ClipboardItem = class ClipboardItem {
    constructor(obj) {
      this.blob = Object.values(obj)[0];
    }
  };
});

beforeEach(() => clipboard = []);

test("string", async () => {
  expect(await clippie("foo")).toEqual(true);
  expect(clipboard).toEqual(["foo"]);
});

test("strings", async () => {
  expect(await clippie(["foo", "bar"])).toEqual(true);
  expect(clipboard).toEqual(["foo", "bar"]);
});

test("blob", async () => {
  const blob = new Blob(["foo"], {type: "text/plain"});
  expect(await clippie(blob)).toEqual(true);
  expect(clipboard.length).toEqual(1);
  expect(clipboard).toEqual(["foo"]);
});
