import { MismatchedElementException } from "./errors";

export type NodeToken<T> = number;

export interface Bounds {
  firstNode: NodeToken<Node> | null;
  lastNode: NodeToken<Node> | null;
}

export interface TreeBuilder {
  openElement(name: string, ns?: string): NodeToken<Element>;
  closeElement(): void;
  setAttribute(attrName: string, attrValue: string | null | undefined): void;
  appendText(text: string): NodeToken<Text>;
  appendComment(text: string): NodeToken<Comment>;
  appendHTML(html: string): Bounds;
}

class DOMTree implements TreeBuilder {
  private _nodes: Node[] = [];
  private _fragment: DocumentFragment = document.createDocumentFragment();
  private _current: Element | null;

  static async insertTreeBefore(parentElement: Element, tree: DOMTree, referenceNode: Node | null = null) {
    let element = tree.toFragment();
    parentElement.insertBefore(element, referenceNode);
  }

  openElement(name: string, ns: string = 'html'): NodeToken<Element> {
    let parentNode = this._current || this._fragment;
    let element = document.createElement(name);

    this._current = element;
    parentNode.appendChild(element);

    return this._pushNode(element);
  }

  closeElement() {
    if (this._current === null) {
      throw new MismatchedElementException(this._current);
    }

    this._current = this._current.parentElement || null;
  }

  setAttribute(attrName: string, attrValue: string | null | undefined) {
    let current = this._current;

    if (!current) { throw new MismatchedElementException(current); }
    current.setAttribute(attrName, attrValue as string);
  }

  appendText(text: string): NodeToken<Text> {
    return this._appendNode(document.createTextNode(text));
  }

  appendComment(text: string): NodeToken<Comment> {
    return this._appendNode(document.createComment(text));
  }

  appendHTML(html: string): Bounds {
    let parent = unwrap(this._current);
    let lastChild = parent.lastChild;

    parent.insertAdjacentHTML('beforeEnd', html);

    let firstNode = lastChild ? lastChild.nextSibling : parent.firstChild;
    let lastNode = parent.lastChild;

    return {
      firstNode: firstNode ? this._pushNode(firstNode) : null,
      lastNode: lastNode ? this._pushNode(lastNode) : null
    };
  }

  toFragment(): DocumentFragment {
    if (this._current) {
      throw new MismatchedElementException(this._current);
    }
    return this._fragment;
  }

  private _appendNode(node: Node) {
    unwrap(this._current).appendChild(node);
    return this._pushNode(node);
  }

  private _pushNode(node: Node) {
    return this._nodes.push(node) - 1;
  }
}

function unwrap<T>(val: T | null): T {
  if (val === null) { throw new Error("Expected value"); }
  return val;
}

export default DOMTree;
