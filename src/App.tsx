import { useRef, useState } from "react";
import { DrawingCanvas, type DrawingCanvasHandle } from "./components/DrawingCanvas";

const BRUSH_SIZES = [2, 4, 8, 16, 24];

export default function App() {
  const [brushColor, setBrushColor] = useState("#1a1a2e");
  const [brushSize, setBrushSize] = useState(4);
  const canvasRef = useRef<DrawingCanvasHandle>(null);

  return (
    <div className="app">
      <header className="toolbar">
        <h1 className="title">Smooth Canvas</h1>

        <div className="controls">
          <label className="control">
            <span>Color</span>
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              aria-label="Brush color"
            />
          </label>

          <label className="control">
            <span>Size</span>
            <select
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              aria-label="Brush size"
            >
              {BRUSH_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </label>

          <button type="button" className="btn" onClick={() => canvasRef.current?.undo()}>
            Undo
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => canvasRef.current?.clear()}
          >
            Clear
          </button>
        </div>
      </header>

      <DrawingCanvas ref={canvasRef} brushColor={brushColor} brushSize={brushSize} />

      <footer className="hint">
        Draw with mouse or touch. Strokes are smoothed with quadratic Bézier curves through midpoints.
      </footer>
    </div>
  );
}
