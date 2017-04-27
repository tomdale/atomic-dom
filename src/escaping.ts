interface Dict {
  [key: string]: string;
}

const HAS_UNESCAPED_HTML = /[&<>"']/;
const UNESCAPED_HTML = /[&<>"']/g;
const HTML_ESCAPE_MAP: Dict = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

const escapeHTMLChar = function(char: string) {
  return HTML_ESCAPE_MAP[char];
}

/** HTML escapes the provided text. */
export function escapeHTML(text: string): string {
  return (text && HAS_UNESCAPED_HTML.test(text))
   ? text.replace(UNESCAPED_HTML, escapeHTMLChar)
   : text;
}

const HAS_UNESCAPED_ATTR = /[&"]/;
const UNESCAPED_ATTR = /[&"]/g;

export function escapeAttr(text: string): string {
  return (text && HAS_UNESCAPED_ATTR.test(text))
   ? text.replace(UNESCAPED_ATTR, escapeHTMLChar)
   : text;
}

// https://html.spec.whatwg.org/multipage/syntax.html#comments
// Comments must have the following format:

// 1. The string "<!--".
// 2. Optionally, text, with the additional restriction that the
//    text must not start with the string ">", nor start with the string "->", nor
//    contain the strings "<!--", "-->", or "--!>", nor end with the string "<!-".
// 3. The string "-->".
const HAS_UNESCAPED_COMMENT = /(^(>|->)|(<!--|-->|--!>)|(<!-$))/;
const UNESCAPED_COMMENT = /(^(>|->)|(<!--|-->|--!>)|(<!-$))/g;

export function escapeComment(text: string): string {
  return (text && HAS_UNESCAPED_COMMENT.test(text))
   ? text.replace(UNESCAPED_COMMENT, '')
   : text;
}
