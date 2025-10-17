import React, { useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };

const EPS = 1e-9;
const clamp = (t: number, a: number, b: number) => Math.max(a, Math.min(b, t));
const dist2 = (a: Point, b: Point) => {
  const dx = a.x - b.x, dy = a.y - b.y;
  return dx * dx + dy * dy;
};

function closestPointOnSegment(a: Point, b: Point, p: Point): Point {
  const abx = b.x - a.x, aby = b.y - a.y;
  const len2 = abx * abx + aby * aby;
  if (len2 <= EPS) return { x: a.x, y: a.y }; 
  const t = clamp(((p.x - a.x) * abx + (p.y - a.y) * aby) / len2, 0, 1);
  return { x: a.x + t * abx, y: a.y + t * aby };
}

function closestPointOnPerimeter(poly: Point[], pos: Point): Point {
  let best: Point | null = null;
  let bestD2 = Infinity;
  for (let i = 0, n = poly.length, j = n - 1; i < n; j = i++) {
    const a = poly[j], b = poly[i];
    const q = closestPointOnSegment(a, b, pos);
    const d2 = dist2(pos, q);
    if (d2 < bestD2) {
      bestD2 = d2;
      best = q;
    }
  }
  return best!;
}

function drawPolygon(ctx: CanvasRenderingContext2D, poly: Point[]) {
  ctx.beginPath();
  poly.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
  ctx.closePath();
  ctx.stroke();
}
function drawDot(ctx: CanvasRenderingContext2D, p: Point, r = 5) {
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
}

function translate(poly: Point[], dx: number, dy: number): Point[] {
  return poly.map((p) => ({ x: p.x + dx, y: p.y + dy }));
}

type Cell = { poly: Point[]; pos: Point };
function makeCells(): Cell[] {
  const tri: Point[] = [{ x: 40, y: 160 }, { x: 120, y: 40 }, { x: 200, y: 160 }];
  const sq: Point[] = [{ x: 40, y: 40 }, { x: 200, y: 40 }, { x: 200, y: 200 }, { x: 40, y: 200 }];
  const concave: Point[] = [{ x: 40, y: 40 }, { x: 200, y: 40 }, { x: 200, y: 200 }, { x: 120, y: 120 }, { x: 40, y: 200 }];
  const pent: Point[] = [{ x: 120, y: 40 }, { x: 200, y: 100 }, { x: 170, y: 200 }, { x: 70, y: 200 }, { x: 40, y: 100 }];

  const gapX = 260, gapY = 260;
  const triT = translate(tri, 40, 40);
  const sqT = translate(sq, 40 + gapX, 40);
  const concaveT = translate(concave, 40, 40 + gapY);
  const pentT = translate(pent, 40 + gapX, 40 + gapY);

  return [
    { poly: triT, pos: { ...triT[0] } },
    { poly: sqT, pos: { ...sqT[0] } },
    { poly: concaveT, pos: { ...concaveT[0] } },
    { poly: pentT, pos: { ...pentT[0] } },
  ];
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cells, setCells] = useState<Cell[]>(() => makeCells());
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      setCells((prev) => {
        let changed = false;
        const next = prev.map((c) => {
          const q = closestPointOnPerimeter(c.poly, mouse);
          if (Math.abs(q.x - c.pos.x) > 0.0001 || Math.abs(q.y - c.pos.y) > 0.0001) {
            changed = true;
            return { ...c, pos: q };
          }
          return c;
        });
        return changed ? next : prev;
      });
    };

    canvas.addEventListener("mousemove", onMove);
    return () => canvas.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#444";
    ctx.fillStyle = "#ffffff";

    for (const { poly, pos } of cells) {
      drawPolygon(ctx, poly);
      drawDot(ctx, pos, 5);
    }
  }, [cells]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "black", color: "white" }}>
      <div>
        <canvas ref={canvasRef} width={560} height={560} style={{ borderRadius: 8, width: 560, height: 560 }} />
      </div>
    </div>
  );
}
