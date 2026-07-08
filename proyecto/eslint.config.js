const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  { ignores: ["frontend/**", "node_modules/**", "dist/**"] },
  {
    files: ["api/**/*.js", "lib/**/*.js"],
    languageOptions: {
      globals: { ...globals.node, ...globals.commonjs },
      sourceType: "commonjs",
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
    },
  },
];
