"use client";

import { useEffect, useRef } from "react";

/* ============================================
   BOKEH — Círculos desenfocados animados
   ============================================ */
export default function BokehBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    interface BokehCircle {
      x: number;
      y: number;
      radius: number;
      dx: number;
      dy: number;
      hue: number;
      saturation: number;
      lightness: number;
      alpha: number;
    }

    const circles: BokehCircle[] = [];
    const count = 25;

    for (let i = 0; i < count; i++) {
      circles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 80 + 30,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        hue: Math.random() * 40 + 10, // warm hues
        saturation: Math.random() * 30 + 20,
        lightness: Math.random() * 20 + 70,
        alpha: Math.random() * 0.15 + 0.05,
      });
    }

    let isRunning = true;

    function animate() {
      if (!isRunning || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const c of circles) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${c.hue}, ${c.saturation}%, ${c.lightness}%, ${c.alpha})`;
        ctx.filter = "blur(20px)";
        ctx.fill();
        ctx.restore();

        c.x += c.dx;
        c.y += c.dy;

        if (c.x < -c.radius) c.x = canvas.width + c.radius;
        if (c.x > canvas.width + c.radius) c.x = -c.radius;
        if (c.y < -c.radius) c.y = canvas.height + c.radius;
        if (c.y > canvas.height + c.radius) c.y = -c.radius;
      }

      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      isRunning = false;
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}
