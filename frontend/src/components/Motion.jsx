import { useEffect } from "react";

/** Splits text into words that slide up out of a mask (used for the hero heading). */
export function SplitText({ text, start = 0, step = 70 }) {
  const words = String(text).split(/\s+/).filter(Boolean);
  return (
    <span className="split" aria-label={text}>
      {words.map((w, i) => (
        <span className="w" key={i} aria-hidden="true"><span style={{ "--wd": `${start + i * step}ms` }}>{w}</span>{i < words.length - 1 ? " " : ""}</span>
      ))}
    </span>
  );
}

/**
 * One small motion engine for the whole site (no extra libraries):
 *  - scroll progress bar + "scrolled" state on the navbar
 *  - [data-parallax="0.08"]  gentle vertical parallax
 *  - [data-scrub]            --p (0..1) while the element crosses the viewport (scroll-linked image scale)
 *  - [data-tilt]             3D tilt on desktop pointers
 *  - [data-magnetic]         button follows the pointer slightly
 *  - hero pointer parallax   --mx / --my on .hero-art
 *  - press ripple on .btn
 * Everything is skipped for prefers-reduced-motion, and listeners are removed on unmount.
 */
export function useMotionEngine() {
  useEffect(() => {
    const mq = (q) => window.matchMedia?.(q).matches;
    if (mq("(prefers-reduced-motion: reduce)")) return;
    const fine = mq("(hover: hover) and (pointer: fine)");
    const bar = document.querySelector(".scroll-progress");
    const nav = document.querySelector(".nav");
    let raf = 0;

    const frame = () => {
      raf = 0;
      const y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = `scaleX(${h > 0 ? Math.min(1, y / h) : 0})`;
      nav?.toggleAttribute("data-scrolled", y > 8);
      const vh = window.innerHeight;
      document.querySelectorAll("[data-parallax]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        el.style.setProperty("--py", `${((r.top + r.height / 2 - vh / 2) * -parseFloat(el.dataset.parallax)).toFixed(1)}px`);
      });
      document.querySelectorAll("[data-scrub]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        el.style.setProperty("--p", Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height))).toFixed(3));
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(frame); };

    let tiltEl = null;
    const reset = (el) => { if (!el) return; el.style.removeProperty("--rx"); el.style.removeProperty("--ry"); el.classList.remove("tilting"); };
    const onMove = (e) => {
      if (!fine || e.pointerType === "touch") return;
      const hero = e.target.closest?.(".hero");
      if (hero) { const r = hero.getBoundingClientRect(); const art = hero.querySelector(".hero-art"); art?.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3)); art?.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3)); }
      const tilt = e.target.closest?.("[data-tilt]");
      if (tilt !== tiltEl) { reset(tiltEl); tiltEl = tilt; }
      if (tilt) { const r = tilt.getBoundingClientRect(); tilt.classList.add("tilting"); tilt.style.setProperty("--ry", `${(((e.clientX - r.left) / r.width - 0.5) * 8).toFixed(2)}deg`); tilt.style.setProperty("--rx", `${(-((e.clientY - r.top) / r.height - 0.5) * 8).toFixed(2)}deg`); }
      document.querySelectorAll("[data-magnetic]").forEach((m) => {
        const r = m.getBoundingClientRect(); const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        const near = Math.hypot(dx, dy) < Math.max(r.width, r.height) * 0.9;
        m.style.setProperty("--mxp", near ? `${(dx * 0.25).toFixed(1)}px` : "0px"); m.style.setProperty("--myp", near ? `${(dy * 0.25).toFixed(1)}px` : "0px");
      });
    };
    const onLeave = () => { reset(tiltEl); tiltEl = null; };
    const onDown = (e) => {
      const b = e.target.closest?.(".btn:not(:disabled)");
      if (!b) return;
      const r = b.getBoundingClientRect(); const s = document.createElement("span");
      s.className = "ripple"; s.style.cssText = `left:${e.clientX - r.left}px;top:${e.clientY - r.top}px`;
      b.appendChild(s); setTimeout(() => s.remove(), 600);
    };

    frame();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerdown", onDown, { passive: true });
    const mo = new MutationObserver(onScroll); // new [data-*] elements after a route change
    mo.observe(document.getElementById("root") || document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(raf); mo.disconnect();
      window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll);
      document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerleave", onLeave); document.removeEventListener("pointerdown", onDown);
    };
  }, []);
}
