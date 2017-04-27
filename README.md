# Atomic DOM

Atomic DOM is a low-level library for constructing DOM and HTML. It contains the
minimum set of operations required to describe a tree of HTML. As you build your
tree, you can either stream HTML, or materialize a DOM `DocumentFragment`.

## Example

With the same sequence of API calls, we can produce streaming HTML output on the
server, or live DOM in the browser.

```ts
import { Tree } from 'atomic-dom';

export function buildUIComponent(tree: Tree, name: string) {
  tree.openElement('div');
    tree.setAttribute('class', 'welcome');
    tree.openElement('h1');
      tree.setAttribute('class', 'welcome--header');
      tree.appendText(`Hello, ${name}!`);
    tree.closeElement();
  tree.closeElement();
}
```

```ts
// Node.js
import { buildUIComponent } from './app';
import express = require('express');
import { StreamingHTMLTree } from 'atomic-dom';

let app = express();

app.get('/', (req, res) => {
  let tree = new StreamingHTMLTree({ stream: res });
  buildUIComponent(tree, "Kris");
  res.end();
});
```

```
GET /

<div class="welcome"><h1 class="welcome--header">Hello, Kris!</h1></div>
```

```ts
// Browser
import { buildUIComponent } from './app';
import { DOMTree } from 'atomic-dom';

let tree = new DOMTree();
buildUIComponent(tree, "Chris");

// Insert the built DOM into the document body.
DOMTree.insertTreeBefore(document.body, tree);
```


## Why?

### Streaming

When serializing HTML, it can be tricky to know when to flush if the DOM being
constructed is at all mutable. This API requires that you construct one element
at a time, and "seal" the element shut by calling `.closeElement()`. This is a
perfect time to close the element and write to the stream.

Additionally, we can enforce the constraint that attributes must always be set
before child nodes are appended.

### Decoupled Operations

JSX's `React.createElement` is used by collecting properties, attributes and child nodes
upfront:

```js
React.createElement(
  "div",
  { foo: "bar", "class": "bang" },
  React.createElement(
    "span",
    null,
    "Hello, world!"
  )
);
```

Atomic DOM flattens this recursive data structure into a linearized sequence
calls, which is more convenient to use with a VM architecture like Glimmer.

### Worker Rendering

It would be straightforward to allow `DOMTree` to run in a worker (where there
is no DOM access) and build a list of instructions. Those instructions can be
efficiently transfered to the main thread, where the entire tree can be built
and applied atomically (thus the library name).

### Rendering Performance

This library is based on the proposal in
https://github.com/whatwg/dom/issues/270. If a similar API is adopted by
browsers, the immutable and side-effect-free guarantees could theoretically lead
to improved rendering performance, as engines can optimize a rendering path
without having to guard for mutations or querying of element properties mid-render.
