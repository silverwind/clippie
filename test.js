import {clippie} from "./index.js";
import {Blob} from "blob-polyfill";

let clipboard = [];

// nothing is implemented in jsdom
beforeAll(() => {
  navigator.clipboard = {
    writeText: async text => clipboard.push(text),
    write: async items => {
      for (const item of items) {
        clipboard.push(...item.data);
      }
    },
  };
  globalThis.ClipboardItem = class ClipboardItem {
    constructor(obj) {
      this.data = Object.values(obj);
    }
  };
});

beforeEach(() => clipboard = []);

test("string", async () => {
  expect(await clippie("foo")).toEqual(true);
  expect(clipboard.length).toEqual(1);
  expect(clipboard).toEqual(["foo"]);
});

test("blob", async () => {
  const foo = new Blob(["foo"], {type: "text/plain"});
  expect(await clippie(foo)).toEqual(true);
  expect(clipboard.length).toEqual(1);
  expect(clipboard).toEqual([foo]);
});

test("strings", async () => {
  expect(await clippie(["foo", "bar"], {reject: true})).toEqual(true);
  expect(clipboard.length).toEqual(1);
  expect(clipboard).toEqual(["bar"]);
});

test("blob and strings", async () => {
  const bar = new Blob(["bar"], {type: "text/plain"});
  expect(await clippie(["foo", bar], {reject: true})).toEqual(true);
  expect(clipboard.length).toEqual(1);
  expect(clipboard).toEqual([bar]);
});
