# clippie
[![](https://img.shields.io/npm/v/clippie.svg?style=flat)](https://www.npmjs.org/package/clippie) [![](https://img.shields.io/npm/dm/clippie.svg)](https://www.npmjs.org/package/clippie) [![](https://img.shields.io/bundlephobia/minzip/clippie.svg)](https://bundlephobia.com/package/clippie)

`clippie` copies text and blobs to clipboard in Browsers. It relies on modern APIs that require a secure origin but also includes a fallback so it works on insecure origins.

## Usage

```js
import {clippie} from "clippie";

// copy text
const success = await clippie("text to copy");

// copy blob, also works with images
const success = await clippie(new Blob("text to copy"), "text/plain");
```

## API
### clippie(content)

- `content` *String or Blob*: Content to copy.

Returns `true` when sucessful. Will throw all exceptions except when it falls back to another method.

© [silverwind](https://github.com/silverwind), distributed under BSD licence
