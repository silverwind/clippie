# clippie
[![](https://img.shields.io/npm/v/clippie.svg?style=flat)](https://www.npmjs.org/package/clippie) [![](https://img.shields.io/npm/dm/clippie.svg)](https://www.npmjs.org/package/clippie) [![](https://img.shields.io/bundlephobia/minzip/clippie.svg)](https://bundlephobia.com/package/clippie)

`clippie` copies text and images to clipboard in browsers. Text copy works on both secure and insecure contexts (via fallback), image copy requires a secure context (https or localhost).

## Usage

```js
import {clippie} from "clippie";

// copy text
const success = await clippie("text to copy");

// copy image
const success = await clippie(imageBlob);
```

## API
### clippie(content, [options])

- `content` *String*, *Blob*, *Array[String,Blob]*: Content to copy. If an Array is passed, will copy all items in sequence.
- `options` *Object*
  - `reject`: *Boolean*: Whether to reject on unexpected errors. Default: `false`.

Returns `true` when all content was successfully copied, `false` when not. Will never throw unless `reject` is `true`.

## Notes

Firefox needs `dom.events.asyncClipboard.clipboardItem` in `about:config` to enable image copying. Track [Bug 1619947](https://bugzilla.mozilla.org/show_bug.cgi?id=1619947) for updates.

© [silverwind](https://github.com/silverwind), distributed under BSD licence
