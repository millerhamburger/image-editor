import { BaseShape } from '../shapes/BaseShape';
import { Rect } from '../shapes/Rect';
import { Circle } from '../shapes/Circle';
import { Arrow } from '../shapes/Arrow';
import { PenPath } from '../shapes/Pen';
import { TextShape } from '../shapes/Text';
import { MosaicBrush } from '../shapes/MosaicBrush';
import { HistoryManager } from './HistoryManager';
import { Transformer } from './Transformer';

export type ToolType = 'select' | 'rect' | 'circle' | 'arrow' | 'pen' | 'text' | 'mosaic';

export interface EditorOptions {
  container: HTMLElement;
  width?: number;
  height?: number;
  backgroundImage?: string;
  backgroundColor?: string;
}

export class ImageEditor {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private shapes: BaseShape[] = [];
  private currentTool: ToolType = 'select';
  private currentColor: string = '#ff0000';
  private currentLineWidth: number = 2;
  private isDragging: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private currentShape: BaseShape | null = null;
  private selectedShape: BaseShape | null = null;
  private backgroundImage: HTMLImageElement | null = null;
  private backgroundColor: string = '#ffffff';
  private mousePos: { x: number; y: number } | null = null;
  private textArea!: HTMLTextAreaElement;
  private activeTextShape: TextShape | null = null;

  // For Pen tool
  private currentPenPath: { x: number; y: number }[] = [];

  // New modules
  private historyManager: HistoryManager;
  private transformer: Transformer;
  
  // State for interaction
  private transformAction: string | null = null; // 'drag', 'rotate', 'resize-tl', etc. (simplified to handle index)
  private transformHandleIndex: number = -1;

  constructor(options: EditorOptions) {
    this.container = options.container;
    if (getComputedStyle(this.container).position === 'static') {
        this.container.style.position = 'relative';
    }
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
    
    this.container.appendChild(this.canvas);
    this.resizeCanvas(options.width || 800, options.height || 600);

    this.historyManager = new HistoryManager();
    this.transformer = new Transformer();

    if (options.backgroundColor) {
      this.backgroundColor = options.backgroundColor;
    }

    if (options.backgroundImage) {
      const img = new Image();
      img.src = options.backgroundImage;
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        this.backgroundImage = img;
        this.render();
      };
    }

