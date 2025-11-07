# clippie
[![](https://img.shields.io/npm/v/clippie.svg?style=flat)](https://www.npmjs.org/package/clippie) [![](https://img.shields.io/npm/dm/clippie.svg)](https://www.npmjs.org/package/clippie) [![](https://img.shields.io/bundlephobia/minzip/clippie.svg)](https://bundlephobia.com/package/clippie) [![](https://packagephobia.com/badge?p=clippie)](https://packagephobia.com/result?p=clippie)

`clippie` copies text and/or images to clipboard in browsers. Text copy works on both secure and insecure contexts (via fallback), image or array copy requires a secure context (https or localhost).

## Usage

```js
import {clippie} from "clippie";

// copy text
const success = await clippie("text to copy");

// copy image
const success = await clippie(imageBlob);

// copy image and text at once
const success = await clippie([imageBlob, "image description"]);
```

See [index.html](./index.html) for more example.

## API
### clippie(content, [options])

- `content` *string | Blob | Array\<string | Blob\>*: Content to copy. If an Array is passed, will construct a [`ClipboardItem`](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem) from each unique type.
- `options` *object*
  - `reject`: *boolean*: Whether to reject on unexpected errors. Default: `false`.

Returns `true` when all content was successfully copied, `false` when not. Will never throw unless `reject` is `true`.

© [silverwind](https://github.com/silverwind), distributed under BSD licence
