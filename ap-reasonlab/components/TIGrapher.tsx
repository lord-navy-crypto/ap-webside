"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { evalExpr, formatCalc } from "@/lib/math-expr";

type Range = { xmin: number; xmax: number; ymin: number; ymax: number };

const DEFAULT_RANGE: Range = { xmin: -10, xmax: 10, ymin: -10, ymax: 10 };

const PRESETS = [
  { label: "sin(x)", y1: "sin(x)", y2: "" },
  { label: "x² − 4", y1: "x^2-4", y2: "" },
  { label: "sin & cos", y1: "sin(x)", y2: "cos(x)" },
  { label: "exp(-x²)", y1: "exp(-x^2)", y2: "" },
  { label: "abs(x)", y1: "abs(x)", y2: "x" },
];

type Point = { x: number; y: number };

function sampleCurve(
  expression: string,
  range: Range,
  steps: number
): { points: Point[]; error?: string } {
  if (!expression.trim()) return { points: [] };
  const points: Point[] = [];
  try {
    for (let i = 0; i <= steps; i += 1) {
      const x = range.xmin + ((range.xmax - range.xmin) * i) / steps;
      const y = evalExpr(expression, { x, ans: 0 });
      points.push({ x, y: Number.isFinite(y) ? y : Number.NaN });
    }
    return { points };
  } catch (err) {
    return { points: [], error: err instanceof Error ? err.message : "Plot error" };
  }
}

