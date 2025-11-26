import { BaseShape, ShapeOptions } from './BaseShape';

export class PenPath extends BaseShape {
  points: { x: number; y: number }[];

  constructor(options: ShapeOptions & { points: { x: number; y: number }[] }) {
    super(options);
    this.points = options.points.map(p => ({ ...p })); // Deep copy points
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.points.length < 2) return;

    ctx.save();
    // For freehand path, finding center is O(N).
    // To support rotation, we really should compute bounds once or cache them.
    const bounds = this.getBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    this.applyRotation(ctx, centerX, centerY);

    ctx.beginPath();
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
    
    ctx.restore();
  }

  hitTest(x: number, y: number): boolean {
    const bounds = this.getBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    const dx = x - centerX;
    const dy = y - centerY;
    const cos = Math.cos(-this.rotation);
    const sin = Math.sin(-this.rotation);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    const finalX = rx + centerX;
    const finalY = ry + centerY;

    // Check distance to polyline
    for (let i = 0; i < this.points.length - 1; i++) {
        const p1 = this.points[i];
        const p2 = this.points[i+1];
        const dist = this.pointToSegmentDistance(finalX, finalY, p1.x, p1.y, p2.x, p2.y);
        // Give it a bit more tolerance for thin lines
        if (dist <= Math.max(5, this.lineWidth / 2)) return true;
    }
    return false;
  }

  move(dx: number, dy: number): void {
    this.points.forEach(p => {
      p.x += dx;
      p.y += dy;
    });
    this.x += dx;
    this.y += dy;
  }

  resize(x: number, y: number): void {
    // Skipping complex path resize
  }

  clone(): PenPath {
    return new PenPath({
      x: this.x,
      y: this.y,
      points: this.points, // Constructor copies
      strokeColor: this.strokeColor,
      lineWidth: this.lineWidth,
      rotation: this.rotation
    });
  }

  private getBounds() {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    if (this.points.length === 0) return { minX: this.x, minY: this.y, maxX: this.x, maxY: this.y };
    
    this.points.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });
    return { minX, minY, maxX, maxY };
  }
}
