export async function clippie(content) {
  for (const c of Array.isArray(content) ? content : [content]) {
    if (c instanceof Blob) {
      const item = new ClipboardItem({[c.type]: c});
      await navigator.clipboard.write([item]);
    } else {
      try {
        await navigator.clipboard.writeText(c);
      } catch {
        return fallback(c);
      }
    }
  }
  return true;
}

function fallback(text) {
  if (!document.execCommand) return false;
  const el = document.createElement("textarea");
  el.value = text;
  el.style.top = 0;
  el.style.left = 0;
  el.style.position = "fixed";
  el.style.clip = "rect(0, 0, 0, 0)";
  el.ariaHidden = "true";
  document.body.appendChild(el);
  el.select();
  const success = document.execCommand("copy");
  document.body.removeChild(el);
  return success;
}