export default function TIGrapher() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [y1, setY1] = useState("sin(x)");
  const [y2, setY2] = useState("");
  const [range, setRange] = useState<Range>(DEFAULT_RANGE);
  const [error, setError] = useState("");
  const [traceX, setTraceX] = useState(0);
  const [shade, setShade] = useState(true);
  const [showTable, setShowTable] = useState(true);

  const steps = 320;
  const curve1 = useMemo(() => sampleCurve(y1, range, steps), [y1, range]);
  const curve2 = useMemo(() => sampleCurve(y2, range, steps), [y2, range]);

  const tableRows = useMemo(() => {
    const rows: Array<{ x: string; y1: string; y2: string }> = [];
    const count = 11;
    for (let i = 0; i < count; i += 1) {
      const x = range.xmin + ((range.xmax - range.xmin) * i) / (count - 1);
      let v1 = "—";
      let v2 = "—";
      try {
        if (y1.trim()) v1 = formatCalc(evalExpr(y1, { x, ans: 0 }));
      } catch {
        v1 = "ERR";
      }
      try {
        if (y2.trim()) v2 = formatCalc(evalExpr(y2, { x, ans: 0 }));
      } catch {
        v2 = "ERR";
      }
      rows.push({ x: formatCalc(x), y1: v1, y2: v2 });
    }
    return rows;
  }, [range, y1, y2]);

  const traceY1 = useMemo(() => {
    try {
      return y1.trim() ? evalExpr(y1, { x: traceX, ans: 0 }) : Number.NaN;
    } catch {
      return Number.NaN;
    }
  }, [y1, traceX]);

  const traceY2 = useMemo(() => {
    try {
      return y2.trim() ? evalExpr(y2, { x: traceX, ans: 0 }) : Number.NaN;
    } catch {
      return Number.NaN;
    }
  }, [y2, traceX]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const raw = canvas.getContext("2d");
    if (!raw) return;
    const ctx: CanvasRenderingContext2D = raw;

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

    const bg = getComputedStyle(document.documentElement).getPropertyValue("--ti-lcd").trim() || "#c5d4a1";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(40, 55, 20, 0.22)";
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
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(sx(xmin), sy(0));
    ctx.lineTo(sx(xmax), sy(0));
    ctx.moveTo(sx(0), sy(ymin));
    ctx.lineTo(sx(0), sy(ymax));
    ctx.stroke();

    ctx.fillStyle = "#1f2a12";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText(`x ${xmin}`, 6, sy(0) - 6);
    ctx.fillText(`${xmax}`, w - 28, sy(0) - 6);
    ctx.fillText(`${ymax}`, sx(0) + 4, 12);
    ctx.fillText(`${ymin}`, sx(0) + 4, h - 6);

    function drawCurve(points: Point[], color: string, fill: boolean) {
      if (fill && points.length > 1) {
        ctx.beginPath();
        let started = false;
        for (const point of points) {
          if (!Number.isFinite(point.y)) {
            started = false;
            continue;
          }
          const px = sx(point.x);
          const py = sy(point.y);
          if (!started) {
            ctx.moveTo(px, sy(0));
            ctx.lineTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.lineTo(sx(points[points.length - 1].x), sy(0));
        ctx.closePath();
        ctx.fillStyle = color.replace(")", ", 0.18)").replace("rgb", "rgba").includes("rgba")
          ? color.includes("#")
            ? `${color}2e`
            : color
          : `${color}2e`;
        if (color.startsWith("#")) ctx.fillStyle = `${color}33`;
        ctx.fill();
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      let started = false;
      for (const point of points) {
        if (!Number.isFinite(point.y) || point.y < ymin - 40 || point.y > ymax + 40) {
          started = false;
          continue;
        }
        const px = sx(point.x);
        const py = sy(point.y);
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    }

    const err = curve1.error || curve2.error || "";
    setError(err);
    drawCurve(curve1.points, "#0b3d1a", shade && !!y1.trim());
    if (y2.trim()) drawCurve(curve2.points, "#1d4ed8", false);

    ctx.strokeStyle = "rgba(185, 28, 28, 0.55)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(sx(traceX), 0);
    ctx.lineTo(sx(traceX), h);
    ctx.stroke();
    ctx.setLineDash([]);

    if (Number.isFinite(traceY1)) {
      ctx.fillStyle = "#b91c1c";
      ctx.beginPath();
      ctx.arc(sx(traceX), sy(traceY1), 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (Number.isFinite(traceY2)) {
      ctx.fillStyle = "#1d4ed8";
      ctx.beginPath();
      ctx.arc(sx(traceX), sy(traceY2), 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [curve1, curve2, range, shade, traceX, traceY1, traceY2, y1, y2]);

  function zoom(factor: number) {
    setRange((prev) => {
      const mx = (prev.xmin + prev.xmax) / 2;
      const my = (prev.ymin + prev.ymax) / 2;
      const hx = ((prev.xmax - prev.xmin) / 2) * factor;
      const hy = ((prev.ymax - prev.ymin) / 2) * factor;
      return { xmin: mx - hx, xmax: mx + hx, ymin: my - hy, ymax: my + hy };
    });
  }

  function onCanvasClick(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const x = range.xmin + ratio * (range.xmax - range.xmin);
    setTraceX(Math.round(x * 1000) / 1000);
  }

  return (
    <div className="ti-shell ti-shell--wide">
      <div className="ti-brand-row">
        <span className="ti-brand">KE Graph CE</span>
        <span className="ti-sub">Dual plots · table · click-to-trace · shade</span>
      </div>
      <div className="ti-layout">
        <div>
          <div className="ti-graph-controls">
            <label className="ti-field">
              Y1=
              <input
                className="ti-input"
                value={y1}
                onChange={(event) => setY1(event.target.value)}
                spellCheck={false}
                aria-label="First function of x"
              />
            </label>
            <label className="ti-field">
              Y2=
              <input
                className="ti-input"
                value={y2}
                onChange={(event) => setY2(event.target.value)}
                spellCheck={false}
                placeholder="optional second curve"
                aria-label="Second function of x"
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
              <button
                type="button"
                className={`ti-key ${shade ? "ti-key-2nd-on" : ""}`}
                onClick={() => setShade((value) => !value)}
              >
                Shade Y1
              </button>
              <button
                type="button"
                className={`ti-key ${showTable ? "ti-key-2nd-on" : ""}`}
                onClick={() => setShowTable((value) => !value)}
              >
                Table
              </button>
            </div>
            <div className="ti-presets">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className="ti-preset"
                  onClick={() => {
                    setY1(preset.y1);
                    setY2(preset.y2);
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <canvas
            ref={canvasRef}
            className="ti-canvas ti-canvas--tall"
            aria-label="Function graph"
            onClick={onCanvasClick}
          />
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
              Y1= {Number.isFinite(traceY1) ? formatCalc(traceY1) : "—"}
              {y2.trim() ? ` · Y2= ${Number.isFinite(traceY2) ? formatCalc(traceY2) : "—"}` : ""}
            </p>
          </div>
          {error && <p className="ti-error">{error}</p>}
        </div>
        {showTable && (
          <aside className="ti-side">
            <h3 className="ti-side-title">Table</h3>
            <div className="ti-table-wrap">
              <table className="ti-table">
                <thead>
                  <tr>
                    <th>X</th>
                    <th>Y1</th>
                    <th>Y2</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr key={row.x}>
                      <td>
                        <button
                          type="button"
                          className="ti-table-x"
                          onClick={() => setTraceX(Number(row.x))}
                        >
                          {row.x}
                        </button>
                      </td>
                      <td>{row.y1}</td>
                      <td>{row.y2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="ti-hint">Click the graph or an X cell to move the trace.</p>
          </aside>
        )}
      </div>
      <p className="ti-hint">
        Dual curves (Y1 green, Y2 blue), optional shade under Y1, and a value table for visualization.
      </p>
    </div>
  );
}
