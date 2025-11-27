/*
 * @Author: YEYI millerye1995@foxmail.com
 * @Date: 2025-11-26 19:14:49
 * @LastEditors: YEYI millerye1995@foxmail.com
 * @LastEditTime: 2025-11-27 20:44:40
 * @FilePath: \image-editor\src\shapes\Circle.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { BaseShape, ShapeOptions } from './BaseShape';

export class Circle extends BaseShape {
  rx: number;
  ry: number;

  constructor(options: ShapeOptions & { rx: number; ry: number }) {
    super(options);
    this.rx = options.rx;
    this.ry = options.ry;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    this.applyRotation(ctx, this.x, this.y);

    ctx.beginPath();
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.lineWidth;
    ctx.ellipse(this.x, this.y, Math.abs(this.rx), Math.abs(this.ry), 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  hitTest(x: number, y: number): boolean {
    const dx = x - this.x;
    const dy = y - this.y;
    const rx = Math.max(1, Math.abs(this.rx));
    const ry = Math.max(1, Math.abs(this.ry));
    return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
  }

  move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  resize(x: number, y: number): void {
    const dx = x - this.x;
    const dy = y - this.y;
    this.rx = Math.abs(dx);
    this.ry = Math.abs(dy);
  }

  clone(): Circle {
    return new Circle({
      x: this.x,
      y: this.y,
      rx: this.rx,
      ry: this.ry,
      strokeColor: this.strokeColor,
      lineWidth: this.lineWidth,
      rotation: this.rotation
    });
  }

  getBounds() {
    return { x: this.x - Math.abs(this.rx), y: this.y - Math.abs(this.ry), width: Math.abs(this.rx) * 2, height: Math.abs(this.ry) * 2 };
  }
}
