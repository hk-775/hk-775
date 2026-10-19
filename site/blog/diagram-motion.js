// Progressive enhancement of reviewed, inline diagrams. No network or model calls.
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");

for (const figure of document.querySelectorAll("[data-diagram-motion]")) {
  const svg = figure.querySelector("svg");
  const toggle = figure.querySelector("[data-diagram-toggle]");
  const expand = figure.querySelector("[data-diagram-expand]");
  const note = figure.querySelector(".diagram-motion-note");
  const usesDots = figure.dataset.diagramStyle === "dots";
  let wantsMotion = !motionPreference.matches;
  let visible = false;

  if (usesDots) {
    // Native SVG motion follows the reviewed path, including elbows and
    // reverse-direction links. Keep the underlying line style unchanged.
    const ns = "http://www.w3.org/2000/svg";
    for (const [index, cell] of [...svg.querySelectorAll('[data-flow="action"], [data-flow="evidence"]')].entries()) {
      const line = cell.querySelector("path");
      if (!line) continue;
      const dot = document.createElementNS(ns, "circle");
      dot.classList.add("diagram-flow-dot");
      dot.setAttribute("r", "7");
      dot.setAttribute("aria-hidden", "true");
      const motion = document.createElementNS(ns, "animateMotion");
      motion.setAttribute("path", line.getAttribute("d"));
      motion.setAttribute("dur", `${Math.max(2.2, Math.min(9, line.getTotalLength() / 85))}s`);
      motion.setAttribute("begin", `${index * -0.55}s`);
      motion.setAttribute("repeatCount", "indefinite");
      motion.setAttribute("calcMode", "paced");
      dot.append(motion);
      // Share the path's parent so draw.io's local translation still applies.
      line.parentElement.append(dot);
    }
  } else {
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
    // Reference links move toward retained evidence. Association buses stay static.
    for (const cell of svg.querySelectorAll('[data-flow="evidence"]')) {
      cell.querySelector("path")?.classList.add("diagram-evidence-flow");
    }
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
    if (usesDots) {
      if (figure.dataset.motion === "running") svg.unpauseAnimations();
      else svg.pauseAnimations();
    }
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
