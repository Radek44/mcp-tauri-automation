/** Fixed public-DOM operations. Arguments never become executable source. */
export const FOCUS_ELEMENT_SCRIPT = String.raw`
const nodes = document.querySelectorAll(arguments[0]);
if (nodes.length !== 1) return {reason: nodes.length ? 'ambiguous' : 'not_found'};
const el = nodes[0];
if (el.matches(':disabled') || el.getAttribute('aria-disabled') === 'true' || el.closest('[inert]'))
  return {reason: 'disabled'};
const style = getComputedStyle(el);
const rect = el.getBoundingClientRect();
if (!rect.width || !rect.height || style.visibility === 'hidden' || style.visibility === 'collapse')
  return {reason: 'hidden'};
el.scrollIntoView({block: 'center', inline: 'nearest', behavior: 'instant'});
el.focus({preventScroll: true});
return {reason: document.activeElement === el ? 'focused' : 'not_focusable'};
`;

export const ELEMENT_CONDITIONS_SCRIPT = String.raw`
const [el, conditions] = arguments;
if (!el || !el.isConnected) return {matches: false};
if (conditions.enabled !== undefined) {
  const enabled = !el.matches(':disabled') && el.getAttribute('aria-disabled') !== 'true' && !el.closest('[inert]');
  if (enabled !== conditions.enabled) return {matches: false};
}
if (conditions.ariaBusy !== undefined && el.getAttribute('aria-busy') !== String(conditions.ariaBusy))
  return {matches: false};
if (conditions.textEquals !== undefined) {
  const privateControl = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
  const normalize = value => String(value ?? '').replace(/\s+/g, ' ').trim();
  let text = '';
  if (!el.matches(privateControl)) {
    // Count every text node, including excluded nodes, so private/hidden
    // subtrees cannot bypass the traversal budget.
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let visits = 0, rawLength = 0;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (++visits > 2000) return {matches: false};
      const value = node.textContent ?? '';
      rawLength += value.length;
      if (rawLength > 12000) return {matches: false};
      const parent = node.parentElement;
      if (!parent || parent.closest(privateControl)) continue;
      let visible = true;
      for (let ancestor = parent; ancestor; ancestor = ancestor.parentElement) {
        const css = getComputedStyle(ancestor);
        if (ancestor.hidden || css.display === 'none' || css.visibility === 'hidden' ||
            css.visibility === 'collapse' || Number(css.opacity) === 0) {
          visible = false;
          break;
        }
      }
      // Preserve inline adjacency, e.g. Sa<span>ve</span>d => Saved.
      if (visible) text += value;
    }
    text = normalize(text);
  }
  if (text !== normalize(conditions.textEquals)) return {matches: false};
}
return {matches: true};
`;
