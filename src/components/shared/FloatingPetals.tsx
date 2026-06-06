"use client";

import { useEffect, useRef } from "react";

/* ============================================
   PÉTALOS FLOTANTES — Canvas
   ============================================ */
export default function FloatingPetals() {
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

    interface Petal {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
      color: string;
    }

    const colors = [
      "rgba(244, 194, 194, 0.6)",
      "rgba(232, 160, 191, 0.5)",
      "rgba(247, 231, 206, 0.7)",
      "rgba(220, 174, 150, 0.5)",
    ];

    const petals: Petal[] = [];
    const petalCount = 30;

    for (let i = 0; i < petalCount; i++) {
      petals.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 12 + 6,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: Math.random() * 0.6 + 0.2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2,
        opacity: Math.random() * 0.5 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let isRunning = true;

    function animate() {
      if (!isRunning || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const petal of petals) {
        ctx.save();
        ctx.translate(petal.x, petal.y);
        ctx.rotate((petal.rotation * Math.PI) / 180);
        ctx.globalAlpha = petal.opacity;

        // Draw petal shape
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(
          petal.size / 2,
          -petal.size / 2,
          petal.size,
          0,
          petal.size,
          petal.size / 3
        );
        ctx.bezierCurveTo(
          petal.size,
          petal.size,
          petal.size / 2,
          petal.size * 0.8,
          0,
          0
        );
        ctx.fillStyle = petal.color;
        ctx.fill();

        ctx.restore();

        // Update position
        petal.x += petal.speedX + Math.sin(petal.y / 100) * 0.3;
        petal.y += petal.speedY;
        petal.rotation += petal.rotationSpeed;

        // Reset when out of bounds
        if (petal.y > canvas.height + 20) {
          petal.y = -20;
          petal.x = Math.random() * canvas.width;
        }
        if (petal.x > canvas.width + 20) {
          petal.x = -20;
        }
        if (petal.x < -20) {
          petal.x = canvas.width + 20;
        }
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
      className="fixed inset-0 pointer-events-none z-10"
      style={{ opacity: 0.7 }}
    />
  );
}
