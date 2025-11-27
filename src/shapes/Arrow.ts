import { BaseShape, ShapeOptions } from './BaseShape';

export class Arrow extends BaseShape {
  endX: number;
  endY: number;

  constructor(options: ShapeOptions & { endX: number; endY: number }) {
    super(options);
    this.endX = options.endX;
    this.endY = options.endY;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const centerX = (this.x + this.endX) / 2;
    const centerY = (this.y + this.endY) / 2;
    this.applyRotation(ctx, centerX, centerY);

    const headLength = 15;
    const dx = this.endX - this.x;
    const dy = this.endY - this.y;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.lineWidth;
    
    // Main line
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.endX, this.endY);
    ctx.stroke(); // Draw the line
    
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(this.endX, this.endY);
    ctx.lineTo(this.endX - headLength * Math.cos(angle - Math.PI / 6), this.endY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(this.endX - headLength * Math.cos(angle + Math.PI / 6), this.endY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = this.strokeColor;
    ctx.fill();
    
    ctx.restore();
  }

  hitTest(x: number, y: number): boolean {
    // Basic line hit test with rotation
    const centerX = (this.x + this.endX) / 2;
    const centerY = (this.y + this.endY) / 2;
    
    const dx = x - centerX;
    const dy = y - centerY;
    const cos = Math.cos(-this.rotation);
    const sin = Math.sin(-this.rotation);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    const finalX = rx + centerX;
    const finalY = ry + centerY;

    const dist = this.pointToLineDistance(finalX, finalY, this.x, this.y, this.endX, this.endY);
    return dist < 10;
  }

  move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
    this.endX += dx;
    this.endY += dy;
  }

  resize(x: number, y: number): void {
    this.endX = x;
    this.endY = y;
  }

  clone(): Arrow {
    return new Arrow({
      x: this.x,
      y: this.y,
      endX: this.endX,
      endY: this.endY,
      strokeColor: this.strokeColor,
      lineWidth: this.lineWidth,
      rotation: this.rotation
    });
  }

  private pointToLineDistance(x: number, y: number, x1: number, y1: number, x2: number, y2: number) {
    const A = x - x1;
    const B = y - y1;
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

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
