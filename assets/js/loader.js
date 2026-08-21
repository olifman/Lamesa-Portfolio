

const getEl = (id) => document.getElementById(id);

export function initializeLoader() {
  const wrapper = getEl("loader-wrapper");
  if (!wrapper) return;

  const bar = getEl("loading-bar");
  const percent = getEl("load-percent");
  const percentMini = getEl("load-percent-mini");
  const quote = getEl("dynamic-quote");

  document.documentElement.style.overflow = "hidden";
  document.documentElement.style.scrollbarWidth = "none";

  if (quote)
    quote.textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  const startTime = performance.now();
  let progress = 0;
  let finished = false;
  let rafId = 0;

  const setProgress = (val) => {
    progress = Math.min(val, 100);
    if (bar) bar.style.width = `${progress}%`;
    if (percent) percent.textContent = `${Math.floor(progress)}%`;
    if (percentMini) percentMini.textContent = `${Math.floor(progress)}%`;
    if (bar) bar.setAttribute("aria-valuenow", String(Math.floor(progress)));
  };

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const minDuration = 5500;
  const maxDuration = 10000;
  let loadReady = false;

  const smoothStep = (current, target) => {
    const delta = target - current;
    if (delta <= 0) return current;
    return Math.min(current + Math.max(delta * 0.06, 0.04), target);
  };

  const progressTargetForElapsed = (elapsed) => {
    const t = Math.min(elapsed / minDuration, 1);
    const eased = easeOutCubic(t) * 100;
    const cap = loadReady && elapsed >= minDuration ? 100 : 96;
    return Math.min(eased, cap);
  };

  const tick = (now) => {
    if (finished) return;
    const elapsed = now - startTime;
    const target = progressTargetForElapsed(elapsed);
    progress = smoothStep(progress, target);
    setProgress(progress);

    if (loadReady && elapsed >= minDuration && progress >= 99.5) {
      finish();
      return;
    }

    rafId = requestAnimationFrame(tick);
  };

  const finalizeToHundred = () => {
    const start = performance.now();
    const from = progress;
    const duration = 500;

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const target = from + (100 - from) * easeOutCubic(t);
      setProgress(target);
      if (t < 1) {
        requestAnimationFrame(tick);
        return;
      }

      wrapper.classList.add("loader-hidden");

      const cleanup = () => {
        wrapper.style.display = "none";
        document.documentElement.style.overflow = "";
        document.documentElement.style.scrollbarWidth = "";
        window.dispatchEvent(new CustomEvent("loaderComplete"));
      };

      wrapper.addEventListener("transitionend", cleanup, { once: true });
      setTimeout(cleanup, 350);
    };

    requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  const finish = () => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(rafId);
    finalizeToHundred();
  };

  const finishIfReady = () => {
    const elapsed = performance.now() - startTime;
    if (!loadReady || elapsed < minDuration) return;
    finish();
  };

  const failsafe = setTimeout(() => {
    loadReady = true;
    finishIfReady();
  }, maxDuration);

  window.addEventListener(
    "load",
    () => {
      loadReady = true;
      clearTimeout(failsafe);
      finishIfReady();
    },
    { once: true },
  );
}
