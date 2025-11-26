// Base Shape Class

export interface ShapeOptions {
  x: number;
  y: number;
  strokeColor: string;
  lineWidth: number;
  rotation?: number; // In radians
}

export abstract class BaseShape {
  x: number;
  y: number;
  strokeColor: string;
  lineWidth: number;
  rotation: number = 0;
  isSelected: boolean = false;

  constructor(options: ShapeOptions) {
    this.x = options.x;
    this.y = options.y;
    this.strokeColor = options.strokeColor;
    this.lineWidth = options.lineWidth;
    this.rotation = options.rotation || 0;
  }

  // Draw the shape content. The context will be pre-transformed (translated/rotated) if needed by the caller,
  // OR the shape handles it.
  // Strategy: Shape draws relative to its (x,y) but applies rotation around its center?
  // Easier Strategy: Shape.draw() is responsible for applying its own rotation if it has one.
  // But wait, if we rotate, the coordinate system changes.
  abstract draw(ctx: CanvasRenderingContext2D): void;
  
  abstract hitTest(x: number, y: number): boolean;
  abstract move(dx: number, dy: number): void;
  abstract resize(x: number, y: number): void;
  
  // Clone for Undo/Redo
  abstract clone(): BaseShape;

  // Helper for applying rotation before drawing
  protected applyRotation(ctx: CanvasRenderingContext2D, centerX: number, centerY: number) {
    ctx.translate(centerX, centerY);
    ctx.rotate(this.rotation);
    ctx.translate(-centerX, -centerY);
  }

  protected pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
