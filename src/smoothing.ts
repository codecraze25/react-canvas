export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  size: number;
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function applyStrokeStyle(
  ctx: CanvasRenderingContext2D,
  color: string,
  size: number,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

/**
 * Draw one incremental segment when a new point arrives during an active stroke.
 * Uses quadratic Bézier curves through midpoints instead of straight line segments.
 */
export function drawIncrementalSegment(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  size: number,
): void {
  if (points.length < 2) return;

  applyStrokeStyle(ctx, color, size);

  if (points.length === 2) {
    const [a, b] = points;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    return;
  }

  const p0 = points[points.length - 3];
  const p1 = points[points.length - 2];
  const p2 = points[points.length - 1];
  const start = midpoint(p0, p1);
  const end = midpoint(p1, p2);

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.quadraticCurveTo(p1.x, p1.y, end.x, end.y);
  ctx.stroke();
}

/**
 * Finish the last segment of a stroke after pointer release.
 */
export function drawStrokeTail(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  size: number,
): void {
  if (points.length < 2) {
    if (points.length === 1) {
      const p = points[0];
      applyStrokeStyle(ctx, color, size);
      ctx.beginPath();
      ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    return;
  }

  applyStrokeStyle(ctx, color, size);

  const last = points[points.length - 1];
  const prev = points[points.length - 2];

  if (points.length === 2) {
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    return;
  }

  const end = midpoint(prev, last);
  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

/**
 * Redraw a completed stroke from stored points (used for undo / resize).
 */
export function drawFullStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
): void {
  const { points, color, size } = stroke;
  if (points.length === 0) return;

  applyStrokeStyle(ctx, color, size);

  if (points.length === 1) {
    const p = points[0];
    ctx.beginPath();
    ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const end = midpoint(points[i], points[i + 1]);
    ctx.quadraticCurveTo(points[i].x, points[i].y, end.x, end.y);
  }

  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y);
  ctx.stroke();
}

export function redrawAllStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  for (const stroke of strokes) {
    drawFullStroke(ctx, stroke);
  }
}
