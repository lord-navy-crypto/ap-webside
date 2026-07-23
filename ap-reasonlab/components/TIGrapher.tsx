"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { evalExpr } from "@/lib/math-expr";

type Range = { xmin: number; xmax: number; ymin: number; ymax: number };

const DEFAULT_RANGE: Range = { xmin: -10, xmax: 10, ymin: -10, ymax: 10 };

export default function TIGrapher() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expression, setExpression] = useState("sin(x)");
  const [range, setRange] = useState<Range>(DEFAULT_RANGE);
  const [error, setError] = useState("");
  const [traceX, setTraceX] = useState(0);

  const traceY = useMemo(() => {
    try {
      return evalExpr(expression, { x: traceX, ans: 0 });
    } catch {
      return Number.NaN;
    }
  }, [expression, traceX]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { xmin, xmax, ymin, ymax } = range;
    const w = cssW;
    const h = cssH;

    const sx = (x: number) => ((x - xmin) / (xmax - xmin)) * w;
    const sy = (y: number) => h - ((y - ymin) / (ymax - ymin)) * h;

    ctx.fillStyle = "#c5d4a1";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(40, 55, 20, 0.25)";
    ctx.lineWidth = 1;
    for (let gx = Math.ceil(xmin); gx <= Math.floor(xmax); gx += 1) {
      ctx.beginPath();
      ctx.moveTo(sx(gx), 0);
      ctx.lineTo(sx(gx), h);
      ctx.stroke();
    }
    for (let gy = Math.ceil(ymin); gy <= Math.floor(ymax); gy += 1) {
      ctx.beginPath();
      ctx.moveTo(0, sy(gy));
      ctx.lineTo(w, sy(gy));
      ctx.stroke();
    }

    ctx.strokeStyle = "#1f2a12";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx(xmin), sy(0));
    ctx.lineTo(sx(xmax), sy(0));
    ctx.moveTo(sx(0), sy(ymin));
    ctx.lineTo(sx(0), sy(ymax));
    ctx.stroke();

    ctx.strokeStyle = "#0b3d1a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    const steps = Math.max(240, Math.floor(w));
    try {
      for (let i = 0; i <= steps; i += 1) {
        const x = xmin + ((xmax - xmin) * i) / steps;
        const y = evalExpr(expression, { x, ans: 0 });
        if (!Number.isFinite(y) || y < ymin - 50 || y > ymax + 50) {
          started = false;
          continue;
        }
        const px = sx(x);
        const py = sy(y);
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Plot error");
    }

    if (Number.isFinite(traceY)) {
      ctx.fillStyle = "#b91c1c";
      ctx.beginPath();
      ctx.arc(sx(traceX), sy(traceY), 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [expression, range, traceX, traceY]);

  function zoom(factor: number) {
    setRange((prev) => {
      const mx = (prev.xmin + prev.xmax) / 2;
      const my = (prev.ymin + prev.ymax) / 2;
      const hx = ((prev.xmax - prev.xmin) / 2) * factor;
      const hy = ((prev.ymax - prev.ymin) / 2) * factor;
      return { xmin: mx - hx, xmax: mx + hx, ymin: my - hy, ymax: my + hy };
    });
  }

  return (
    <div className="ti-shell">
      <div className="ti-brand-row">
        <span className="ti-brand">KE Graph</span>
        <span className="ti-sub">TI-style function plotter · y = f(x)</span>
      </div>
      <div className="ti-graph-controls">
        <label className="ti-field">
          Y1=
          <input
            className="ti-input"
            value={expression}
            onChange={(event) => setExpression(event.target.value)}
            spellCheck={false}
            aria-label="Function of x"
          />
        </label>
        <div className="ti-range-grid">
          {(["xmin", "xmax", "ymin", "ymax"] as const).map((key) => (
            <label key={key} className="ti-field">
              {key}
              <input
                className="ti-input"
                type="number"
                value={range[key]}
                onChange={(event) =>
                  setRange((prev) => ({ ...prev, [key]: Number(event.target.value) }))
                }
              />
            </label>
          ))}
        </div>
        <div className="ti-graph-actions">
          <button type="button" className="ti-key" onClick={() => zoom(0.7)}>
            Zoom in
          </button>
          <button type="button" className="ti-key" onClick={() => zoom(1.4)}>
            Zoom out
          </button>
          <button type="button" className="ti-key" onClick={() => setRange(DEFAULT_RANGE)}>
            ZStandard
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="ti-canvas" aria-label="Function graph" />
      <div className="ti-trace">
        <label className="ti-field">
          Trace X=
          <input
            className="ti-input"
            type="number"
            step="0.1"
            value={traceX}
            onChange={(event) => setTraceX(Number(event.target.value))}
          />
        </label>
        <p className="ti-trace-readout">
          Y= {Number.isFinite(traceY) ? traceY.toFixed(6) : "—"}
        </p>
      </div>
      {error && <p className="ti-error">{error}</p>}
      <p className="ti-hint">
        Examples: <code>sin(x)</code>, <code>x^2-4</code>, <code>abs(x)</code>, <code>exp(-x^2)</code>
      </p>
    </div>
  );
}
