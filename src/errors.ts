/**
 * Thrown by StreamingHTMLTree if you attempt to set an opened element's
 * attributes after a child node has been appended. Because HTML may be being
 * streamed, attributes cannot be added once the opening tag has been closed.
 */
export class FlushError extends Error {
  constructor(attrName: string) {
    super(`Cannot set the '${attrName}' attribute after the element is closed or a child node has been appended.`);
  }
}

/**
 * Thrown by DOMTree if there are more calls to `closeElement()`
 * than there were to `openElement()`, or if the tree is used before all
 * `closeElement()` calls have been received.
 */
export class MismatchedElementException extends Error {
  constructor(current: Element | null) {
    let recent = current && ` Most recent opened element was '${current.tagName}'.`;
    let message = `DOMTree instance was executed but had mismatched openElement/closeElement calls.${recent}`;
    super(message);
  }
}
