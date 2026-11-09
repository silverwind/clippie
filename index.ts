/** A single copyable item */
export type ClippieCopyable = string | Blob;

/** The content to copy */
export type ClippieContent = ClippieCopyable | Array<ClippieCopyable>;

/** A boolean indicating whether the copying was successful */
export type ClippieResult = boolean;

/** Options for the module */
export type ClippieOpts = {
  /** Whether to reject on unexpected errors */
  reject?: boolean;
};

/** Copies `content` to the clipboard, which can be text, images or an array of these */
export async function clippie(content: ClippieContent, {reject}: ClippieOpts = {}): Promise<ClippieResult> {
  try {
    const items = ([] as ClippieCopyable[]).concat(content);
    const isText = items.length > 0 && items.every(c => typeof c === "string");
    if (window.ClipboardItem && navigator.clipboard?.write) {
      try {
        await navigator.clipboard.write([new ClipboardItem(Object.fromEntries(
          items.map(c => {
            const type = (c as Blob).type || "text/plain";
            return [type, new Blob([c], {type})];
          }),
        ))]);
        return true;
      } catch (err) {
        if (!isText) throw err;
      }
    }
    if (!isText) return false;
    let copied = false;
    const onCopy = (e: ClipboardEvent) => {
      e.stopImmediatePropagation();
      e.preventDefault();
      e.clipboardData!.setData("text/plain", items[items.length - 1]);
      copied = true;
    };
    document.addEventListener("copy", onCopy, {capture: true});
    try {
      document.execCommand("copy"); // eslint-disable-line @typescript-eslint/no-deprecated -- required fallback when Clipboard API is unavailable
    } finally {
      document.removeEventListener("copy", onCopy, {capture: true});
    }
    return copied;
  } catch (err) {
    if (reject) throw err;
    return false;
  }
}
