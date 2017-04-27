import { DOMTree, StreamingHTMLTree } from '../src/index';
import { TreeBuilder } from "../src/dom-tree";

const { test } = QUnit;

QUnit.module('DOM Construction');

async function fromDOM(tree: DOMTree): Promise<string> {
  let div = document.createElement('div');
  await DOMTree.insertTreeBefore(div, tree);
  return div.innerHTML;
}

async function fromHTML(tree: StreamingHTMLTree): Promise<string> {
  return (tree.stream as BufferedStream).buffer;
}

class BufferedStream {
  buffer = '';

  write(data: string) {
    this.buffer += data;
  }

  end(data?: string) {
  }
}

interface HTMLSerializer {
  (tree: TreeBuilder): Promise<string>;
}

interface TestFunction<T> {
  (tree: TreeBuilder, html: HTMLSerializer, assert: Assert):  Promise<T> | void;
}

function htmlTest<T>(label: string, testFn: TestFunction<T>) {
  test(`HTML - ${label}`, assert => {
    let stream = new BufferedStream();
    let tree = new StreamingHTMLTree({ stream });
    return testFn(tree, fromHTML, assert);
  });

  if (typeof document !== 'undefined') {
    test(`DOM - ${label}`, assert => {
      let tree = new DOMTree();
      return testFn(tree, fromDOM, assert);
    });
  }
}

htmlTest('can create elements', async function(tree, html, assert) {
  tree.openElement('span');
  tree.closeElement();

  assert.strictEqual(await html(tree), '<span></span>');
});

htmlTest('can assign attributes', async function(tree, html, assert) {
  tree.openElement('span');
  tree.setAttribute('disabled', '');
  tree.setAttribute('data-foo', 'yes');
  tree.setAttribute('null-attr', null);
  tree.setAttribute('undefined-attr', undefined);
  tree.closeElement();

  assert.strictEqual(await html(tree), '<span disabled="" data-foo="yes" null-attr="null" undefined-attr="undefined"></span>');
});

htmlTest('can append text nodes', async function(tree, html, assert) {
  tree.openElement('span');
    tree.setAttribute('disabled', '');
    tree.appendText('Hello ');
    tree.appendText('</World>');
  tree.closeElement();

  assert.strictEqual(await html(tree), '<span disabled="">Hello &lt;/World&gt;</span>');
});

htmlTest('can append comment nodes', async function(tree, html, assert) {
  tree.openElement('span');
    tree.setAttribute('disabled', '');
    tree.appendComment('FIXME');
  tree.closeElement();

  assert.strictEqual(await html(tree), '<span disabled=""><!--FIXME--></span>');
});

htmlTest('can append HTML', async function(tree, html, assert) {
  tree.openElement('span');
    tree.setAttribute('disabled', '');
    tree.appendHTML('<div><div class="hello"></div></div>text node!');
  tree.closeElement();

  assert.strictEqual(await html(tree), '<span disabled=""><div><div class="hello"></div></div>text node!</span>');
});

htmlTest('stress test', async function(tree, html, assert) {
  tree.openElement('span');
    tree.setAttribute('data-wat', 'bram');
    tree.openElement('aside');
      tree.setAttribute('data-bar', 'foo');
      tree.setAttribute('bâz', '<"hacked');
      tree.appendText('hello ');
      tree.appendHTML('here is <b>some</b> <ul><li>html</li></ul> for you')
      tree.appendText(' good');
      tree.appendHTML(' <bye></bye>');
    tree.closeElement();
    tree.openElement('my-custom-element');
      tree.openElement('i');
        tree.appendText('<hello world>');
      tree.closeElement();
    tree.closeElement();
  tree.closeElement();

  // Expected output is a regular expression here because Safari sanitizes `<`
  // in attribute values differently. Safari escapes `<` to `&lt;` while Chrome
  // and Firefox do not.
  let actual = await html(tree);
  let expected = '<span data-wat="bram"><aside data-bar="foo" bâz="(<|&lt;)&quot;hacked">hello here is <b>some</b> <ul><li>html</li></ul> for you good <bye></bye></aside><my-custom-element><i>&lt;hello world&gt;</i></my-custom-element></span>';

  assert.ok(actual.match(new RegExp(expected)), `expected "${actual}" to match ${expected}`);
});
