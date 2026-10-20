import path from "node:path";
import ts from "typescript";
import { defineConfig, type Plugin } from "vitest/config";

/**
 * The app tsconfig keeps `jsx: preserve` for Next.js.
 * Vitest's import analysis cannot parse that TSX, so tests that render a
 * screen compile it to JavaScript first.
 */
function compileTsxForTests(): Plugin {
  return {
    name: "compile-tsx-for-tests",
    enforce: "pre",
    transform(code, id) {
      const file = id.split("?")[0] ?? id;
      if (!file.endsWith(".tsx")) return null;
      const result = ts.transpileModule(code, {
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
        },
        fileName: file,
      });
      return { code: result.outputText };
    },
  };
}

export default defineConfig({
  plugins: [compileTsxForTests()],
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "scripts/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(
        __dirname,
        "lib/test-support/server-only-stub.ts",
      ),
    },
  },
});
