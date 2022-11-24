export async function clippie(content) {
  try {
    if (content instanceof Blob) {
      const item = new ClipboardItem({[content.type]: content}); // eslint-disable-line no-undef
      await navigator.clipboard.write([item]);
    } else {
      try {
        await navigator.clipboard.writeText(content);
      } catch {
        return fallback(content);
      }
    }
    return true;
  } catch {
    return false;
  }
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
