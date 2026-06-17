Goal:
Build a small drawing canvas where strokes feel smooth, even during fast scribbling.

Core Requirements
Canvas
Full-page or fixed-size drawing area.
White or light background.
Works with mouse input.
Works with touch input if possible.
Drawing
User can press, drag, and release to draw.
Stroke should follow the pointer smoothly.
No drawing or graphics libraries.
Use native HTML5 Canvas API only.
Smoothing
Store pointer points while drawing.
Smooth the stroke using your own logic.
Recommended approach:
Use quadratic Bézier curves.
Draw from midpoint to midpoint between captured points.
Avoid raw straight-line drawing only.
Basic Controls
Clear canvas button.
Brush size control.
Brush color control.
Optional: undo button.
Code Constraints
Small project.
No Skia.
No third-party drawing libraries.
React/TypeScript is okay.
Plain HTML/CSS/JavaScript is also okay.
Performance
Drawing should feel responsive.
Avoid re-rendering React state on every pointer move.
Use requestAnimationFrame if needed.
Store drawing points in refs or plain variables.
Device Support
Desktop mouse support required.
Touch support recommended.
Use Pointer Events if building for web.
Recommended Tech Stack

Use:

React + TypeScript + HTML5 Canvas

or simpler:

Plain HTML + CSS + JavaScript
One-Line Smoothing Note

You can send this with the code:

I smooth strokes by collecting pointer points and drawing quadratic Bézier curves through midpoints instead of connecting raw points with straight lines.

Recording Checklist

In the screen recording, show:

The canvas running.
A slow stroke.
A fast scribble.
The code section where smoothing happens.
A quick explanation of the tradeoff.
What Not To Build

Do not build:

A full drawing app.
Layers.
Image export.
Authentication.
Backend.
Complex UI.
Library-based drawing engine.

Keep it small and focused on stroke feel.