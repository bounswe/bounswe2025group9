import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { defaultConfig } from "./src/test/selenium/selenium.config";

// vitest configuration
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Run selenium tests sequentially when not in headless mode to avoid multiple browser windows
    sequence: {
      hooks: "list",
      concurrent: defaultConfig.headless,
    },
    fileParallelism: defaultConfig.headless,
    // Global setup for shared browser instance in non-headless mode
    globalSetup: defaultConfig.headless ? undefined : "./src/test/selenium/globalSetup.ts",
  },
});
