"use client";

import { useState } from "react";
import { evalExpr, formatCalc } from "@/lib/math-expr";

const KEYS: Array<{ label: string; insert?: string; action?: string; wide?: boolean }> = [
  { label: "2nd", action: "2nd" },
  { label: "π", insert: "π" },
  { label: "e", insert: "e" },
  { label: "CLR", action: "clear" },
  { label: "sin", insert: "sin(" },
  { label: "cos", insert: "cos(" },
  { label: "tan", insert: "tan(" },
  { label: "÷", insert: "/" },
  { label: "ln", insert: "ln(" },
  { label: "log", insert: "log(" },
  { label: "√", insert: "sqrt(" },
  { label: "×", insert: "*" },
  { label: "(", insert: "(" },
  { label: ")", insert: ")" },
  { label: "^", insert: "^" },
  { label: "−", insert: "-" },
  { label: "7", insert: "7" },
  { label: "8", insert: "8" },
  { label: "9", insert: "9" },
  { label: "+", insert: "+" },
  { label: "4", insert: "4" },
  { label: "5", insert: "5" },
  { label: "6", insert: "6" },
  { label: "ANS", action: "ans" },
  { label: "1", insert: "1" },
  { label: "2", insert: "2" },
  { label: "3", insert: "3" },
  { label: "DEL", action: "del" },
  { label: "0", insert: "0" },
  { label: ".", insert: "." },
  { label: "(-)", insert: "-" },
  { label: "ENTER", action: "enter" },
];

export default function TICalculator() {
  const [expr, setExpr] = useState("");
  const [display, setDisplay] = useState("0");
  const [ans, setAns] = useState(0);
  const [error, setError] = useState("");
  const [second, setSecond] = useState(false);

  function press(key: (typeof KEYS)[number]) {
    setError("");
    if (key.action === "clear") {
      setExpr("");
      setDisplay("0");
      return;
    }
    if (key.action === "del") {
      setExpr((value) => value.slice(0, -1));
      return;
    }
    if (key.action === "ans") {
      setExpr((value) => value + String(ans));
      return;
    }
    if (key.action === "2nd") {
      setSecond((value) => !value);
      return;
    }
    if (key.action === "enter") {
      try {
        let source = expr.trim() || display;
        if (second) {
          // 2nd layer: interpret sin/cos/tan as inverse when typed as asin etc via aliases
          source = source
            .replace(/\bsin\(/g, "asin(")
            .replace(/\bcos\(/g, "acos(")
            .replace(/\btan\(/g, "atan(");
        }
        const value = evalExpr(source, { ans });
        setAns(value);
        setDisplay(formatCalc(value));
        setExpr("");
        setSecond(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
        setDisplay("ERR");
      }
      return;
    }
    if (key.insert !== undefined) {
      setExpr((value) => value + key.insert);
    }
  }

  return (
    <div className="ti-shell">
      <div className="ti-brand-row">
        <span className="ti-brand">KE-84 Plus</span>
        <span className="ti-sub">Knowledge Explorer · Graphing calc style</span>
      </div>
      <div className="ti-screen" aria-live="polite">
        <div className="ti-screen-meta">
          <span>{second ? "2nd" : "RAD"}</span>
          <span>ANS={formatCalc(ans)}</span>
        </div>
        <div className="ti-screen-expr">{expr || " "}</div>
        <div className="ti-screen-value">{display}</div>
        {error && <p className="ti-error">{error}</p>}
      </div>
      <div className="ti-keys">
        {KEYS.map((key) => (
          <button
            key={key.label}
            type="button"
            className={`ti-key ${key.action === "enter" ? "ti-key-enter" : ""} ${
              key.action === "2nd" && second ? "ti-key-2nd-on" : ""
            }`}
            onClick={() => press(key)}
          >
            {key.label}
          </button>
        ))}
      </div>
      <p className="ti-hint">
        Tip: type expressions like <code>2*sin(π/6)</code> or use the keypad. 2nd remaps sin/cos/tan to
        inverse on ENTER.
      </p>
    </div>
  );
}
