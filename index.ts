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
    const items = [content].flat();
    if (navigator?.clipboard?.write) {
      await navigator.clipboard.write([new ClipboardItem(Object.fromEntries(
        items.map(c => {
          const type = (c as Blob).type || "text/plain";
          return [type, new Blob([c], {type})];
        }),
      ))]);
      return true;
    }
    return items.every(c => {
      if (typeof c !== "string") return false;
      const d = document;
      const el = d.createElement("textarea");
      el.value = c;
      el.readOnly = true;
      el.style.cssText = "clip-path:inset(50%);font-size:12pt;white-space:pre";
      el.ariaHidden = "true";
      d.body.append(el);
      try {
        el.select();
        el.setSelectionRange(0, c.length);
        return d.execCommand("copy"); // eslint-disable-line @typescript-eslint/no-deprecated
      } finally {
        el.remove();
      }
    });
  } catch (err) {
    if (reject) throw err;
    return false;
  }
}
