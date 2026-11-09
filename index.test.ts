import {userEvent} from "vitest/browser";
import {clippie, type ClippieContent, type ClippieOpts} from "./index.ts";

const img = new Blob([Uint8Array.fromBase64("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAEElEQVR4AWP8z4APjEpjBQCgmgoBKVWovwAAAABJRU5ErkJggg==")], {type: "image/png"});
const blob = new Blob(["x"], {type: "text/plain"});

function mockClipboard(write?: Clipboard["write"]) {
  const items: ClipboardItem[] = [];
  const clipboard: Partial<Clipboard> = {
    write: write ?? (entries => {
      items.push(...entries);
      return Promise.resolve();
    }),
  };
  Object.defineProperty(navigator, "clipboard", {value: clipboard, configurable: true});
  return items;
}

const removeClipboardItem = () => vi.stubGlobal("ClipboardItem", undefined);
const removeWrite = () => Object.defineProperty(navigator, "clipboard", {value: {}, configurable: true});
const rejectWrite = () => mockClipboard(() => Promise.reject(new Error("nope")));

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
      ["uses fallback when ClipboardItem is missing", removeClipboardItem, true],
      ["uses fallback when navigator.clipboard.write is missing", removeWrite, true],
      ["uses fallback when navigator.clipboard.write rejects", rejectWrite, true],
      ["fallback returns false when execCommand fires no copy event", removeClipboardItem, false],
    ] as const)("array %s", async ([_name, setup, fires]) => {
      setup();
      let data = "";
      (document as any).execCommand = () => {
        if (!fires) return;
        const event = new ClipboardEvent("copy", {clipboardData: new DataTransfer()});
        document.dispatchEvent(event);
        data = event.clipboardData!.getData("text/plain");
      };
      expect(await clippie(["foo", "bar"], {reject: true})).toEqual(fires);
      expect(data).toEqual(fires ? "bar" : "");
      expect(document.dispatchEvent(new ClipboardEvent("copy", {cancelable: true}))).toEqual(true);
    });

    test("blob returns false when ClipboardItem is missing", async () => {
      removeClipboardItem();
      expect(await clippie(blob)).toEqual(false);
    });

    test("blob write failure rethrows when reject is true and returns false when reject is false", async () => {
      rejectWrite();
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
      removeClipboardItem();
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
  });
});
