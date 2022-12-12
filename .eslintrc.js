module.exports = {
  plugins: ["@typescript-eslint", "prettier", "import"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  globals: {
    __DEV__: false,
    jasmine: false,
    beforeAll: false,
    afterAll: false,
    beforeEach: false,
    afterEach: false,
    test: false,
    expect: false,
    describe: false,
    jest: false,
    it: false,
  },
  rules: {
    "array-callback-return": "error",
    "no-debugger": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "default",
        format: ["camelCase"],
      },
      // Enforce that all functions are camelCase
      {
        selector: ["function"],
        format: ["camelCase"],
        leadingUnderscore: "allow",
      },
      // Enforce that all variables are either in camelCase or UPPER_CASE
      {
        selector: "variable",
        format: ["camelCase", "UPPER_CASE"],
        leadingUnderscore: "allow",
      },
      // Enforce that boolean variables are prefixed with an allowed verb
      {
        selector: "variable",
        types: ["boolean"],
        format: ["PascalCase"],
        prefix: ["is", "should", "has", "can", "did", "will"],
      },
      // Enforce that interface names do not begin with an I
      {
        selector: "interface",
        format: ["PascalCase"],
        custom: {
          regex: "^I[A-Z]",
          match: false,
        },
      },
      {
        selector: "typeLike",
        format: ["PascalCase"],
      },
      {
        selector: "enumMember",
        format: ["PascalCase"],
      },
    ],
    "import/order": [
      "error",
      {
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
      },
    ],
    "prettier/prettier": [
      "error",
      {
        endOfLine: "auto",
      },
    ],
  },
};
