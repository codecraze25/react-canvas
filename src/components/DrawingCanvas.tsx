import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { Point, Stroke } from "../smoothing";
import {
  drawIncrementalSegment,
  drawStrokeTail,
  redrawAllStrokes,
} from "../smoothing";

export interface DrawingCanvasHandle {
  clear: () => void;
  undo: () => void;
}

interface DrawingCanvasProps {
  brushColor: string;
  brushSize: number;
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  function DrawingCanvas({ brushColor, brushSize }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const strokesRef = useRef<Stroke[]>([]);
    const activePointsRef = useRef<Point[]>([]);
    const isDrawingRef = useRef(false);
    const activeColorRef = useRef(brushColor);
    const activeSizeRef = useRef(brushSize);
    const rafRef = useRef<number | null>(null);
    const pendingPointRef = useRef<Point | null>(null);

    const [canUndo, setCanUndo] = useState(false);

    activeColorRef.current = brushColor;
    activeSizeRef.current = brushSize;

    const getContext = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return canvas.getContext("2d");
    }, []);

    const resizeCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const ctx = getContext();
      if (!canvas || !container || !ctx) return;

      const { width, height } = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redrawAllStrokes(ctx, strokesRef.current, width, height);
    }, [getContext]);

    useEffect(() => {
      resizeCanvas();
      const observer = new ResizeObserver(() => resizeCanvas());
      if (containerRef.current) {
        observer.observe(containerRef.current);
      }
      return () => observer.disconnect();
    }, [resizeCanvas]);

    const getCanvasPoint = useCallback((clientX: number, clientY: number): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    }, []);

    const flushPendingPoint = useCallback(() => {
      rafRef.current = null;
      const point = pendingPointRef.current;
      if (!point || !isDrawingRef.current) return;

      const ctx = getContext();
      if (!ctx) return;

      activePointsRef.current.push(point);
      drawIncrementalSegment(
        ctx,
        activePointsRef.current,
        activeColorRef.current,
        activeSizeRef.current,
      );
    }, [getContext]);

    const schedulePoint = useCallback(
      (point: Point) => {
        pendingPointRef.current = point;
        if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(flushPendingPoint);
        }
      },
      [flushPendingPoint],
    );

    const finishStroke = useCallback(() => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        flushPendingPoint();
      }

      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;

      const points = activePointsRef.current;
      if (points.length === 0) return;

      const ctx = getContext();
      if (ctx) {
        drawStrokeTail(ctx, points, activeColorRef.current, activeSizeRef.current);
      }

      strokesRef.current.push({
        points: [...points],
        color: activeColorRef.current,
        size: activeSizeRef.current,
      });
      activePointsRef.current = [];
      pendingPointRef.current = null;
      setCanUndo(strokesRef.current.length > 0);
    }, [flushPendingPoint, getContext]);

    const handlePointerDown = useCallback(
      (event: React.PointerEvent<HTMLCanvasElement>) => {
        event.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.setPointerCapture(event.pointerId);
        isDrawingRef.current = true;
        activePointsRef.current = [getCanvasPoint(event.clientX, event.clientY)];
      },
      [getCanvasPoint],
    );

    const handlePointerMove = useCallback(
      (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return;
        event.preventDefault();
        schedulePoint(getCanvasPoint(event.clientX, event.clientY));
      },
      [getCanvasPoint, schedulePoint],
    );

    const handlePointerUp = useCallback(
      (event: React.PointerEvent<HTMLCanvasElement>) => {
        event.preventDefault();
        const canvas = canvasRef.current;
        if (canvas?.hasPointerCapture(event.pointerId)) {
          canvas.releasePointerCapture(event.pointerId);
        }
        finishStroke();
      },
      [finishStroke],
    );

    const clearCanvas = useCallback(() => {
      strokesRef.current = [];
      activePointsRef.current = [];
      isDrawingRef.current = false;
      pendingPointRef.current = null;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const canvas = canvasRef.current;
      const ctx = getContext();
      if (!canvas || !ctx) return;

      const { width, height } = canvas.getBoundingClientRect();
      redrawAllStrokes(ctx, [], width, height);
      setCanUndo(false);
    }, [getContext]);

    const undo = useCallback(() => {
      if (strokesRef.current.length === 0) return;
      strokesRef.current.pop();

      const canvas = canvasRef.current;
      const ctx = getContext();
      if (!canvas || !ctx) return;

      const { width, height } = canvas.getBoundingClientRect();
      redrawAllStrokes(ctx, strokesRef.current, width, height);
      setCanUndo(strokesRef.current.length > 0);
    }, [getContext]);

    useImperativeHandle(ref, () => ({ clear: clearCanvas, undo }), [clearCanvas, undo]);

    return (
      <div className="canvas-area" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="drawing-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
        <span className="sr-only" aria-live="polite">
          {canUndo ? "Strokes available to undo" : "Canvas empty"}
        </span>
      </div>
    );
  },
);
