/*
 * @Author: YEYI millerye1995@foxmail.com
 * @Date: 2025-11-26 19:15:38
 * @LastEditors: YEYI millerye1995@foxmail.com
 * @LastEditTime: 2025-11-26 20:21:27
 * @FilePath: \image-editor\src\shapes\Text.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { BaseShape, ShapeOptions } from './BaseShape';

export class TextShape extends BaseShape {
  text: string;
  fontSize: number = 20;
  fontFamily: string = 'Arial';

  constructor(options: ShapeOptions & { text: string }) {
    super(options);
    this.text = options.text;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    
    const lines = this.text.split('\n');
    let maxWidth = 0;
    lines.forEach(line => {
        const w = ctx.measureText(line).width;
        if (w > maxWidth) maxWidth = w;
    });
    const lineHeight = this.fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;

    const centerX = this.x + maxWidth / 2;
    const centerY = this.y + totalHeight / 2;
    
    this.applyRotation(ctx, centerX, centerY);

    ctx.fillStyle = this.strokeColor;
    ctx.textBaseline = 'top';
    lines.forEach((line, index) => {
        ctx.fillText(line, this.x, this.y + index * lineHeight);
    });

    ctx.restore();
  }

  hitTest(x: number, y: number): boolean {
    // Need context to measure properly, but approximation is okay for hit test
    const lines = this.text.split('\n');
    const estimatedWidth = lines.reduce((max, line) => Math.max(max, line.length * (this.fontSize * 0.6)), 0);
    const lineHeight = this.fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;

    const centerX = this.x + estimatedWidth / 2;
    const centerY = this.y + totalHeight / 2;

    const dx = x - centerX;
    const dy = y - centerY;
    const cos = Math.cos(-this.rotation);
    const sin = Math.sin(-this.rotation);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    const finalX = rx + centerX;
    const finalY = ry + centerY;

    return finalX >= this.x && finalX <= this.x + estimatedWidth && finalY >= this.y && finalY <= this.y + totalHeight;
  }

  move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  resize(x: number, y: number): void {
    // Text resize usually changes font size?
    // Or just skip for now.
  }

  clone(): TextShape {
    return new TextShape({
      x: this.x,
      y: this.y,
      text: this.text,
      strokeColor: this.strokeColor,
      lineWidth: this.lineWidth,
      rotation: this.rotation
    });
  }
}
