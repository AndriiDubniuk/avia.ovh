"use client";

import { useEffect, useRef } from "react";

type Sky = "flight" | "climb";

type CockpitProps = {
  sky?: Sky;
  scrollCue?: string;
  /** Прогрес рахується від цього елемента, якщо він є. */
  trackSelector?: string;
};

/* Палітри неба — значення з макета. */
const G = { top: [34, 70, 52], mid: [80, 140, 92], bot: [170, 200, 120] };
const S = { top: [24, 58, 78], mid: [92, 150, 168], bot: [198, 224, 214] };
const O = { top: [3, 5, 10], mid: [8, 16, 34], bot: [16, 30, 54] };

function mix(a: number[], b: number[], t: number) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

const rgb = (c: number[]) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;

function skyAt(seg: number) {
  if (seg < 1) {
    return {
      t: mix(G.top, S.top, seg),
      m: mix(G.mid, S.mid, seg),
      b: mix(G.bot, S.bot, seg),
    };
  }
  const u = seg - 1;
  return {
    t: mix(S.top, O.top, u),
    m: mix(S.mid, O.mid, u),
    b: mix(S.bot, O.bot, u),
  };
}

export function Cockpit({
  sky = "flight",
  scrollCue,
  trackSelector,
}: CockpitProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const curRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLElement | null>(null);
  const cueRef = useRef<HTMLDivElement | null>(null);
  const preRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLElement | null>(null);
  const metaRef = useRef<HTMLDivElement | null>(null);
  const railWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    const ctx = cvs?.getContext("2d");
    if (!cvs || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0;
    let H = 0;
    let stars: { x: number; y: number; r: number; tw: number; sp: number }[] = [];
    let clouds: { x: number; y: number; w: number; o: number; sp: number }[] = [];
    let warp: { a: number; r: number }[] = [];

    function resize() {
      if (!cvs || !ctx) return;
      const DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      cvs.width = W * DPR;
      cvs.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      stars = Array.from({ length: 260 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.3 + 0.2,
        tw: Math.random() * 6.28,
        sp: 0.5 + Math.random() * 1.6,
      }));
      clouds = Array.from({ length: 8 }, () => ({
        x: Math.random() * W,
        y: H * 0.3 + Math.random() * H * 0.5,
        w: W * (0.4 + Math.random() * 0.5),
        o: 0.05 + Math.random() * 0.1,
        sp: 0.15 + Math.random() * 0.5,
      }));
      warp = Array.from({ length: 150 }, () => ({
        a: Math.random() * 6.28,
        r: Math.random(),
      }));
    }

    let p = 0;
    let target = 0;
    let mx = 0;
    let my = 0;
    let tmx = 0;
    let tmy = 0;
    let curX = window.innerWidth / 2;
    let curY = window.innerHeight / 2;
    let curTX = curX;
    let curTY = curY;
    let footEl: HTMLElement | null = null;

    function readScroll() {
      const track = trackSelector
        ? document.querySelector<HTMLElement>(trackSelector)
        : null;
      if (track) {
        const scrollable = track.offsetHeight - window.innerHeight;
        // Дозволяємо вийти за 1: за треком іде футер, і прилади там гаснуть.
        target =
          scrollable > 0
            ? Math.min(
                1.3,
                Math.max(0, (window.scrollY - track.offsetTop) / scrollable),
              )
            : 0;
        return;
      }
      const max = document.body.scrollHeight - window.innerHeight;
      target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    }

    function onMove(e: MouseEvent) {
      tmx = e.clientX / window.innerWidth - 0.5;
      tmy = e.clientY / window.innerHeight - 0.5;
      curTX = e.clientX;
      curTY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
      }
    }

    const interactive = "a,button,input,textarea,label,.leg,.node,[data-hover]";

    function onOver(e: MouseEvent) {
      const el = e.target as HTMLElement | null;
      if (curRef.current) {
        curRef.current.dataset.big = String(Boolean(el?.closest(interactive)));
      }
    }

    resize();
    readScroll();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);

    let raf = 0;

    function frame() {
      if (!cvs || !ctx) return;
      // У прихованій вкладці нема сенсу малювати — економимо CPU та батарею.
      if (document.hidden) {
        raf = window.requestAnimationFrame(frame);
        return;
      }
      if (W !== window.innerWidth || H !== window.innerHeight) resize();

      p += (target - p) * (reduced ? 1 : 0.055);
      mx += (tmx - mx) * 0.05;
      my += (tmy - my) * 0.05;
      curX += (curTX - curX) * 0.18;
      curY += (curTY - curY) * 0.18;
      if (curRef.current) {
        curRef.current.style.transform = `translate(${curX}px,${curY}px)`;
      }

      // Політ рахуємо лише в межах треку; те, що далі, — вже футер.
      const pf = Math.min(1, p);
      // На внутрішніх сторінках небо стоїть у стратосфері й лише трохи темнішає.
      const seg = sky === "flight" ? pf * 2 : 0.82 + pf * 0.5;
      const s = skyAt(seg);

      const g = ctx.createLinearGradient(0, -my * 40, 0, H - my * 40);
      g.addColorStop(0, rgb(s.t));
      g.addColorStop(0.55, rgb(s.m));
      g.addColorStop(1, rgb(s.b));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // stars
      const starA = sky === "flight" ? Math.max(0, (pf - 0.3) / 0.7) : 0.45 + pf * 0.4;
      if (starA > 0) {
        ctx.fillStyle = "#fff";
        for (const st of stars) {
          if (!reduced) st.tw += 0.02 * st.sp;
          ctx.globalAlpha = starA * (0.35 + 0.65 * Math.abs(Math.sin(st.tw)));
          ctx.beginPath();
          ctx.arc(st.x + mx * 28 * st.sp, st.y + (1 - pf) * 30, st.r, 0, 7);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // dawn glow
      const sunA = Math.max(0, 1 - seg * 0.95);
      const glowY = H * 0.62 + pf * H * 0.5;
      if (sunA > 0) {
        const rg = ctx.createRadialGradient(
          W * 0.5 + mx * 60,
          glowY,
          0,
          W * 0.5 + mx * 60,
          glowY,
          H * 0.95,
        );
        rg.addColorStop(0, `rgba(255,222,175,${0.55 * sunA})`);
        rg.addColorStop(0.4, `rgba(255,150,110,${0.26 * sunA})`);
        rg.addColorStop(1, "rgba(255,150,110,0)");
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, W, H);
      }

      // clouds
      const cloudA = Math.max(0, 1 - Math.abs(seg - 0.6) * 1.05);
      if (cloudA > 0) {
        ctx.fillStyle = "#fff";
        for (const c of clouds) {
          if (!reduced) c.x -= c.sp * 0.3;
          if (c.x < -c.w) c.x = W + c.w * 0.2;
          const cy = c.y + pf * H * 1.4 - my * 20;
          if (cy > -40 && cy < H + 40) {
            ctx.globalAlpha = c.o * cloudA;
            ctx.beginPath();
            ctx.ellipse(c.x + mx * 20, cy, c.w * 0.5, 24, 0, 0, 7);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      }

      // ground grid
      const groundA = Math.max(0, 1 - seg * 1.15);
      if (groundA > 0) {
        const hy = H * 0.66 + pf * H * 0.8 - my * 30;
        const vp = W * 0.5 + mx * 80;
        ctx.strokeStyle = `rgba(121,227,196,${0.2 * groundA})`;
        ctx.lineWidth = 1;
        for (let i = -9; i <= 9; i += 1) {
          ctx.beginPath();
          ctx.moveTo(vp, hy);
          ctx.lineTo(W * 0.5 + i * (W * 0.12) + mx * 40, H);
          ctx.stroke();
        }
        for (let j = 1; j <= 7; j += 1) {
          const yy = hy + (H - hy) * ((j * j) / 49);
          ctx.globalAlpha = groundA * (1 - j / 9);
          ctx.beginPath();
          ctx.moveTo(0, yy);
          ctx.lineTo(W, yy);
          ctx.strokeStyle = "rgba(121,227,196,.5)";
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = `rgba(244,241,234,${0.5 * groundA})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(0, hy);
        ctx.lineTo(W, hy);
        ctx.stroke();
      }

      // earth curvature
      const orbA = Math.max(0, (seg - 1.1) / 0.9);
      if (orbA > 0) {
        const ey = H * 1.2 - orbA * H * 1.15;
        const cyE = ey + H * 1.1;
        const rg = ctx.createRadialGradient(
          W * 0.5,
          cyE,
          H * 0.7,
          W * 0.5,
          cyE,
          H * 1.5,
        );
        rg.addColorStop(0, `rgba(70,180,140,${0.5 * orbA})`);
        rg.addColorStop(0.5, `rgba(24,80,92,${0.42 * orbA})`);
        rg.addColorStop(1, "rgba(4,6,10,0)");
        ctx.beginPath();
        ctx.arc(W * 0.5, cyE, H * 1.15, Math.PI, 0);
        ctx.fillStyle = rg;
        ctx.fill();
        ctx.strokeStyle = `rgba(150,225,195,${0.55 * orbA})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(W * 0.5, cyE, H * 1.15, Math.PI, 0);
        ctx.stroke();
      }

      // trajectory contrail
      const arcA = Math.max(0, 1 - Math.abs(seg - 1) * 0.8);
      ctx.strokeStyle = `rgba(121,227,196,${0.45 * arcA})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([2, 11]);
      ctx.beginPath();
      for (let i = 0; i <= 64; i += 1) {
        const t = i / 64;
        const x = W * 0.1 + t * W * 0.82;
        const y = H * 0.92 - Math.pow(t, 1.6) * H * 0.82 - my * 18;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // warp to orbit + comet
      if (!reduced) {
        const _t = performance.now() * 0.001;
        const wA = Math.max(0, (pf - 0.78) / 0.22);
        if (wA > 0) {
          const wcx = W * 0.5 + mx * 40;
          const wcy = H * 0.5 + my * 30;
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          const spd = 0.004 + wA * 0.02;
          const maxR = Math.hypot(W, H) * 0.6;
          for (const w of warp) {
            const pr = w.r;
            w.r += spd;
            if (w.r > 1) w.r = 0;
            const r1 = pr * maxR;
            const r2 = w.r * maxR;
            ctx.strokeStyle = `rgba(207,232,228,${wA * Math.min(1, w.r) * 0.7})`;
            ctx.lineWidth = 0.6 + w.r * 1.6;
            ctx.beginPath();
            ctx.moveTo(wcx + Math.cos(w.a) * r1, wcy + Math.sin(w.a) * r1);
            ctx.lineTo(wcx + Math.cos(w.a) * r2, wcy + Math.sin(w.a) * r2);
            ctx.stroke();
          }
          ctx.restore();
        }

        const cV = Math.max(0, 1 - Math.abs(seg - 0.7) * 0.8);
        if (cV > 0.02) {
          const cp = (_t * 0.07) % 1;
          const ccx = W * (-0.1 + cp * 1.2);
          const ccy = H * (0.12 + cp * 0.22) - my * 20;
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          for (let k = 0; k < 28; k += 1) {
            const q = k / 28;
            ctx.fillStyle = `rgba(245,194,75,${0.5 * (1 - q) * cV})`;
            ctx.beginPath();
            ctx.arc(ccx - q * W * 0.13, ccy - q * H * 0.055, 2.6 * (1 - q), 0, 7);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      // toFixed, бо дуже малі значення інакше друкуються в експоненційній формі
      if (railRef.current) railRef.current.style.height = `${(pf * 100).toFixed(3)}%`;
      if (cueRef.current) cueRef.current.style.opacity = pf < 0.03 ? "1" : "0";

      // Рейка прогресу згасає, коли знизу підходить футер, — інакше вони
      // лежать поверх його тексту. Рахуємо від реального положення футера.
      if (!footEl) footEl = document.querySelector<HTMLElement>(".homefoot");
      let chrome = 1;
      if (footEl) {
        const top = footEl.getBoundingClientRect().top;
        chrome = Math.max(0, Math.min(1, (top - H * 0.5) / (H * 0.4)));
      }
      if (railWrapRef.current) railWrapRef.current.style.opacity = chrome.toFixed(3);

      raf = window.requestAnimationFrame(frame);
    }

    raf = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
    };
  }, [sky, trackSelector]);

  useEffect(() => {
    let prog = 0;
    const timer = window.setInterval(() => {
      prog = Math.min(100, prog + Math.random() * 16 + 6);
      if (barRef.current) barRef.current.style.width = `${prog}%`;
      if (metaRef.current) {
        metaRef.current.textContent = `PREFLIGHT · ${String(Math.round(prog)).padStart(3, "0")}%`;
      }
      if (prog >= 100) {
        window.clearInterval(timer);
        window.setTimeout(() => {
          if (preRef.current) preRef.current.dataset.gone = "true";
        }, 350);
      }
    }, 130);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <div id="pre" ref={preRef} data-gone="false" aria-hidden>
        <div className="mk">
          A V I <b>A</b>
        </div>
        <div className="barwrap">
          <i ref={barRef} />
        </div>
        <div className="meta" ref={metaRef}>
          PREFLIGHT · 000%
        </div>
      </div>

      <div id="cur" ref={curRef} data-big="false" aria-hidden />
      <div id="dot" ref={dotRef} aria-hidden />

      <div id="stage" data-veil={sky !== "flight"} aria-hidden>
        <canvas ref={canvasRef} />
      </div>

      {/* HUD із показниками ALT … FT і THRUST % прибрано: це буквальні
          прилади літака, а AVIA — студія цифрових продуктів. Метафора
          польоту лишається у графіці неба й шкалі прогресу. */}

      <div id="rail" ref={railWrapRef} aria-hidden>
        <i id="railfill" ref={railRef} />
      </div>

      {scrollCue ? (
        <div className="scrollcue" ref={cueRef} aria-hidden>
          <span>{scrollCue}</span>
          <span className="bar" />
        </div>
      ) : null}
    </>
  );
}
