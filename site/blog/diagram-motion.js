// Progressive enhancement of reviewed, inline diagrams. No network or model calls.
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");

for (const figure of document.querySelectorAll("[data-diagram-motion]")) {
  const svg = figure.querySelector("svg");
  const toggle = figure.querySelector("[data-diagram-toggle]");
  const expand = figure.querySelector("[data-diagram-expand]");
  const note = figure.querySelector(".diagram-motion-note");
  let wantsMotion = !motionPreference.matches;
  let visible = false;

  // Keep each solid action arrow and overlay a small traveling dash.
  for (const [index, cell] of [...svg.querySelectorAll('[data-flow="action"]')].entries()) {
    const line = cell.querySelector("path");
    if (!line) continue;
    const marker = line.cloneNode(false);
    marker.removeAttribute("style");
    marker.classList.add("diagram-action-marker");
    marker.style.animationDelay = `${index * -0.3}s`;
    marker.setAttribute("aria-hidden", "true");
    line.after(marker);
  }
  // Reference links move toward retained evidence. The horizontal association
  // bus stays static: it does not imply a left-to-right execution sequence.
  for (const cell of svg.querySelectorAll('[data-flow="evidence"]')) {
    cell.querySelector("path")?.classList.add("diagram-evidence-flow");
  }
  for (const [index, cell] of [...svg.querySelectorAll('[data-flow="stage"]')].entries()) {
    const shape = cell.querySelector("rect, path");
    if (!shape) continue;
    const highlight = shape.cloneNode(false);
    highlight.removeAttribute("style");
    highlight.classList.add("diagram-stage-highlight");
    highlight.style.animationDelay = `${index * 1.4}s`;
    highlight.setAttribute("aria-hidden", "true");
    shape.after(highlight);
  }

  function update() {
    figure.dataset.motion = wantsMotion && !motionPreference.matches && visible && !document.hidden ? "running" : "paused";
    toggle.disabled = motionPreference.matches;
    toggle.textContent = wantsMotion ? "Pause animation" : "Play animation";
    note.textContent = motionPreference.matches && !wantsMotion ? "Reduced motion is on" : "";
  }
  toggle.addEventListener("click", () => {
    wantsMotion = !wantsMotion;
    update();
  });
  motionPreference.addEventListener("change", () => {
    wantsMotion = !motionPreference.matches;
    update();
  });
  document.addEventListener("visibilitychange", update);
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    update();
  }, { threshold: 0.1 });
  observer.observe(figure);

  expand.hidden = !document.fullscreenEnabled;
  expand.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement === figure) await document.exitFullscreen();
      else await figure.requestFullscreen();
    } catch {
      note.textContent = "Full screen is unavailable; use the static SVG link below.";
    }
  });
  document.addEventListener("fullscreenchange", () => {
    expand.textContent = document.fullscreenElement === figure ? "Exit full screen" : "Expand diagram";
  });
  figure.querySelector(".diagram-controls").hidden = false;
  update();
}
