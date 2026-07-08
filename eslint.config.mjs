import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const ARBITRARY_Z_INDEX =
  /\bz-\[\d+\]|\bz-(?:0|10|20|30|40|50|60|70|80|90|100)\b/;

const ngaLayeringPlugin = {
  rules: {
    "no-arbitrary-z-index": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow raw Tailwind z-index utilities; use semantic z-* tokens from @theme.",
        },
        messages: {
          useSemantic:
            "Use semantic z-index tokens (z-base, z-raised, z-sticky, z-chrome, z-overlay, z-modal, z-toast, z-dev) or portal components instead of raw z values.",
        },
        schema: [],
      },
      create(context) {
        function check(value, node) {
          if (typeof value !== "string") return;
          if (ARBITRARY_Z_INDEX.test(value)) {
            context.report({ node, messageId: "useSemantic" });
          }
        }

        return {
          Literal(node) {
            check(node.value, node);
          },
          TemplateElement(node) {
            check(node.value.raw, node);
          },
        };
      },
    },
  },
};

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      nga: ngaLayeringPlugin,
    },
    rules: {
      "nga/no-arbitrary-z-index": "error",
    },
  },
];

export default eslintConfig;
