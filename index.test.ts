import {userEvent} from "vitest/browser";
import {clippie} from "./index.ts";

const img = new Blob([Uint8Array.fromBase64("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAEElEQVR4AWP8z4APjEpjBQCgmgoBKVWovwAAAABJRU5ErkJggg==")], {type: "image/png"});
const blob = new Blob(["x"], {type: "text/plain"});

function mockClipboard(write?: false | Clipboard["write"]) {
  const items: ClipboardItem[] = [];
  const clipboard: Partial<Clipboard> = write === false ? {} : {
    write: write ?? (entries => {
      items.push(...entries);
      return Promise.resolve();
    }),
  };
  Object.defineProperty(navigator, "clipboard", {value: clipboard, configurable: true});
  return items;
}

function mockExecCommand(impl: () => boolean = () => true) {
  const values: string[] = [];
  (document as any).execCommand = () => {
    values.push(document.querySelector("textarea")!.value);
    return impl();
  };
  return values;
}

/** Runs `fn` in a click handler because browsers grant clipboard access only on user gesture */
async function onClick<T>(fn: () => Promise<T>): Promise<T> {
  const result = new Promise<T>(resolve => {
    document.body.addEventListener("click", () => resolve(fn()), {once: true});
  });
  await userEvent.click(document.body);
  return result;
}

afterEach(() => {
  delete (navigator as any).clipboard; // restore the real implementations shadowed by the mocks
  delete (document as any).execCommand;
});

describe.sequential("clippie", () => { // the tests mutate navigator.clipboard, so they can not overlap
  test("string", async () => {
    const clipboard = mockClipboard();
    expect(await clippie("foo")).toEqual(true);
    expect(clipboard).toHaveLength(1);
    expect(await (await clipboard[0].getType("text/plain")).text()).toEqual("foo");
  });

  test("strings", async () => {
    const clipboard = mockClipboard();
    expect(await clippie(["foo", "bar"], {reject: true})).toEqual(true);
    expect(clipboard).toHaveLength(1);
    expect(await (await clipboard[0].getType("text/plain")).text()).toEqual("bar");
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

  describe("fallback and error paths", () => {
    test("array uses fallback when navigator.clipboard.write is missing", async () => {
      mockClipboard(false);
      const values = mockExecCommand();
      expect(await clippie(["foo", "bar"])).toEqual(true);
      expect(values).toEqual(["foo", "bar"]);
      expect(document.querySelectorAll("textarea")).toHaveLength(0);
    });

    test("array fallback returns false when execCommand fails", async () => {
      mockClipboard(false);
      let count = 0;
      mockExecCommand(() => ++count === 1);
      expect(await clippie(["foo", "bar"])).toEqual(false);
    });

    test("blob returns false when navigator.clipboard.write is missing", async () => {
      mockClipboard(false);
      expect(await clippie(blob)).toEqual(false);
    });

    test("rethrows when reject is true and write fails", async () => {
      mockClipboard(() => Promise.reject(new Error("nope")));
      await expect(clippie(blob, {reject: true})).rejects.toThrow("nope");
    });

    test("returns false when reject is false and write fails", async () => {
      mockClipboard(() => Promise.reject(new Error("nope")));
      expect(await clippie(blob)).toEqual(false);
    });
  });

  describe("real clipboard", () => {
    test("string and image", async () => {
      expect(await onClick(async () => [
        await clippie("hello", {reject: true}),
        await clippie([img, "hello"], {reject: true}),
      ])).toEqual([true, true]);
    });

    test("execCommand fallback", async () => {
      mockClipboard(false);
      expect(await onClick(() => clippie("a\r\nb", {reject: true}))).toEqual(true);
    });
  });
});
