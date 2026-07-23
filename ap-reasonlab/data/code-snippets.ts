/** Starter / standard code samples for Code Resource (no in-browser editor yet). */

export type CodeSnippet = {
  id: string;
  language: "python" | "java" | "html";
  title: string;
  description: string;
  code: string;
};

export const standardSnippets: CodeSnippet[] = [
  {
    id: "py-hello",
    language: "python",
    title: "Hello + input",
    description: "Basic I/O starter.",
    code: `name = input("Your name: ")
print(f"Hello, {name}!")`,
  },
  {
    id: "py-list-avg",
    language: "python",
    title: "Average of a list",
    description: "Loop + sum pattern.",
    code: `nums = [3, 7, 2, 9]
avg = sum(nums) / len(nums)
print(avg)`,
  },
  {
    id: "java-hello",
    language: "java",
    title: "Hello main",
    description: "Minimal public class.",
    code: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, CSA!");
  }
}`,
  },
  {
    id: "java-array-sum",
    language: "java",
    title: "Array sum",
    description: "Enhanced for-loop.",
    code: `int[] a = {1, 2, 3, 4};
int sum = 0;
for (int x : a) sum += x;
System.out.println(sum);`,
  },
  {
    id: "html-card",
    language: "html",
    title: "Simple page card",
    description: "Starter HTML structure.",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Knowledge Explorer demo</title>
  <style>
    body { font-family: system-ui; margin: 2rem; }
    .card { border: 1px solid #ddd; padding: 1rem; border-radius: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Simulation placeholder</h1>
    <p>Replace this with your lab page.</p>
  </div>
</body>
</html>`,
  },
];

export const howToEmbedEditors = `
Installed now:
1) Web/HTML — HtmlPlayground on /code/web (textarea + iframe srcDoc preview).
2) Python — PythonPlayground on /code/python (Pyodide CDN runtime in the browser).

Still later:
3) Java — needs a remote runner (Judge0 / OneCompiler / Piston) or edit-only + download for now.
`;
