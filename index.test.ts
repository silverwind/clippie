import {userEvent} from "vitest/browser";
import {clippie, type ClippieContent, type ClippieOpts} from "./index.ts";

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

async function onEvent<T>(fn: () => Promise<T>, type = "click", trigger = () => userEvent.click(document.body)): Promise<T> {
  const result = new Promise<T>(resolve => {
    document.addEventListener(type, () => resolve(fn()), {once: true});
  });
  await trigger();
  return result;
}

afterEach(() => {
  delete (navigator as any).clipboard;
  delete (document as any).execCommand;
});

describe("clippie", {concurrent: false}, () => {
  test.for<[string, ClippieContent, Record<string, BlobPart>, ClippieOpts?]>([
    ["string", "foo", {"text/plain": "foo"}],
    ["strings", ["foo", "bar"], {"text/plain": "bar"}, {reject: true}],
    ["image and text", [img, "text"], {"image/png": img, "text/plain": "text"}, {reject: true}],
    ["blob with empty type", new Blob(["foo"]), {"text/plain": "foo"}, {reject: true}],
  ])("%s", async ([_name, content, expected, opts]) => {
    const clipboard = mockClipboard();
    expect(await clippie(content, opts)).toEqual(true);
    expect(clipboard.map(item => item.types)).toEqual([Object.keys(expected)]);
    for (const [type, part] of Object.entries(expected)) {
      expect(await (await clipboard[0].getType(type)).bytes()).toEqual(await new Blob([part]).bytes());
    }
  });

  describe("fallback and error paths", () => {
    test.for([
      ["uses fallback when navigator.clipboard.write is missing", [true, true], true],
      ["fallback returns false when execCommand fails", [true, false], false],
    ] as const)("array %s", async ([_name, results, expected]) => {
      mockClipboard(false);
      const values: string[] = [];
      (document as any).execCommand = () => {
        values.push(document.querySelector("textarea")!.value);
        return results[values.length - 1];
      };
      expect(await clippie(["foo", "bar"])).toEqual(expected);
      expect(values).toEqual(["foo", "bar"]);
      expect(document.querySelectorAll("textarea")).toHaveLength(0);
    });

    test("blob returns false when navigator.clipboard.write is missing", async () => {
      mockClipboard(false);
      expect(await clippie(blob)).toEqual(false);
    });

    test("write failure rethrows when reject is true and returns false when reject is false", async () => {
      mockClipboard(() => Promise.reject(new Error("nope")));
      await expect(clippie(blob, {reject: true})).rejects.toThrow("nope");
      expect(await clippie(blob)).toEqual(false);
    });
  });

  describe("real clipboard", () => {
    test("string and image", async () => {
      expect(await onEvent(async () => [
        await clippie("hello", {reject: true}),
        await clippie([img, "hello"], {reject: true}),
      ])).toEqual([true, true]);
    });

    test("execCommand fallback", async () => {
      mockClipboard(false);
      expect(await onEvent(() => clippie("a\r\nb", {reject: true}))).toEqual(true);
    });

    test("execCommand fallback copies inside the topmost modal dialog or fullscreen element", async () => {
      mockClipboard(false);
      const copy = async () => {
        let target = "";
        document.addEventListener("copy", e => { target = (e.target as Element).tagName; }, {once: true});
        await clippie("x", {reject: true});
        return target;
      };
      document.body.innerHTML = "<dialog><button></button></dialog>".repeat(3);
      const [a, b, c] = document.querySelectorAll("dialog");
      a.showModal();
      c.showModal();
      b.showModal();
      expect(await onEvent(copy, "click", () => userEvent.click(b.querySelector("button")!))).toEqual("TEXTAREA");
      b.close();
      c.close();
      (document.activeElement as HTMLElement).blur();
      expect(await onEvent(copy, "keydown", () => userEvent.keyboard("a"))).toEqual("TEXTAREA");
      document.body.innerHTML = "<div><button></button></div>";
      const fullscreen = document.querySelector("div")!;
      const clickButton = () => userEvent.click(fullscreen.querySelector("button")!);
      await onEvent(() => fullscreen.requestFullscreen(), "click", clickButton);
      expect(await onEvent(copy, "click", clickButton)).toEqual("TEXTAREA");
      await document.exitFullscreen();
    });
  });
});