    this.initTextArea();
    this.initEvents();
    this.render();
  }

  private initTextArea() {
    this.textArea = document.createElement('textarea');
    this.textArea.style.position = 'absolute';
    this.textArea.style.display = 'none';
    this.textArea.style.background = 'transparent';
    this.textArea.style.border = '1px dashed #ccc';
    this.textArea.style.outline = 'none';
    this.textArea.style.padding = '0';
    this.textArea.style.margin = '0';
    this.textArea.style.resize = 'none';
    this.textArea.style.overflow = 'hidden';
    this.textArea.style.zIndex = '1000';
    this.textArea.style.font = '20px Arial'; 
    this.textArea.style.lineHeight = '1.2';
    this.textArea.style.color = this.currentColor;
    
    this.container.appendChild(this.textArea);

    this.textArea.addEventListener('input', () => {
        this.textArea.style.width = '0';
        this.textArea.style.height = '0';
        this.textArea.style.width = (this.textArea.scrollWidth + 10) + 'px';
        this.textArea.style.height = (this.textArea.scrollHeight + 10) + 'px';
    });

    this.textArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.finishTextEditing();
        }
    });

    this.textArea.addEventListener('blur', () => {
        // Delay slightly to allow click events to register if needed, 
        // but generally blur commit is fine.
        setTimeout(() => this.finishTextEditing(), 100);
    });
  }

  private finishTextEditing() {
    if (this.textArea.style.display === 'none') return;

    const val = this.textArea.value;
    if (val.trim()) {
        if (this.activeTextShape) {
             // Edit existing
             if (this.activeTextShape.text !== val) {
                 this.saveState();
                 this.activeTextShape.text = val;
             }
        } else {
             // New shape
             this.saveState();
             const rect = this.textArea.getBoundingClientRect();
             const containerRect = this.container.getBoundingClientRect();
             // Calculate relative position carefully
             // textArea.style.left/top are relative to container if container is positioned?
             // Assuming container is relative/absolute. 
             // We set style.left/top based on mouse event which is relative to canvas/container.
             // So we can parse style.
             const x = parseFloat(this.textArea.style.left);
             const y = parseFloat(this.textArea.style.top);
             
             const textShape = new TextShape({
                x, y, text: val,
                strokeColor: this.currentColor,
                lineWidth: this.currentLineWidth
             });
             this.shapes.push(textShape);
        }
    } else if (this.activeTextShape) {
        // Empty text on existing shape -> remove it? 
        // Or just keep empty. Let's remove for cleanliness.
        this.saveState();
        this.shapes = this.shapes.filter(s => s !== this.activeTextShape);
    }

    this.textArea.style.display = 'none';
    this.textArea.value = '';
    this.activeTextShape = null;
    this.render();
  }

  private resizeCanvas(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  private initEvents() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', () => {
        this.mousePos = null;
        this.render();
    });

    this.canvas.addEventListener('dblclick', (e) => {
        const { x, y } = this.getMousePos(e);
        // Find text shape to edit
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const shape = this.shapes[i];
            if (shape instanceof TextShape && shape.hitTest(x, y)) {
                this.activeTextShape = shape;
                this.textArea.value = shape.text;
                this.textArea.style.left = shape.x + 'px';
                this.textArea.style.top = shape.y + 'px';
                this.textArea.style.display = 'block';
                this.textArea.style.color = shape.strokeColor;
                this.textArea.style.width = 'auto';
                this.textArea.style.height = 'auto';
                // Trigger auto-size
                const event = new Event('input');
                this.textArea.dispatchEvent(event);
                this.textArea.focus();
                break;
            }
        }
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.selectedShape) {
          this.saveState(); // Save before delete
          this.shapes = this.shapes.filter(s => s !== this.selectedShape);
          this.selectShape(null);
          this.render();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        this.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        this.redo(); // Assuming HistoryManager has redo, but interface only showed undo? Check later.
        // Actually HistoryManager implementation in summary showed undo and push, but hinted at redoStack.
        // I will double check HistoryManager.
      }
    });
  }

  private getMousePos(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  // --- Mosaic Helper ---
  private createMosaicPattern(): CanvasPattern | null {
    // 1. Create a temp canvas with current state
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tCtx = tempCanvas.getContext('2d')!;
    
    // Draw background and shapes (excluding current being drawn if any? No, we want what's there)
    // Actually, we want to pixelate the *background* mostly, or everything?
    // User said "eraser-like effect". So it should pixelate whatever is under it.
    // So we draw the current scene.
    if (this.backgroundImage) {
      tCtx.drawImage(this.backgroundImage, 0, 0, tempCanvas.width, tempCanvas.height);
    } else {
      tCtx.fillStyle = this.backgroundColor;
      tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    }
    this.shapes.forEach(s => s.draw(tCtx));

    // 2. Pixelate
    // Draw scaled down then up
    const pixelSize = 10;
    const w = tempCanvas.width;
    const h = tempCanvas.height;
    const sw = Math.ceil(w / pixelSize);
    const sh = Math.ceil(h / pixelSize);

    // Create a tiny canvas for downscaling
    const tinyCanvas = document.createElement('canvas');
    tinyCanvas.width = sw;
    tinyCanvas.height = sh;
    const tinyCtx = tinyCanvas.getContext('2d')!;
    tinyCtx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, sw, sh);

    // Draw back to tempCanvas with smoothing disabled
    tCtx.imageSmoothingEnabled = false;
    tCtx.drawImage(tinyCanvas, 0, 0, sw, sh, 0, 0, w, h);

    return this.ctx.createPattern(tempCanvas, 'no-repeat');
  }

  private handleMouseDown(e: MouseEvent) {
    const { x, y } = this.getMousePos(e);

    // Force finish text editing if active
    if (this.textArea.style.display === 'block') {
        this.finishTextEditing();
    }

    this.startX = x;
    this.startY = y;
    this.isDragging = true;

    if (this.currentTool === 'text') {
        this.textArea.value = '';
        this.textArea.style.left = x + 'px';
        this.textArea.style.top = y + 'px';
        this.textArea.style.display = 'block';
        this.textArea.style.color = this.currentColor;
        this.textArea.style.width = '20px';
        this.textArea.style.height = '24px';
        setTimeout(() => this.textArea.focus(), 0);
        this.activeTextShape = null;
        return;
    }

    if (this.currentTool === 'select') {
      // Check Transformer handles first if shape is selected
      if (this.selectedShape) {
        const handleIndex = this.transformer.hitTest(x, y);
        if (handleIndex !== -1) {
          this.transformHandleIndex = handleIndex;
          this.saveState(); // Save before transform
          return;
        }
      }

      // Hit test for selection
      let foundShape: BaseShape | null = null;
      for (let i = this.shapes.length - 1; i >= 0; i--) {
        if (this.shapes[i].hitTest(x, y)) {
          foundShape = this.shapes[i];
          break;
        }
      }

      if (foundShape !== this.selectedShape) {
        this.selectShape(foundShape);
      }
      
      // If we clicked a shape (even if already selected), we might drag it
      if (foundShape) {
        this.transformHandleIndex = -2; // Special index for 'drag'
        this.saveState(); // Save before drag
      } else {
        this.selectShape(null);
      }
    } else {
      // Start drawing - Save state first
      this.saveState();
      this.selectShape(null); 
      
      switch (this.currentTool) {
        case 'rect':
          this.currentShape = new Rect({
            x, y, width: 0, height: 0,
            strokeColor: this.currentColor,
            lineWidth: this.currentLineWidth
          });
          break;
        case 'circle':
          this.currentShape = new Circle({
            x, y, radius: 0,
            strokeColor: this.currentColor,
            lineWidth: this.currentLineWidth
          });
          break;
        case 'arrow':
          this.currentShape = new Arrow({
            x, y, endX: x, endY: y,
            strokeColor: this.currentColor,
            lineWidth: this.currentLineWidth
          });
          break;
        case 'pen':
          this.currentPenPath = [{ x, y }];
          this.currentShape = new PenPath({
            x, y, points: this.currentPenPath,
            strokeColor: this.currentColor,
            lineWidth: this.currentLineWidth
          });
          break;
        case 'mosaic':
          const pattern = this.createMosaicPattern();
          const brush = new MosaicBrush({
            x, y, points: [{x, y}],
            strokeColor: this.currentColor, // Ignored? Or used as fallback
            lineWidth: this.currentLineWidth * 2 // Make mosaic thicker
          });
          brush.pattern = pattern;
          this.currentShape = brush;
          this.currentPenPath = [{ x, y }]; // Reuse pen path logic for points
          break;
      }

      if (this.currentShape) {
        this.shapes.push(this.currentShape);
      }
    }
    this.render();
  }

  private handleMouseMove(e: MouseEvent) {
    const { x, y } = this.getMousePos(e);
    this.mousePos = { x, y };

    if (this.isDragging) {
      if (this.currentTool === 'select' && this.selectedShape) {
        if (this.transformHandleIndex === -2) {
          // Dragging shape
          const dx = x - this.startX;
          const dy = y - this.startY;
          this.selectedShape.move(dx, dy);
          this.startX = x;
          this.startY = y;
        } else if (this.transformHandleIndex !== -1) {
          if (this.transformHandleIndex === 4) { // Rotate handle
              const bounds = this.getShapeBounds(this.selectedShape);
              const centerX = bounds.x + bounds.width / 2;
              const centerY = bounds.y + bounds.height / 2;
              const angle = Math.atan2(y - centerY, x - centerX);
              // Snap to 45 deg?
              this.selectedShape.rotation = angle + Math.PI / 2; // Adjust for handle position (usually top)
          } else {
               // Resize (simplified to just width/height for Rect, radius for Circle)
               this.selectedShape.resize(x, y);
          }
        }
      } else if (this.currentShape) {
        // Drawing
        if (this.currentTool === 'pen') {
          this.currentPenPath.push({ x, y });
          if (this.currentShape instanceof PenPath) {
              this.currentShape.points.push({ x, y });
          }
        } else if (this.currentTool === 'mosaic') {
          this.currentPenPath.push({ x, y });
          // Update points in MosaicBrush
          (this.currentShape as MosaicBrush).points = this.currentPenPath;
        } else {
          this.currentShape.resize(x, y);
        }
      }
    } else {
        this.updateCursorStyle(x, y);
    }
    this.render();
  }

  private updateCursorStyle(x: number, y: number) {
    if (this.currentTool === 'select') {
        if (this.selectedShape) {
            const handle = this.transformer.hitTest(x, y);
            switch (handle) {
                case 0: this.canvas.style.cursor = 'nw-resize'; break;
                case 1: this.canvas.style.cursor = 'ne-resize'; break;
                case 2: this.canvas.style.cursor = 'se-resize'; break;
                case 3: this.canvas.style.cursor = 'sw-resize'; break;
                case 4: this.canvas.style.cursor = 'grab'; break; // Rotate
                case -2: this.canvas.style.cursor = 'move'; break; // Drag inside
                default: this.canvas.style.cursor = 'default'; break;
            }
        } else {
            // Check if hovering over any shape
             let found = false;
             for (let i = this.shapes.length - 1; i >= 0; i--) {
                if (this.shapes[i].hitTest(x, y)) {
                    this.canvas.style.cursor = 'move';
                    found = true;
                    break;
                }
             }
             if (!found) this.canvas.style.cursor = 'default';
        }
    } else if (this.currentTool === 'mosaic') {
        this.canvas.style.cursor = 'none'; // Hide default cursor
    } else {
        this.canvas.style.cursor = 'crosshair';
    }
  }

  private handleMouseUp(e: MouseEvent) {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.currentShape = null;
    this.transformHandleIndex = -1;
  }

  private selectShape(shape: BaseShape | null) {
    this.shapes.forEach(s => s.isSelected = false);
    this.selectedShape = shape;
    if (shape) {
      shape.isSelected = true;
      this.transformer.attach(shape);
    } else {
      this.transformer.attach(null);
    }
    this.render();
  }

  public setTool(tool: ToolType) {
    this.currentTool = tool;
    this.selectShape(null);
  }

  public setColor(color: string) {
    this.currentColor = color;
    if (this.selectedShape) {
      this.saveState();
      this.selectedShape.strokeColor = color;
      this.render();
    }
  }

  public setLineWidth(width: number) {
    this.currentLineWidth = width;
    if (this.selectedShape) {
      this.saveState();
      this.selectedShape.lineWidth = width;
      this.render();
    }
  }

  public undo() {
    const prevState = this.historyManager.undo(this.shapes);
    if (prevState) {
      this.shapes = prevState;
      this.selectShape(null); // Deselect on undo to avoid ghost handles
      this.render();
    }
  }
  
  public redo() {
      // Optional: HistoryManager needs redo support
  }

  public reset() {
    this.saveState();
    this.shapes = [];
    this.selectShape(null);
    this.render();
  }

  private saveState() {
    this.historyManager.push(this.shapes);
  }

  public render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.backgroundImage) {
      this.ctx.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    this.shapes.forEach(shape => shape.draw(this.ctx));
    
    // Draw transformer on top
    this.transformer.draw(this.ctx);

    // Draw Mosaic Cursor
    if (this.currentTool === 'mosaic' && this.mousePos) {
        this.ctx.save();
        this.ctx.beginPath();
        const radius = this.currentLineWidth;
        this.ctx.arc(this.mousePos.x, this.mousePos.y, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        this.ctx.restore();
    }
  }

  public exportDataURL(): string {
    const prevSelection = this.selectedShape;
    this.selectShape(null);
    this.render(); // Re-render without handles
    const data = this.canvas.toDataURL('image/png');
    if (prevSelection) this.selectShape(prevSelection);
    return data;
  }

  // Helper to get bounds for rotation logic (duplicate of Transformer logic, maybe expose it?)
  private getShapeBounds(shape: BaseShape) {
    // This is a rough approximation if shape doesn't have getBounds public
    // Rect/Circle have easy bounds. Pen/Arrow/Mosaic need calculation.
    // For now, let's assume Transformer handles drawing, but for input logic we need it?
    // Actually, let's try to rely on the Transformer for this if possible, or duplicate minimal logic.
    // Rect
    if (shape instanceof Rect) return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
    // Circle
    if (shape instanceof Circle) return { x: shape.x - shape.radius, y: shape.y - shape.radius, width: shape.radius*2, height: shape.radius*2 };
    // Default fallback
    return { x: shape.x, y: shape.y, width: 100, height: 100 };
  }
}
