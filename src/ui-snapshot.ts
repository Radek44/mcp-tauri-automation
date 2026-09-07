/** Fixed read-only diagnostic; no caller-supplied JavaScript or app internals. */
export const INSPECT_UI_SCRIPT = String.raw`
const [selector, limit, maxTextLength] = arguments;
const nodes = document.querySelectorAll(selector);
const normalize = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const bound = value => normalize(value).slice(0, maxTextLength);
const privateControl = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
function geometry(el) {
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  let opacity = 1;
  let displayed = true;
  for (let node = el; node; node = node.parentElement) {
    const css = getComputedStyle(node);
    if (css.display === 'none' || node.hidden) displayed = false;
    opacity *= Number.isFinite(Number(css.opacity)) ? Number(css.opacity) : 1;
  }
  const visible = displayed && style.visibility !== 'hidden' && style.visibility !== 'collapse' &&
    opacity > 0 && rect.width > 0 && rect.height > 0;
  const finite = n => Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
  return {
    visible, opacity: finite(Number(style.opacity)), effectiveOpacity: finite(opacity),
    inViewport: visible && rect.right > 0 && rect.bottom > 0 &&
      rect.left < innerWidth && rect.top < innerHeight,
    rect: {x: finite(rect.x), y: finite(rect.y), width: finite(rect.width), height: finite(rect.height)},
    display: style.display, visibility: style.visibility,
  };
}
function visibleText(el) {
  if (!maxTextLength || el.matches(privateControl) || !geometry(el).visible) return '';
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      return parent && !parent.closest(privateControl) && geometry(parent).visible
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  let text = '';
  let visits = 0;
  while (text.length < maxTextLength + 1 && visits++ < 2000) {
    const node = walker.nextNode();
    if (!node) break;
    text = normalize(text + ' ' + normalize(node.textContent).slice(0, maxTextLength + 2));
  }
  return normalize(text);
}
const roles = {BUTTON:'button', A:'link', TEXTAREA:'textbox', SELECT:'combobox',
  H1:'heading', H2:'heading', H3:'heading'};
const elements = Array.from(nodes).slice(0, limit).map(el => {
  const g = geometry(el);
  const text = visibleText(el);
  const labelled = (el.getAttribute('aria-labelledby') ?? '').split(/\s+/).slice(0, 5)
    .map(id => document.getElementById(id)).filter(Boolean).map(visibleText).join(' ');
  const name = normalize(el.getAttribute('aria-label') || labelled ||
    (el.labels ? Array.from(el.labels).slice(0, 5).map(visibleText).join(' ') : '') || text);
  const role = el.getAttribute('role') || roles[el.tagName] ||
    (el.tagName === 'INPUT' ? ({checkbox:'checkbox',radio:'radio',button:'button',submit:'button'}[el.type] || 'textbox') : '');
  return {
    tag: el.tagName.toLowerCase(), role: bound(role), name: bound(name),
    testId: bound(el.getAttribute('data-testid')), text: bound(text),
    textTruncated: text.length > maxTextLength, nameTruncated: name.length > maxTextLength,
    enabled: !el.matches(':disabled') && el.getAttribute('aria-disabled') !== 'true' && !el.closest('[inert]'),
    ...g
  };
});
return {viewport: {width: innerWidth, height: innerHeight}, matched: nodes.length,
  returned: elements.length, truncated: nodes.length > limit, elements};
`;
