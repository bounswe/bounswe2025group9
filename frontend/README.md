# Affordable and Healthy Hub - Frontend

## Project Overview

The frontend of the Affordable and Healthy Hub project is a modern web application built to provide users with access to affordable and healthy food options. This application serves as the user interface for the platform, offering a seamless experience for discovering, browsing, and managing healthy food choices.

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

## Project Setup

This project was created using Vite with React and TypeScript:

```bash
npm create vite@latest
# Select React and TypeScript (tsx) when prompted
```

### Tailwind CSS Setup

1. Install Tailwind CSS and its Vite plugin:

```bash
npm install tailwindcss @tailwindcss/vite
```

2. Configure the Vite plugin in `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
```

3. Import Tailwind CSS in your CSS file:

```css
@import "tailwindcss";
```
