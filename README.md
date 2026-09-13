# Transit Maker

> **Status:** Archived / Prototype Experimentation

Transit Maker is an experimental, browser-based web app for designing and editing transit maps using a CAD-like workflow. The project explores what it takes to build a map editor that combines precision geometry with modern design flexibility.

This repository serves as an archived record of that exploration, containing implementation experiments, unfinished tooling, and the history of two distinct architectural approaches.

## Overview

Transit Maker features a custom canvas-based authoring environment designed for:

- **Route Drawing:** Interactive route creation and geometric manipulation.
- **Node Management:** Station and stop placement with alignment snapping.
- **Styling & Labels:** Custom labeling, transit styling, and element properties.
- **Exporting:** Direct rendering/exporting to SVG-like vector output.

Built with **React**, **TypeScript**, **Vite**, and **HTML5 Canvas**.

## Running Locally

### Prerequisites

- [Bun](https://bun.sh/) (or Node.js 18+)

### Setup

```bash
# Install dependencies
bun install

# Start local development server
bun dev
```

## Project Intent

The project sits at the intersection of three domains:

1. Traditional diagram and vector editors
2. Light CAD software for precise spatial layout
3. Dedicated transit-design environments tailored to schematic geometry

Routes are modeled as rich domain objects with state, metadata, and styling rules—rather than simple, disconnected vector paths.

## Repository History & Branches

### `main` (Canonical Prototype)

The primary React/Vite implementation. Features the full early data model, state management, and basic UI controls. It represents the clearest expression of the initial canvas editor design.

### `rewrite` (Architectural Exploration)

A major overhaul focused on refactoring the geometry model and data flow to improve snapping behavior and editing predictability. While unfinished, it stands as an informative study on the interaction challenges inherent to CAD-style canvas applications.

## Technical Post-Mortem

The primary challenge of this project was not canvas rendering, but managing interaction state. Developing intuitive, predictable behavior for snapping, alignment, drag manipulation, and selection handling at CAD-level precision introduces significant state and spatial-indexing complexity.

This repository is archived for reference, study, and inspiration.

## License

[MIT](LICENSE)
