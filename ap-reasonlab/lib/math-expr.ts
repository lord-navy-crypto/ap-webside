/**
 * Small safe expression evaluator for calculator / grapher.
 * Supports + - * / ^ % parentheses, unary minus, and common functions.
 */

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  π: Math.PI,
  e: Math.E,
};

const FUNCTIONS: Record<string, (n: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  ln: Math.log,
  log: Math.log10,
  log10: Math.log10,
  sqrt: Math.sqrt,
  abs: Math.abs,
  exp: Math.exp,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
};

type Tok =
  | { t: "num"; v: number }
  | { t: "id"; v: string }
  | { t: "op"; v: string }
  | { t: "lp" }
  | { t: "rp" }
  | { t: "comma" };

function tokenize(input: string): Tok[] {
  const src = input.replace(/\s+/g, "").replace(/·/g, "*").replace(/×/g, "*").replace(/÷/g, "/");
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/[0-9.]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[0-9.]/.test(src[j])) j += 1;
      const n = Number(src.slice(i, j));
      if (!Number.isFinite(n)) throw new Error("Bad number");
      out.push({ t: "num", v: n });
      i = j;
      continue;
    }
    if (/[A-Za-zπ_]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[A-Za-z0-9π_]/.test(src[j])) j += 1;
      out.push({ t: "id", v: src.slice(i, j).toLowerCase() });
      i = j;
      continue;
    }
    if ("+-*/^%".includes(ch)) {
      out.push({ t: "op", v: ch });
      i += 1;
      continue;
    }
    if (ch === "(") {
      out.push({ t: "lp" });
      i += 1;
      continue;
    }
    if (ch === ")") {
      out.push({ t: "rp" });
      i += 1;
      continue;
    }
    if (ch === ",") {
      out.push({ t: "comma" });
      i += 1;
      continue;
    }
    throw new Error(`Unexpected “${ch}”`);
  }
  return out;
}

class Parser {
  private i = 0;
  constructor(
    private tokens: Tok[],
    private vars: Record<string, number>
  ) {}

  parse(): number {
    const value = this.expr();
    if (this.i < this.tokens.length) throw new Error("Unexpected trailing input");
    return value;
  }

  private peek(): Tok | undefined {
    return this.tokens[this.i];
  }

  private eat(): Tok {
    const tok = this.tokens[this.i++];
    if (!tok) throw new Error("Unexpected end");
    return tok;
  }

  private expr(): number {
    let left = this.term();
    while (this.peek()?.t === "op" && (this.peek() as { v: string }).v && "+-".includes((this.peek() as { v: string }).v)) {
      const op = (this.eat() as { v: string }).v;
      const right = this.term();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  private term(): number {
    let left = this.power();
    while (this.peek()?.t === "op" && "*/%".includes((this.peek() as { v: string }).v)) {
      const op = (this.eat() as { v: string }).v;
      const right = this.power();
      if (op === "*") left *= right;
      else if (op === "/") left /= right;
      else left %= right;
    }
    return left;
  }

  private power(): number {
    const base = this.unary();
    if (this.peek()?.t === "op" && (this.peek() as { v: string }).v === "^") {
      this.eat();
      const exp = this.power();
      return base ** exp;
    }
    return base;
  }

  private unary(): number {
    if (this.peek()?.t === "op" && (this.peek() as { v: string }).v === "-") {
      this.eat();
      return -this.unary();
    }
    if (this.peek()?.t === "op" && (this.peek() as { v: string }).v === "+") {
      this.eat();
      return this.unary();
    }
    return this.primary();
  }

  private primary(): number {
    const tok = this.peek();
    if (!tok) throw new Error("Expected value");
    if (tok.t === "num") {
      this.eat();
      return tok.v;
    }
    if (tok.t === "id") {
      this.eat();
      if (this.peek()?.t === "lp") {
        this.eat();
        const arg = this.expr();
        if (this.peek()?.t !== "rp") throw new Error("Missing )");
        this.eat();
        const fn = FUNCTIONS[tok.v];
        if (!fn) throw new Error(`Unknown function ${tok.v}`);
        return fn(arg);
      }
      if (tok.v in this.vars) return this.vars[tok.v];
      if (tok.v in CONSTANTS) return CONSTANTS[tok.v];
      throw new Error(`Unknown symbol ${tok.v}`);
    }
    if (tok.t === "lp") {
      this.eat();
      const value = this.expr();
      if (this.peek()?.t !== "rp") throw new Error("Missing )");
      this.eat();
      return value;
    }
    throw new Error("Expected value");
  }
}

export function evalExpr(expression: string, vars: Record<string, number> = {}): number {
  const trimmed = expression.trim();
  if (!trimmed) throw new Error("Empty expression");
  const value = new Parser(tokenize(trimmed), vars).parse();
  if (!Number.isFinite(value)) throw new Error("Not a finite number");
  return value;
}

export function formatCalc(value: number): string {
  if (!Number.isFinite(value)) return "Error";
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e10 || abs < 1e-6)) return value.toExponential(6);
  const rounded = Math.round(value * 1e10) / 1e10;
  return String(rounded);
}
