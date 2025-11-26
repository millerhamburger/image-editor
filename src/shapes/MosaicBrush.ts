import { BaseShape, ShapeOptions } from './BaseShape';

export class MosaicBrush extends BaseShape {
  points: { x: number; y: number }[];
  pattern: CanvasPattern | null = null; // We need to inject this or context needs to provide it

  constructor(options: ShapeOptions & { points: { x: number; y: number }[] }) {
    super(options);
    this.points = options.points.map(p => ({ ...p }));
  }

  // The MosaicBrush needs the pixelated pattern to draw. 
  // Since draw() only gets ctx, we rely on the caller (Editor) to have set the strokeStyle to the pattern 
  // OR we store it. Storing pattern is tricky if background changes.
  // But for this specific use case, we can assume the pattern is static for the session unless background changes.
  // However, `draw` is called often.
  // Let's rely on `strokeColor` being hijackable OR we just use a global/static resource if needed.
  // Better: We add a `setPattern` method or pass it in options.
  // Actually, we can just say: The Editor sets the pattern as `strokeStyle` BEFORE calling draw if it detects this shape type?
  // No, `draw` sets the strokeStyle.
  // Let's add a public property `mosaicPattern`.
  
  draw(ctx: CanvasRenderingContext2D): void {
    if (this.points.length < 2) return;

    ctx.save();
    
    // Bounds for rotation center
    const bounds = this.getBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    this.applyRotation(ctx, centerX, centerY);

    ctx.beginPath();
    // We use the injected pattern if available, else fallback
    if (this.pattern) {
        ctx.strokeStyle = this.pattern;
    } else {
        ctx.strokeStyle = 'rgba(0,0,0,0.1)'; // Debug fallback
    }
    
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

    // Check bounds first
    if (finalX < bounds.minX - this.lineWidth || finalX > bounds.maxX + this.lineWidth || 
        finalY < bounds.minY - this.lineWidth || finalY > bounds.maxY + this.lineWidth) {
      return false;
    }

    // Check distance to polyline
    for (let i = 0; i < this.points.length - 1; i++) {
        const p1 = this.points[i];
        const p2 = this.points[i+1];
        const dist = this.pointToSegmentDistance(finalX, finalY, p1.x, p1.y, p2.x, p2.y);
        if (dist <= this.lineWidth / 2) return true;
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
  }

  clone(): MosaicBrush {
    const clone = new MosaicBrush({
      x: this.x,
      y: this.y,
      points: this.points,
      strokeColor: this.strokeColor,
      lineWidth: this.lineWidth,
      rotation: this.rotation
    });
    clone.pattern = this.pattern;
    return clone;
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
