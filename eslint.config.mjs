export default [
  {
    ignores: ["dist/**", "node_modules/**"]
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        caches: "readonly",
        self: "readonly",
        fetch: "readonly",
        URL: "readonly",
        console: "readonly",
        Promise: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        localStorage: "readonly",
        customElements: "readonly",
        HTMLElement: "readonly",
        location: "readonly",
        Event: "readonly",
        CustomEvent: "readonly",
        FileReader: "readonly",
        Blob: "readonly",
        alert: "readonly",
        confirm: "readonly",
        URLSearchParams: "readonly",
        AbortController: "readonly",
        CSS: "readonly",
        FormData: "readonly",
        Headers: "readonly",
        Request: "readonly",
        Response: "readonly",
        
        // Node globals (for tests/build)
        process: "readonly",
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        
        // Test runner globals
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        before: "readonly",
        after: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-undef": "error",
      "no-console": "off"
    }
  }
];
