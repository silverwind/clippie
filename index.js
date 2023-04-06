export async function clippie(data, {reject = false} = {}) {
  try {
    const contents = Array.isArray(data) ? data : [data];
    let numSuccess = 0;
    for (const content of contents) {
      if (content instanceof Blob) {
        const item = new ClipboardItem({[content.type]: content});
        await navigator.clipboard.write([item]);
        numSuccess++;
      } else {
        try {
          await navigator.clipboard.writeText(String(content));
          numSuccess++;
        } catch {
          if (!document.execCommand) continue;
          const el = document.createElement("textarea");
          el.value = String(content);
          el.style.top = 0;
          el.style.left = 0;
          el.style.position = "fixed";
          el.style.clipPath = "inset(50%)";
          el.ariaHidden = "true";
          document.body.appendChild(el);
          try {
            el.select();
            const success = document.execCommand("copy");
            if (success) numSuccess++;
          } finally {
            document.body.removeChild(el);
          }
        }
      }
    }
    return numSuccess === contents.length;
  } catch (err) {
    if (reject) throw err;
    return false;
  }
}
