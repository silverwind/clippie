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
    const entries: Record<string, ClippieCopyable> = {};
    for (const c of ([] as ClippieCopyable[]).concat(content)) entries[(c as Blob).type || "text/plain"] = c;
    const text = entries["text/plain"];
    const {clipboard} = navigator;
    if (typeof text === "string" && Object.keys(entries).length === 1) {
      if (!clipboard?.writeText) return fallback(text);
      try {
        await clipboard.writeText(text);
        return true;
      } catch {
        return fallback(text);
      }
    }
    if (!window.ClipboardItem || !clipboard?.write) return false;
    await clipboard.write([new ClipboardItem(Object.fromEntries(
      Object.entries(entries).map(([type, c]) => [type, new Blob([c], {type})]),
    ))]);
    return true;
  } catch (err) {
    if (reject) throw err;
    return false;
  }
}

function fallback(text: string): boolean {
  let copied = false;
  const onCopy = (e: ClipboardEvent) => {
    e.stopImmediatePropagation();
    e.preventDefault();
    e.clipboardData!.setData("text/plain", text);
    copied = true;
  };
  document.addEventListener("copy", onCopy, {capture: true});
  try {
    document.execCommand("copy"); // eslint-disable-line @typescript-eslint/no-deprecated -- required fallback when Clipboard API is unavailable
  } finally {
    document.removeEventListener("copy", onCopy, {capture: true});
  }
  return copied;
}
