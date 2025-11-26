/*
 * @Author: YEYI millerye1995@foxmail.com
 * @Date: 2025-11-26 19:14:30
 * @LastEditors: YEYI millerye1995@foxmail.com
 * @LastEditTime: 2025-11-26 19:35:45
 * @FilePath: \image-editor\src\shapes\Rect.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { BaseShape, ShapeOptions } from './BaseShape';

export class Rect extends BaseShape {
  width: number;
  height: number;

  constructor(options: ShapeOptions & { width: number; height: number }) {
    super(options);
    this.width = options.width;
    this.height = options.height;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    this.applyRotation(ctx, centerX, centerY);

    ctx.beginPath();
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.lineWidth;
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.stroke();

    ctx.restore();
  }

  hitTest(x: number, y: number): boolean {
    // Inverse rotate point to check against axis-aligned rect
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    
    // Translate point to center relative
    const dx = x - centerX;
    const dy = y - centerY;
    
    // Rotate point backwards
    const cos = Math.cos(-this.rotation);
    const sin = Math.sin(-this.rotation);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    
    // Translate back
    const finalX = rx + centerX;
    const finalY = ry + centerY;

    return finalX >= this.x && finalX <= this.x + this.width && finalY >= this.y && finalY <= this.y + this.height;
  }

  move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  resize(x: number, y: number): void {
    // Basic creation resize
    this.width = x - this.x;
    this.height = y - this.y;
  }

  clone(): Rect {
    return new Rect({
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      strokeColor: this.strokeColor,
      lineWidth: this.lineWidth,
      rotation: this.rotation
    });
  }
}
