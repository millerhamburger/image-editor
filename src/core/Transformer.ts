import { BaseShape } from '../shapes/BaseShape';
import { TextShape } from '../shapes/Text';

export class Transformer {
  private shape: BaseShape | null = null;
  private handleSize = 10;
  private rotateHandleOffset = 30;

  // Handles:
  // 0: top-left, 1: top-right, 2: bottom-right, 3: bottom-left
  // 4: rotate (top-center)
  // For paths, we might only support bounds resizing which scales the path.

  attach(shape: BaseShape | null) {
    this.shape = shape;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.shape) return;

    ctx.save();
    
    // Get bounds and center
    const bounds = this.getShapeBounds(this.shape, ctx);
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    // Apply rotation
    ctx.translate(centerX, centerY);
    ctx.rotate(this.shape.rotation);
    ctx.translate(-centerX, -centerY);

    // Draw bounding box
    ctx.strokeStyle = '#00a8ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#00a8ff';

    const corners = [
      { x: bounds.x, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      { x: bounds.x, y: bounds.y + bounds.height }
    ];

    if (!(this.shape instanceof TextShape)) {
      corners.forEach(c => {
        ctx.fillRect(c.x - this.handleSize / 2, c.y - this.handleSize / 2, this.handleSize, this.handleSize);
        ctx.strokeRect(c.x - this.handleSize / 2, c.y - this.handleSize / 2, this.handleSize, this.handleSize);
      });
    }

    // Rotate Handle - Removed
    /*
    const rotateX = bounds.x + bounds.width / 2;
    const rotateY = bounds.y - this.rotateHandleOffset;
    
    ctx.beginPath();
    ctx.moveTo(rotateX, bounds.y);
    ctx.lineTo(rotateX, rotateY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(rotateX, rotateY, this.handleSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    */

    ctx.restore();
  }

  // Returns handle index: 0-3 corners, 4 rotate, -1 none, -2 inside (drag)
  hitTest(x: number, y: number, ctx?: CanvasRenderingContext2D): number {
    if (!this.shape) return -1;

    const bounds = this.getShapeBounds(this.shape, ctx);
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    // Transform mouse point to local unrotated space
    const dx = x - centerX;
    const dy = y - centerY;
    const cos = Math.cos(-this.shape.rotation);
    const sin = Math.sin(-this.shape.rotation);
    const localX = dx * cos - dy * sin + centerX;
    const localY = dx * sin + dy * cos + centerY;

    // Check rotate handle - Removed
    /*
    const rotateX = bounds.x + bounds.width / 2;
    const rotateY = bounds.y - this.rotateHandleOffset;
    if (this.dist(localX, localY, rotateX, rotateY) < this.handleSize) return 4;
    */

    const corners = [
      { x: bounds.x, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      { x: bounds.x, y: bounds.y + bounds.height }
    ];

    if (!(this.shape instanceof TextShape)) {
      for (let i = 0; i < corners.length; i++) {
        if (this.dist(localX, localY, corners[i].x, corners[i].y) < this.handleSize) return i;
      }
    }

    // Check inside
    if (localX >= bounds.x && localX <= bounds.x + bounds.width &&
        localY >= bounds.y && localY <= bounds.y + bounds.height) {
      return -2;
    }

    return -1;
  }

  private dist(x1: number, y1: number, x2: number, y2: number) {
    return Math.sqrt((x1-x2)**2 + (y1-y2)**2);
  }

  getShapeBounds(shape: BaseShape, ctx?: CanvasRenderingContext2D) {
    // Check if shape has getBounds
    if ('getBounds' in shape && typeof (shape as any).getBounds === 'function' && ctx) {
        return (shape as any).getBounds(ctx);
    }

    // Return unrotated bounds relative to shape x,y
    // For Rect/Text/Circle/Mosaic, x/y/w/h are standard.
    // For Pen/Arrow, we need to calculate.
    
    // Simplification: We rely on shapes having width/height or calculating it.
    // BaseShape doesn't have width/height. We need to cast.
    
    if ('width' in shape && 'height' in shape) {
        return { x: shape.x, y: shape.y, width: (shape as any).width, height: (shape as any).height };
    }
    if ('rx' in shape && 'ry' in shape) {
        const s = shape as any;
        return { x: s.x - Math.abs(s.rx), y: s.y - Math.abs(s.ry), width: Math.abs(s.rx) * 2, height: Math.abs(s.ry) * 2 };
    }
    if ('points' in shape) {
        const s = shape as any;
        // Points are absolute. We need their bounds.
        // We implemented getBounds in PenPath but it's private.
        // Let's re-calculate here or make it public.
        // Recalculating is safer as we don't depend on implementation details.
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        s.points.forEach((p: any) => {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        });
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    if ('endX' in shape) {
        const s = shape as any;
        const minX = Math.min(s.x, s.endX);
        const minY = Math.min(s.y, s.endY);
        const maxX = Math.max(s.x, s.endX);
        const maxY = Math.max(s.y, s.endY);
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    
    return { x: shape.x, y: shape.y, width: 0, height: 0 };
  }
}
