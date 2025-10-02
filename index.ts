/** The content to copy */
export type ClippieContent = string | Blob | Array<string | Blob>;

/** A boolean indicating whether the copying was successful. */
export type ClippieResult = boolean;

/** Options for the module */
export type ClippieOpts = {
  /** Whether to reject on unexpected errors. */
  reject?: boolean;
};

/** Copies `content` to the clipboard, which can be text, images or a array of these. */
export async function clippie(content: ClippieContent, {reject = false}: ClippieOpts = {}): Promise<ClippieResult> {
  try {
    if (Array.isArray(content)) {
      if (!navigator?.clipboard?.write) {
        for (const c of content) {
          if (typeof c === "string") {
            const result = fallback(c);
            if (!result) return result;
          }
        }
        return true;
      }
      await navigator.clipboard.write([
        new ClipboardItem(Object.fromEntries(content.map(c => {
          return [(c as any)?.type ?? "text/plain", c];
        }))),
      ]);
      return true;
    } else if (content instanceof Blob) {
      await navigator.clipboard.write([new ClipboardItem({[content.type]: content})]);
      return true;
    } else {
      try {
        await navigator.clipboard.writeText(String(content));
        return true;
      } catch {
        return fallback(content);
      }
    }
  } catch (err) {
    if (reject) throw err;
    return false;
  }
}

function fallback(content: string): boolean {
  if (!document.execCommand) return false; // eslint-disable-line @typescript-eslint/no-deprecated
  const el = document.createElement("textarea");
  el.value = String(content);
  el.style.clipPath = "inset(50%)";
  el.ariaHidden = "true";
  document.body.append(el);
  try {
    el.select();
    return document.execCommand("copy"); // eslint-disable-line @typescript-eslint/no-deprecated
  } finally {
    el.remove();
  }
}
