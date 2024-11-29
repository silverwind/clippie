import {clippie} from "./index.ts";

let clipboard: string[] = [];

const img = new Blob([base64ToArrayBuffer("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAEElEQVR4AWP8z4APjEpjBQCgmgoBKVWovwAAAABJRU5ErkJggg==")], {type: "image/png"});

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// nothing is implemented in jsdom
beforeAll(() => {
  // @ts-expect-error - this is writeable in happy-dom
  navigator.clipboard = {
    writeText: (text: string) => {
      return clipboard.push(text);
    },
    write: (items: any[]) => {
      for (const item of items) {
        clipboard.push(...item.data);
      }
    },
  };
  // @ts-expect-error  - this is writeable in happy-dom
  globalThis.ClipboardItem = class ClipboardItem {
    constructor(obj: any) {
      // @ts-expect-error - add this value for analysis purpose
      this.data = Object.values(obj);
    }
  };
});

beforeEach(() => { clipboard = []; });

test("string", async () => {
  expect(await clippie("foo")).toEqual(true);
  expect(clipboard).toEqual(["foo"]);
});

test("blob", async () => {
  const foo = new Blob(["foo"], {type: "text/plain"});
  expect(await clippie(foo)).toEqual(true);
  expect(clipboard).toEqual([foo]);
});

test("strings", async () => {
  expect(await clippie(["foo", "bar"], {reject: true})).toEqual(true);
  expect(clipboard).toEqual(["bar"]);
});

test("blob and strings", async () => {
  const bar = new Blob(["bar"], {type: "text/plain"});
  expect(await clippie(["foo", bar], {reject: true})).toEqual(true);
  expect(clipboard).toEqual([bar]);
});

test("image", async () => {
  expect(await clippie([img], {reject: true})).toEqual(true);
  expect(clipboard).toEqual([img]);
});

test("image and text", async () => {
  expect(await clippie([img, "text"], {reject: true})).toEqual(true);
  expect(clipboard).toEqual([img, "text"]);
});
