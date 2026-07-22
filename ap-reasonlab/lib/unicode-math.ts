/**
 * Turn common Unicode physics/calc notation into KaTeX-friendly LaTeX.
 * Existing LaTeX (\, _, ^, \frac, $…$) is preserved; Unicode is a fallback.
 */

const SUBSCRIPTS: Record<string, string> = {
  "₀": "0",
  "₁": "1",
  "₂": "2",
  "₃": "3",
  "₄": "4",
  "₅": "5",
  "₆": "6",
  "₇": "7",
  "₈": "8",
  "₉": "9",
  "₊": "+",
  "₋": "-",
  "ₐ": "a",
  "ₑ": "e",
  "ₒ": "o",
  "ₓ": "x",
  "ₙ": "n",
  "ₘ": "m",
  "ₜ": "t",
  "ᵢ": "i",
  "ⱼ": "j",
  "ₖ": "k",
  "ₚ": "p",
  "ₛ": "s",
  "ᵤ": "u",
  "ᵥ": "v",
};

const SUPERSCRIPTS: Record<string, string> = {
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
  "⁺": "+",
  "⁻": "-",
  "ⁿ": "n",
};

const SYMBOLS: Array<[RegExp, string]> = [
  [/½/g, "\\frac{1}{2}"],
  [/¼/g, "\\frac{1}{4}"],
  [/¾/g, "\\frac{3}{4}"],
  [/⅓/g, "\\frac{1}{3}"],
  [/⅔/g, "\\frac{2}{3}"],
  [/∞/g, "\\infty"],
  [/±/g, "\\pm"],
  [/∓/g, "\\mp"],
  [/·/g, "\\cdot"],
  [/×/g, "\\times"],
  [/÷/g, "\\div"],
  [/≤/g, "\\le"],
  [/≥/g, "\\ge"],
  [/≠/g, "\\ne"],
  [/≈/g, "\\approx"],
  [/≡/g, "\\equiv"],
  [/→/g, "\\to"],
  [/←/g, "\\leftarrow"],
  [/⇒/g, "\\Rightarrow"],
  [/⇔/g, "\\Leftrightarrow"],
  [/∈/g, "\\in"],
  [/∉/g, "\\notin"],
  [/∝/g, "\\propto"],
  [/√/g, "\\sqrt"],
  [/∫/g, "\\int"],
  [/∑/g, "\\sum"],
  [/∏/g, "\\prod"],
  [/∂/g, "\\partial"],
  [/∇/g, "\\nabla"],
  [/∠/g, "\\angle"],
  [/°/g, "^\\circ"],
  [/Δ/g, "\\Delta "],
  [/δ/g, "\\delta "],
  [/θ/g, "\\theta "],
  [/Θ/g, "\\Theta "],
  [/π/g, "\\pi "],
  [/Π/g, "\\Pi "],
  [/μ/g, "\\mu "],
  [/ω/g, "\\omega "],
  [/Ω/g, "\\Omega "],
  [/ρ/g, "\\rho "],
  [/λ/g, "\\lambda "],
  [/Λ/g, "\\Lambda "],
  [/σ/g, "\\sigma "],
  [/Σ/g, "\\Sigma "],
  [/α/g, "\\alpha "],
  [/β/g, "\\beta "],
  [/γ/g, "\\gamma "],
  [/Γ/g, "\\Gamma "],
  [/ε/g, "\\varepsilon "],
  [/φ/g, "\\phi "],
  [/Φ/g, "\\Phi "],
  [/ψ/g, "\\psi "],
  [/Ψ/g, "\\Psi "],
  [/η/g, "\\eta "],
  [/τ/g, "\\tau "],
  [/κ/g, "\\kappa "],
  [/ν/g, "\\nu "],
  [/ξ/g, "\\xi "],
  [/χ/g, "\\chi "],
  [/−/g, "-"],
  [/–/g, "-"],
  [/—/g, "-"],
];

/** Strip wrapping math delimiters so we can re-render cleanly. */
export function stripMathDelimiters(input: string): string {
  let s = input.trim();
  if (s.startsWith("$$") && s.endsWith("$$") && s.length > 4) {
    return s.slice(2, -2).trim();
  }
  if (s.startsWith("$") && s.endsWith("$") && s.length > 2) {
    return s.slice(1, -1).trim();
  }
  if (s.startsWith("\\(") && s.endsWith("\\)")) {
    return s.slice(2, -2).trim();
  }
  if (s.startsWith("\\[") && s.endsWith("\\]")) {
    return s.slice(2, -2).trim();
  }
  return s;
}

function collapseUnicodeScripts(input: string): string {
  let out = "";
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (SUBSCRIPTS[ch]) {
      let body = "";
      while (i < input.length && SUBSCRIPTS[input[i]]) {
        body += SUBSCRIPTS[input[i]];
        i += 1;
      }
      out += `_{${body}}`;
      continue;
    }
    if (SUPERSCRIPTS[ch]) {
      let body = "";
      while (i < input.length && SUPERSCRIPTS[input[i]]) {
        body += SUPERSCRIPTS[input[i]];
        i += 1;
      }
      out += `^{${body}}`;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

/**
 * Convert authored formula text (Unicode or LaTeX) into a KaTeX source string.
 */
export function toLatexSource(input: string): string {
  let s = stripMathDelimiters(input);
  for (const [re, rep] of SYMBOLS) {
    s = s.replace(re, rep);
  }
  s = collapseUnicodeScripts(s);
  return s.replace(/ {2,}/g, " ").trim();
}

/** True if the string already uses Markdown math delimiters. */
export function hasMathDelimiters(input: string): boolean {
  return /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\]/.test(input);
}
