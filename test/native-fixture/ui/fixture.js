const byId = (id) => document.getElementById(id);
const increment = (id) => { byId(id).textContent = String(Number(byId(id).textContent) + 1); };
byId("activate").addEventListener("click", () => increment("activation-count"));
byId("note").addEventListener("input", () => {
  increment("input-count");
  byId("note-mirror").textContent = byId("note").value;
});
byId("offscreen-focus").addEventListener("focus", () => {
  byId("focus-status").textContent = "focused";
  // An explicit visible fixture observation, not an automation form-value read.
  byId("note-mirror").textContent = byId("note").value;
});
byId("offscreen-focus").addEventListener("click", () => increment("focus-activation-count"));
byId("replace-status").addEventListener("click", () => {
  const replacement = document.createElement("p");
  replacement.id = "async-status";
  replacement.textContent = "Working";
  replacement.setAttribute("aria-busy", "true");
  byId("async-status").replaceWith(replacement);
  byId("after-ready").disabled = true;
  setTimeout(() => {
    const ready = replacement.cloneNode(false);
    ready.textContent = "Ready";
    ready.setAttribute("aria-busy", "false");
    replacement.replaceWith(ready);
    byId("after-ready").disabled = false;
  }, 350);
});
const mouse = byId("mouse-target");
const mouseTrace = [];
for (const type of ["mousedown", "mouseup", "click", "contextmenu", "auxclick"]) {
  mouse.addEventListener(type, (event) => {
    mouseTrace.push({ type, button: event.button, trusted: event.isTrusted });
    byId("mouse-trace").textContent = JSON.stringify(mouseTrace.slice(-12));
    if (type === "click" && event.button === 0) increment("left-click-count");
  });
}
mouse.addEventListener("mouseup", (event) => {
  const counter = { 0: "left-count", 1: "middle-count", 2: "right-count" }[event.button];
  if (counter) increment(counter);
  byId("trusted-event").textContent = String(event.isTrusted);
});
mouse.addEventListener("contextmenu", (event) => { event.preventDefault(); increment("context-count"); });
mouse.addEventListener("auxclick", (event) => {
  event.preventDefault();
  increment("aux-count");
  if (event.button === 1) increment("middle-aux-count");
  if (event.button === 2) increment("right-aux-count");
});
