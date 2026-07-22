"use client";
import { useEffect, useRef } from "react";
import { HIGHWAYS, CAMERAS, project } from "@/lib/dfw/geometry";
import { TIMELINE } from "@/lib/replay/timeline";
import { getReplayState } from "@/lib/replay/engine";

const STEEL = "#4a6b8a";
const SIGNAL = "#ffb000";
const ALERT = "#ff3b30";

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, tMs: number) {
  ctx.clearRect(0, 0, w, h);
  const s = getReplayState(TIMELINE, tMs);

  for (const hw of HIGHWAYS) {
    ctx.beginPath();
    hw.points.forEach((p, i) => {
      const [x, y] = project(p, w, h);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    // glow pass then core pass gives roads a neon depth
    ctx.strokeStyle = STEEL;
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = hw.major ? 7 : 4;
    ctx.stroke();
    ctx.globalAlpha = hw.major ? 0.85 : 0.5;
    ctx.lineWidth = hw.major ? 2 : 1.25;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  for (const cam of CAMERAS) {
    const [x, y] = project(cam.lonlat, w, h);
    const active = s.event?.camId === cam.id;
    // idle cameras breathe faintly, offset by position so they never sync
    const breathe = 0.35 + 0.2 * Math.sin(tMs / 900 + x * 0.13);
    ctx.beginPath();
    ctx.arc(x, y, active ? 4 : 2.5, 0, Math.PI * 2);
    ctx.fillStyle = active ? SIGNAL : STEEL;
    ctx.globalAlpha = active ? 1 : breathe;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (s.event && s.phase !== "idle") {
    const [x, y] = project(s.event.lonlat, w, h);
    const color = s.phase === "confirmed" ? ALERT : SIGNAL;
    // expanding radar ring
    const ring = ((tMs % 1400) / 1400) * 26;
    ctx.beginPath();
    ctx.arc(x, y, 6 + ring, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 1 - ring / 26;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    // bounding-box corner brackets around the event
    const r = 12, l = 5;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
      ctx.beginPath();
      ctx.moveTo(x + sx * r, y + sy * r - sy * l);
      ctx.lineTo(x + sx * r, y + sy * r);
      ctx.lineTo(x + sx * r - sx * l, y + sy * r);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

export default function MapCanvas({
  epochRef, paused, className,
}: {
  epochRef: React.RefObject<number | null>;
  paused: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Redraw after resize to prevent canvas clear from blanking content
      if (paused) {
        draw(ctx, canvas.clientWidth, canvas.clientHeight, 12000);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (paused) {
      draw(ctx, canvas.clientWidth, canvas.clientHeight, 12000);
      return () => ro.disconnect();
    }
    let raf = 0;
    const tick = (now: number) => {
      if (epochRef.current === null) epochRef.current = now;
      draw(ctx, canvas.clientWidth, canvas.clientHeight, now - epochRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [paused, epochRef]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
