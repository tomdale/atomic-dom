import { NodeToken, Bounds, TreeBuilder } from './dom-tree';
import { FlushError } from "./errors";
import { escapeAttr, escapeHTML, escapeComment } from "./escaping";

const EMPTY_BOUNDS: Readonly<Bounds> = Object.freeze({
  firstNode: null,
  lastNode: null
});

export interface WritableStream {
  write(data: string): void;
  end(data?: string): void;
}

class StreamingHTMLTree implements TreeBuilder {
  stream: WritableStream;

  private _flushed = false;
  private _stack: string[] = [];

  constructor({ stream }: { stream: WritableStream }) {
    this.stream = stream;
  }

  openElement(tag: string, ns: string): NodeToken<Element> {
    this.flush();
    this._stack.push(tag);
    this._flushed = false;
    this.stream.write(`<${tag}`)

    return -1;
  }

  closeElement() {
    this.flush();
    this.stream.write(`</${this._stack.pop()}>`);
  }

  setAttribute(attrName: string, attrValue: string | null | undefined) {
    if (this._flushed) { throw new FlushError(attrName); }
    this.stream.write(` ${attrName}="${escapeAttr(attrValue+'')}"`);
  }

  appendText(text: string) {
    this.flush();
    this.stream.write(escapeHTML(text));
    return -1;
  }

  appendComment(text: string) {
    this.flush();
    this.stream.write(`<!--${escapeComment(text)}-->`);
    return -1;
  }

  appendHTML(text: string) {
    this.flush();
    this.stream.write(text);
    return EMPTY_BOUNDS;
  }

  private flush() {
    if (this._flushed || this._stack.length === 0) { return; }
    this.stream.write('>');
    this._flushed = true;
  }
}

export default StreamingHTMLTree;
