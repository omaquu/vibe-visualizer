# Minimalist Glassmorphic Music Visualizer

A sleek, Web-based audio visualizer built with React, Three.js, and FFmpeg. 
It features a glassmorphic UI, audio-reactive 3D elements (particles, spectrums), and the ability to export your creations directly to an MP4 video file entirely within the browser!

## Features
- **Glassmorphism UI**: Minimalist, modern semi-transparent panels.
- **Three.js Engine**: High-performance 3D rendering with post-processing (Bloom, Chromatic Aberration, Noise).
- **Audio Reactivity**: Visuals bounce, scale, and glow based on audio frequency data (Bass, Mid, Treble, Kick).
- **Built-in Terminal**: Type commands like `generate videomp3 Cyberpunk space bloom` to instantly add curated layers and effects.
- **In-Browser Video Export**: Uses `ffmpeg.wasm` with `SharedArrayBuffer` to render the canvas frames and audio into an MP4 file.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

## Deploying to GitHub Pages

This project is configured for GitHub Pages using Vite. 
Because the video exporter requires `SharedArrayBuffer` (multithreading), the app uses the `coi-serviceworker` library to spoof the necessary Cross-Origin headers on GitHub Pages.

To manually deploy from your local machine using the `gh-pages` library (optional):
1. `npm install gh-pages --save-dev`
2. Add to `package.json`: 
   `"predeploy": "npm run build",`
   `"deploy": "gh-pages -d dist"`
3. Run `npm run deploy`
