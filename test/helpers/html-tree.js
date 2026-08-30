"use strict";

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

function parseAttributes(source) {
  const result = {};
  for (const match of source.matchAll(/([^\s=/>]+)(?:\s*=\s*"([^"]*)")?/g)) {
    result[match[1]] = match[2] === undefined ? true : match[2];
  }
  return result;
}

function parseHtml(html) {
  const root = { tag: "#document", attrs: {}, children: [] };
  const stack = [root];
  const tokens = html.match(/<!--[\s\S]*?-->|<![^>]*>|<\/?[a-zA-Z][^>]*>|[^<]+/g) || [];

  for (const token of tokens) {
    if (token.startsWith("<!--") || token.startsWith("<!")) continue;
    if (token.startsWith("</")) {
      const tag = token.slice(2, -1).trim().toLowerCase();
      while (stack.length > 1 && stack.at(-1).tag !== tag) stack.pop();
      if (stack.length > 1) stack.pop();
      continue;
    }
    if (token.startsWith("<")) {
      const match = token.match(/^<([a-zA-Z][^\s/>]*)([\s\S]*?)\/?\s*>$/);
      if (!match) continue;
      const node = { tag: match[1].toLowerCase(), attrs: parseAttributes(match[2]), children: [] };
      stack.at(-1).children.push(node);
      if (!VOID_TAGS.has(node.tag) && !token.endsWith("/>")) stack.push(node);
      continue;
    }
    stack.at(-1).children.push({ tag: "#text", attrs: {}, children: [], value: token });
  }

  return root;
}

function findAll(node, predicate, found = []) {
  if (predicate(node)) found.push(node);
  for (const child of node.children || []) findAll(child, predicate, found);
  return found;
}

function textContent(node) {
  if (node.tag === "#text") return node.value;
  return (node.children || []).map(textContent).join("").replace(/\s+/g, " ").trim();
}

module.exports = { findAll, parseHtml, textContent };
