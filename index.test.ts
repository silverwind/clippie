import {clippie} from "./index.ts";

const img = new Blob([base64ToArrayBuffer("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAEElEQVR4AWP8z4APjEpjBQCgmgoBKVWovwAAAABJRU5ErkJggg==")], {type: "image/png"});

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function mockClipboard() {
  const items: any[] = [];
  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText(text: string): Promise<void> { items.push(text); return Promise.resolve(); },
      write(entries: ClipboardItem[]): Promise<void> {
        for (const entry of entries) items.push(entry);
        return Promise.resolve();
      },
    },
    configurable: true,
  });
  return items;
}

test("string", async () => {
  const clipboard = mockClipboard();
  expect(await clippie("foo")).toEqual(true);
  expect(clipboard).toEqual(["foo"]);
});

test("blob", async () => {
  const clipboard = mockClipboard();
  const foo = new Blob(["foo"], {type: "text/plain"});
  expect(await clippie(foo)).toEqual(true);
  expect(clipboard).toHaveLength(1);
  expect(await (await clipboard[0].getType("text/plain")).text()).toEqual("foo");
});

test("strings", async () => {
  const clipboard = mockClipboard();
  expect(await clippie(["foo", "bar"], {reject: true})).toEqual(true);
  expect(clipboard).toHaveLength(1);
  expect(await (await clipboard[0].getType("text/plain")).text()).toEqual("bar");
});

test("blob and strings", async () => {
  const clipboard = mockClipboard();
  const bar = new Blob(["bar"], {type: "text/plain"});
  expect(await clippie(["foo", bar], {reject: true})).toEqual(true);
  expect(clipboard).toHaveLength(1);
  expect(await (await clipboard[0].getType("text/plain")).text()).toEqual("bar");
});

test("image", async () => {
  const clipboard = mockClipboard();
  expect(await clippie([img], {reject: true})).toEqual(true);
  expect(clipboard).toHaveLength(1);
  expect((await clipboard[0].getType("image/png")).size).toEqual(img.size);
});

test("image and text", async () => {
  const clipboard = mockClipboard();
  expect(await clippie([img, "text"], {reject: true})).toEqual(true);
  expect(clipboard).toHaveLength(1);
  const item = clipboard[0];
  expect(item.types).toEqual(["image/png", "text/plain"]);
  expect((await item.getType("image/png")).size).toEqual(img.size);
  expect(await (await item.getType("text/plain")).text()).toEqual("text");
});

test("blob with empty type", async () => {
  const clipboard = mockClipboard();
  const foo = new Blob(["foo"]);
  expect(await clippie(foo, {reject: true})).toEqual(true);
  expect(clipboard).toHaveLength(1);
  expect(await (await clipboard[0].getType("text/plain")).text()).toEqual("foo");
});

test("blob with empty type in array", async () => {
  const clipboard = mockClipboard();
  const foo = new Blob(["foo"]);
  expect(await clippie([foo], {reject: true})).toEqual(true);
  expect(clipboard).toHaveLength(1);
  expect(await (await clipboard[0].getType("text/plain")).text()).toEqual("foo");
});
