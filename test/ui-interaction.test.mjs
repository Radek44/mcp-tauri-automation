import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { ELEMENT_CONDITIONS_SCRIPT } from "../dist/ui-interaction.js";

function observe(parts, expected) {
  let visited = 0;
  const root = { isConnected: true, matches: () => false };
  const nodes = parts.map(part => ({
    textContent: typeof part === "string" ? part : part.text,
    parentElement: {
      parentElement: null, hidden: Boolean(part.hidden),
      closest: () => part.private ? {} : null,
    },
  }));
  const context = {
    args: [root, { textEquals: expected }],
    NodeFilter: { SHOW_TEXT: 4, FILTER_ACCEPT: 1, FILTER_REJECT: 2 },
    getComputedStyle: () => ({ opacity: "1", display: "inline", visibility: "visible" }),
    document: { createTreeWalker(_root, _what, filter) {
      let index = 0;
      return { nextNode() {
        while (index < nodes.length) {
          const node = nodes[index++]; visited++;
          if (!filter || filter.acceptNode(node) === 1) return node;
        }
        return null;
      } };
    } },
  };
  return { result: vm.runInNewContext(`(function(){${ELEMENT_CONDITIONS_SCRIPT}}).apply(null,args)`, context), visited };
}

test("exact text preserves inline adjacency and normalizes actual whitespace", () => {
  assert.equal(observe(["Sa", "ve", "d"], "Saved").result.matches, true);
  assert.equal(observe([" Ready ", "\n now "], "Ready now").result.matches, true);
});

test("private and hidden nodes are excluded but still consume traversal budget", () => {
  assert.equal(observe([{ text: "secret", private: true }, "Saved"], "Saved").result.matches, true);
  const observation = observe(Array.from({ length: 2501 }, () => ({ text: "hidden", hidden: true })), "");
  assert.equal(observation.result.matches, false);
  assert.ok(observation.visited <= 2001);
});
