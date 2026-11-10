"use strict";

(() => {
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const phoneLayout = window.matchMedia("(max-width: 699px)");
  const root = document.documentElement;
  const demo = document.getElementById("hero-demo");
  const replay = document.getElementById("sample-replay");
  const split = document.getElementById("meeting-split");
  const sheets = document.getElementById("meeting-sheets");
  const pairedLines = demo ? demo.querySelectorAll("[data-pair]") : [];
  let finishTimer;
  let demoObserver;
  let revealObserver;
  let hasPlayed = false;

  function finishDemo() {
    window.clearTimeout(finishTimer);
    if (demo) demo.classList.remove("demo-ready", "is-playing", "check-pass");
  }

  function playSample() {
    finishDemo();
    hasPlayed = true;
    if (!demo || motionPreference.matches) return;
    // Restart the CSS sequence, including repeated presses during playback.
    void demo.offsetWidth;
    if (phoneLayout.matches) {
      demo.classList.add("check-pass");
    } else {
      demo.classList.add("demo-ready", "is-playing");
    }
    finishTimer = window.setTimeout(finishDemo, 2450);
  }

  function showPair(pair) {
    // Selecting a line also finishes the build so its match is readable now.
    finishDemo();
    pairedLines.forEach(line => {
      const selected = line.dataset.pair === pair;
      line.classList.toggle("is-paired", selected);
      line.setAttribute("aria-pressed", String(selected));
    });
  }

  pairedLines.forEach(line => {
    line.addEventListener("focus", () => showPair(line.dataset.pair));
    line.addEventListener("click", () => showPair(line.dataset.pair));
    line.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      showPair(line.dataset.pair);
    });
  });

  if (replay) replay.addEventListener("click", () => {
    if (demoObserver) demoObserver.disconnect();
    pairedLines.forEach(line => {
      line.classList.remove("is-paired");
      line.setAttribute("aria-pressed", "false");
    });
    playSample();
  });

  if (split && sheets) {
    split.addEventListener("input", () => {
      const value = Number(split.value);
      sheets.style.setProperty("--split", value + "%");
      split.setAttribute("aria-valuetext", "Transcript " + value + " percent, draft " + (100 - value) + " percent");
    });
  }

  function configureMotion() {
    finishDemo();
    if (demoObserver) demoObserver.disconnect();
    if (revealObserver) revealObserver.disconnect();
    root.classList.remove("motion-ready");
    if (motionPreference.matches || !("IntersectionObserver" in window)) return;

    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    document.querySelectorAll(".reveal, .ink-underline").forEach(element => revealObserver.observe(element));
    root.classList.add("motion-ready");

    if (!demo || hasPlayed) return;
    // Phone text stays complete even while the hero is below the viewport.
    if (phoneLayout.matches) return;
    demoObserver = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      playSample();
      demoObserver.disconnect();
    }, { threshold: 0.15 });
    demoObserver.observe(demo);
  }

  motionPreference.addEventListener("change", configureMotion);
  phoneLayout.addEventListener("change", configureMotion);
  configureMotion();
})();
