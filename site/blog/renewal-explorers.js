import { explorers } from "./renewal-explorer-data.js";

const ns = "http://www.w3.org/2000/svg";
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
for (const figure of document.querySelectorAll("[data-renewal]")) {
  const spec = explorers[figure.dataset.renewal];
  if (!spec) continue;
  const svgs = [...figure.querySelectorAll("svg")];
  const toggle = figure.querySelector("[data-motion-toggle]");
  const expand = figure.querySelector("[data-expand]");
  let selected = 0, userPaused = false, visible = false;
  for (const svg of svgs) {
    for (const path of svg.querySelectorAll("[data-edge]")) {
      const circle = document.createElementNS(ns, "circle");
      circle.setAttribute("r", "4.5");
      circle.setAttribute("class", "renewal-flow-dot");
      circle.dataset.dot = path.dataset.edge;
      const motion = document.createElementNS(ns, "animateMotion");
      motion.setAttribute("path", path.getAttribute("d"));
      motion.setAttribute("dur", `${Math.max(2, path.getTotalLength() / 55)}s`);
      motion.setAttribute("repeatCount", "indefinite");
      circle.append(motion);
      path.after(circle);
    }
    svg.pauseAnimations();
  }
  function motionState() {
    const running = visible && !userPaused && !reduced.matches && !document.hidden;
    figure.dataset.motion = running ? "running" : "paused";
    for (const svg of svgs) running ? svg.unpauseAnimations() : svg.pauseAnimations();
    toggle.disabled = reduced.matches;
    toggle.textContent = reduced.matches ? "Animation off" : userPaused ? "Play animation" : "Pause animation";
    figure.querySelector("[data-motion-note]").textContent = reduced.matches ? "Reduced motion enabled" : "Illustrative movement";
  }
  function select(index) {
    selected = index;
    const scenario = spec.scenarios[index];
    figure.dataset.state = scenario.state ?? String(index);
    for (const node of figure.querySelectorAll("[data-node]"))
      node.dataset.active = String(scenario.nodes.includes(node.dataset.node));
    for (const edge of figure.querySelectorAll("[data-edge]"))
      edge.dataset.active = String(scenario.edges.includes(Number(edge.dataset.edge)));
    for (const dot of figure.querySelectorAll("[data-dot]"))
      dot.dataset.active = String(scenario.edges.includes(Number(dot.dataset.dot)));
    for (const button of figure.querySelectorAll("[data-scenario]"))
      button.setAttribute("aria-pressed", String(Number(button.dataset.scenario) === index));
    figure.querySelector("[data-result-title]").textContent = scenario.title;
    figure.querySelector("[data-result-detail]").textContent = scenario.detail;
    if (scenario.metrics) {
      scenario.metrics.forEach((value, i) => { figure.querySelector(`[data-metric="${i}"]`).textContent = value; });
      figure.querySelector("[data-run]").disabled = index !== 0;
      figure.querySelector("[data-retry]").disabled = index !== 1;
    }
  }
  for (const button of figure.querySelectorAll("[data-scenario]"))
    button.addEventListener("click", () => select(Number(button.dataset.scenario)));
  figure.querySelector("[data-run]")?.addEventListener("click", () => { if (selected === 0) select(1); });
  figure.querySelector("[data-retry]")?.addEventListener("click", () => { if (selected === 1) select(2); });
  figure.querySelector("[data-reset]")?.addEventListener("click", () => select(0));
  toggle.addEventListener("click", () => { userPaused = !userPaused; motionState(); });
  expand.hidden = !document.fullscreenEnabled;
  expand.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement === figure) await document.exitFullscreen();
      else await figure.requestFullscreen();
    } catch {
      figure.querySelector("[data-motion-note]").textContent = "Full-screen viewing is unavailable in this browser.";
    }
  });
  document.addEventListener("fullscreenchange", () => {
    expand.textContent = document.fullscreenElement === figure ? "Exit full screen" : "Expand diagram";
  });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    motionState();
  }, { threshold: 0.05 }).observe(figure);
  reduced.addEventListener("change", motionState);
  document.addEventListener("visibilitychange", motionState);
  select(0);
  figure.querySelector(".renewal-toolbar").hidden = false;
  figure.querySelector(".renewal-interaction").hidden = false;
  motionState();
}
