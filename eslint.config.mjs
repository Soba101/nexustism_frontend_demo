import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import importPlugin from "eslint-plugin-import";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "type", "internal", "parent", "sibling", "index"],
          pathGroups: [
            { pattern: "@/services/**", group: "internal", position: "before" },
            { pattern: "@/stores/**", group: "internal", position: "before" },
            { pattern: "@/components/**", group: "internal", position: "after" },
          ],
          pathGroupsExcludedImportTypes: ["type"],
          "newlines-between": "never",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
