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
    // Run selenium tests sequentially when not in headless mode
    // This prevents multiple browser windows from opening simultaneously
    fileParallelism: defaultConfig.headless,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: !defaultConfig.headless, // Single worker for non-headless mode
      },
    },
  },
});
