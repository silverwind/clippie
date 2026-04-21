/** The content to copy */
export type ClippieContent = string | Blob | Array<string | Blob>;

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
    const items = [content].flat();
    if (navigator?.clipboard?.write) {
      await navigator.clipboard.write([new ClipboardItem(Object.fromEntries(
        items.map(c => [(c as Blob).type || "text/plain", c]),
      ))]);
      return true;
    }
    return items.every(c => typeof c === "string" && fallback(c));
  } catch (err) {
    if (reject) throw err;
    return false;
  }
}

function fallback(content: string): boolean {
  const el = document.createElement("textarea");
  el.value = content;
  el.readOnly = true;
  el.style.cssText = "clip-path:inset(50%);font-size:12pt;white-space:pre";
  el.ariaHidden = "true";
  document.body.append(el);
  try {
    el.select();
    el.setSelectionRange(0, content.length);
    return document.execCommand("copy"); // eslint-disable-line @typescript-eslint/no-deprecated
  } finally {
    el.remove();
  }
}
