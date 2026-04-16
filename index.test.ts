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

type MockClipboardOpts = {
  writeText?: (text: string) => Promise<void>;
  write?: false | ((entries: ClipboardItem[]) => Promise<void>);
};

function mockClipboard({writeText, write}: MockClipboardOpts = {}) {
  const items: any[] = [];
  const clipboard: {writeText: NonNullable<MockClipboardOpts["writeText"]>, write?: Exclude<MockClipboardOpts["write"], false>} = {
    writeText: writeText ?? ((text: string) => { items.push(text); return Promise.resolve(); }),
  };
  if (write !== false) {
    clipboard.write = write ?? ((entries: ClipboardItem[]) => {
      for (const entry of entries) items.push(entry);
      return Promise.resolve();
    });
  }
  Object.defineProperty(navigator, "clipboard", {value: clipboard, configurable: true});
  return items;
}

const originalExecCommand = document.execCommand; // eslint-disable-line @typescript-eslint/no-deprecated

function mockExecCommand(impl: (cmd: string) => boolean = () => true) {
  const calls: Array<{cmd: string, value: string}> = [];
  (document as any).execCommand = (cmd: string) => {
    const textareas = document.querySelectorAll("textarea");
    calls.push({cmd, value: textareas[textareas.length - 1].value});
    return impl(cmd);
  };
  return calls;
}

function removeExecCommand() {
  (document as any).execCommand = undefined;
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

describe.sequential("fallback and error paths", () => {
  afterEach(() => {
    (document as any).execCommand = originalExecCommand;
  });

  test("string falls back to execCommand when writeText rejects", async () => {
    mockClipboard({writeText: () => Promise.reject(new Error("denied"))});
    const calls = mockExecCommand();
    expect(await clippie("foo")).toEqual(true);
    expect(calls).toEqual([{cmd: "copy", value: "foo"}]);
    expect(document.querySelectorAll("textarea")).toHaveLength(0);
  });

  test("string returns false when writeText rejects and execCommand is missing", async () => {
    mockClipboard({writeText: () => Promise.reject(new Error("denied"))});
    removeExecCommand();
    expect(await clippie("foo")).toEqual(false);
  });

  test("array uses fallback when navigator.clipboard.write is missing", async () => {
    mockClipboard({write: false});
    const calls = mockExecCommand();
    expect(await clippie(["foo", "bar"])).toEqual(true);
    expect(calls).toEqual([{cmd: "copy", value: "foo"}, {cmd: "copy", value: "bar"}]);
  });

  test("array fallback returns false when execCommand fails", async () => {
    mockClipboard({write: false});
    let count = 0;
    mockExecCommand(() => ++count === 1);
    expect(await clippie(["foo", "bar"])).toEqual(false);
  });

  test("rethrows when reject is true and write fails", async () => {
    mockClipboard({write: () => Promise.reject(new Error("nope"))});
    await expect(clippie(new Blob(["x"], {type: "text/plain"}), {reject: true})).rejects.toThrow("nope");
  });

  test("returns false when reject is false and write fails", async () => {
    mockClipboard({write: () => Promise.reject(new Error("nope"))});
    expect(await clippie(new Blob(["x"], {type: "text/plain"}))).toEqual(false);
  });
});
