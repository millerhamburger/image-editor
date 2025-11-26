/*
 * @Author: YEYI millerye1995@foxmail.com
 * @Date: 2025-11-26 19:14:49
 * @LastEditors: YEYI millerye1995@foxmail.com
 * @LastEditTime: 2025-11-26 19:36:34
 * @FilePath: \image-editor\src\shapes\Circle.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { BaseShape, ShapeOptions } from './BaseShape';

export class Circle extends BaseShape {
  radius: number;

  constructor(options: ShapeOptions & { radius: number }) {
    super(options);
    this.radius = options.radius;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    // Circle center is x,y (wait, in original implementation x,y was center? No, user drags from center or corner? 
    // In original implementation: arc(this.x, this.y, ...) implies x,y is center.
    // Let's stick to x,y is center for Circle.
    this.applyRotation(ctx, this.x, this.y);

    ctx.beginPath();
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.lineWidth;
    ctx.arc(this.x, this.y, Math.abs(this.radius), 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  hitTest(x: number, y: number): boolean {
    // Rotation doesn't affect circle hit test if it's a perfect circle!
    // But if we support non-uniform scaling (ellipse) later, it would.
    // For now, distance check is enough.
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy) <= Math.abs(this.radius);
  }

  move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  resize(x: number, y: number): void {
    const dx = x - this.x;
    const dy = y - this.y;
    this.radius = Math.sqrt(dx * dx + dy * dy);
  }

  clone(): Circle {
    return new Circle({
      x: this.x,
      y: this.y,
      radius: this.radius,
      strokeColor: this.strokeColor,
      lineWidth: this.lineWidth,
      rotation: this.rotation
    });
  }
}
