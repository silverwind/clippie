import {userEvent} from "vitest/browser";
import {clippie, type ClippieContent, type ClippieOpts} from "./index.ts";

const img = new Blob([Uint8Array.fromBase64("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAEElEQVR4AWP8z4APjEpjBQCgmgoBKVWovwAAAABJRU5ErkJggg==")], {type: "image/png"});
const blob = new Blob(["x"], {type: "text/plain"});

const setClipboard = (value?: Partial<Clipboard>) => Object.defineProperty(navigator, "clipboard", {value, configurable: true});
const nope = () => Promise.reject(new Error("nope"));

function mockClipboard() {
  const items: ClipboardItem[] = [];
  const texts: string[] = [];
  setClipboard({
    write: entries => {
      items.push(...entries);
      return Promise.resolve();
    },
    writeText: text => {
      texts.push(text);
      return Promise.resolve();
    },
  });
  return {items, texts};
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
  vi.unstubAllGlobals();
});

describe("clippie", {concurrent: false}, () => {
  test.for<[string, ClippieContent, string, ClippieOpts?]>([
    ["string", "foo", "foo"],
    ["strings", ["foo", "bar"], "bar", {reject: true}],
    ["text overriding a blob", [blob, "text"], "text", {reject: true}],
  ])("%s uses writeText", async ([_name, content, expected, opts]) => {
    const {items, texts} = mockClipboard();
    expect(await clippie(content, opts)).toEqual(true);
    expect([items.length, texts]).toEqual([0, [expected]]);
  });

  test.for<[string, ClippieContent, Record<string, BlobPart>]>([
    ["image and text", [img, "text"], {"image/png": img, "text/plain": "text"}],
    ["blob with empty type", new Blob(["foo"]), {"text/plain": "foo"}],
  ])("%s uses write", async ([_name, content, expected]) => {
    const {items, texts} = mockClipboard();
    expect(await clippie(content, {reject: true})).toEqual(true);
    expect([texts.length, items.map(item => item.types)]).toEqual([0, [Object.keys(expected)]]);
    for (const [type, part] of Object.entries(expected)) {
      expect(await (await items[0].getType(type)).bytes()).toEqual(await new Blob([part]).bytes());
    }
  });

  describe("fallback and error paths", () => {
    test.for([
      ["uses fallback when navigator.clipboard is missing", () => setClipboard(), "event"],
      ["uses fallback when navigator.clipboard.writeText is missing", () => setClipboard({}), "event"],
      ["uses fallback when navigator.clipboard.writeText rejects", () => setClipboard({writeText: nope}), "event"],
      ["fallback selects a textarea when execCommand fires no copy event", () => setClipboard(), "textarea"],
      ["fallback returns false when execCommand copies nothing", () => setClipboard(), "none"],
    ] as const)("array %s", async ([_name, setup, mode]) => {
      setup();
      let data = "";
      (document as any).execCommand = () => {
        const textarea = document.querySelector("textarea");
        if (mode === "textarea" && textarea) {
          data = textarea.value;
          return true;
        }
        if (mode === "event") {
          const event = new ClipboardEvent("copy", {clipboardData: new DataTransfer()});
          document.dispatchEvent(event);
          data = event.clipboardData!.getData("text/plain");
        }
        return false;
      };
      expect(await clippie(["foo", "bar"], {reject: true})).toEqual(mode !== "none");
      expect(data).toEqual(mode === "none" ? "" : "bar");
      expect([document.querySelector("textarea"), document.dispatchEvent(new ClipboardEvent("copy", {cancelable: true}))]).toEqual([null, true]);
    });

    test("blob returns false when ClipboardItem is missing", async () => {
      vi.stubGlobal("ClipboardItem", undefined);
      expect(await clippie(blob)).toEqual(false);
    });

    test("blob write failure rethrows when reject is true and returns false when reject is false", async () => {
      setClipboard({write: nope});
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

    test("execCommand fallback keeps focus and selection, skips page copy handlers and works in a modal dialog", async () => {
      setClipboard();
      document.body.innerHTML = `<dialog><input value="hello world"></dialog>`;
      document.querySelector("dialog")!.showModal();
      const input = document.querySelector("input")!;
      input.focus();
      input.setSelectionRange(0, 5);
      let pageHandlerCalled = false;
      input.addEventListener("copy", () => { pageHandlerCalled = true; });
      input.addEventListener("keydown", e => e.preventDefault());
      expect(await onEvent(() => clippie("a\r\nb", {reject: true}), "keydown", () => userEvent.keyboard("a"))).toEqual(true);
      expect([document.activeElement, input.selectionStart, input.selectionEnd, pageHandlerCalled]).toEqual([input, 0, 5, false]);
    });

    test("execCommand fallback copies and restores focus with focus on a password field in a modal dialog", async () => {
      setClipboard();
      document.body.innerHTML = `<dialog><input type="password"></dialog>`;
      document.querySelector("dialog")!.showModal();
      const input = document.querySelector("input")!;
      input.focus();
      input.addEventListener("keydown", e => e.preventDefault());
      expect(await onEvent(() => clippie("x", {reject: true}), "keydown", () => userEvent.keyboard("a"))).toEqual(true);
      expect(document.activeElement).toEqual(input);
    });
  });
});
