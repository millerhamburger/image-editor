// src/shapes/BaseShape.ts
var BaseShape = class {
  constructor(options) {
    this.rotation = 0;
    this.isSelected = false;
    this.x = options.x;
    this.y = options.y;
    this.strokeColor = options.strokeColor;
    this.lineWidth = options.lineWidth;
    this.rotation = options.rotation || 0;
  }
  // Helper for applying rotation before drawing
  applyRotation(ctx, centerX, centerY) {
    ctx.translate(centerX, centerY);
    ctx.rotate(this.rotation);
    ctx.translate(-centerX, -centerY);
  }
  pointToSegmentDistance(px, py, x1, y1, x2, y2) {
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
};

// src/shapes/Rect.ts
var Rect = class _Rect extends BaseShape {
  constructor(options) {
    super(options);
    this.width = options.width;
    this.height = options.height;
  }
  draw(ctx) {
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
  hitTest(x, y) {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const cos = Math.cos(-this.rotation);
    const sin = Math.sin(-this.rotation);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    const finalX = rx + centerX;
    const finalY = ry + centerY;
    return finalX >= this.x && finalX <= this.x + this.width && finalY >= this.y && finalY <= this.y + this.height;
  }
  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }
  resize(x, y) {
    this.width = x - this.x;
    this.height = y - this.y;
  }
  clone() {
    return new _Rect({
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      strokeColor: this.strokeColor,
      lineWidth: this.lineWidth,
      rotation: this.rotation
    });
  }
};

// src/shapes/Circle.ts
var Circle = class _Circle extends BaseShape {
  constructor(options) {
    super(options);
    this.rx = options.rx;
    this.ry = options.ry;
  }
  draw(ctx) {
    ctx.save();
    this.applyRotation(ctx, this.x, this.y);
    ctx.beginPath();
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.lineWidth;
    ctx.ellipse(this.x, this.y, Math.abs(this.rx), Math.abs(this.ry), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  hitTest(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    const rx = Math.max(1, Math.abs(this.rx));
    const ry = Math.max(1, Math.abs(this.ry));
    return dx * dx / (rx * rx) + dy * dy / (ry * ry) <= 1;
  }
  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }
  resize(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    this.rx = Math.abs(dx);
    this.ry = Math.abs(dy);
  }
  clone() {
    return new _Circle({
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
};

// src/shapes/Arrow.ts
var Arrow = class _Arrow extends BaseShape {
  constructor(options) {
    super(options);
    this.endX = options.endX;
    this.endY = options.endY;
  }
  draw(ctx) {
    ctx.save();
    const centerX = (this.x + this.endX) / 2;
    const centerY = (this.y + this.endY) / 2;
    this.applyRotation(ctx, centerX, centerY);
    const dx = this.endX - this.x;
    const dy = this.endY - this.y;
    const angle = Math.atan2(dy, dx);
    const headLength = Math.max(12, this.lineWidth * 3);
    const baseX = this.endX - headLength * Math.cos(angle);
    const baseY = this.endY - headLength * Math.sin(angle);
    ctx.beginPath();
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = "butt";
    const overlap = Math.max(1, this.lineWidth / 2);
    const shaftEndX = baseX + overlap * Math.cos(angle);
    const shaftEndY = baseY + overlap * Math.sin(angle);
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(shaftEndX, shaftEndY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(this.endX, this.endY);
    ctx.lineTo(this.endX - headLength * Math.cos(angle - Math.PI / 6), this.endY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(this.endX - headLength * Math.cos(angle + Math.PI / 6), this.endY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = this.strokeColor;
    ctx.fill();
    ctx.restore();
  }
  hitTest(x, y) {
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
  move(dx, dy) {
    this.x += dx;
    this.y += dy;
    this.endX += dx;
    this.endY += dy;
  }
  resize(x, y) {
    this.endX = x;
    this.endY = y;
  }
  clone() {
    return new _Arrow({
      x: this.x,
      y: this.y,
      endX: this.endX,
      endY: this.endY,
      strokeColor: this.strokeColor,
      lineWidth: this.lineWidth,
      rotation: this.rotation
    });
  }
  pointToLineDistance(x, y, x1, y1, x2, y2) {
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
};

// src/shapes/Pen.ts
var PenPath = class _PenPath extends BaseShape {
  constructor(options) {
    super(options);
    this.points = options.points.map((p) => ({ ...p }));
  }
  draw(ctx) {
    if (this.points.length < 2) return;
    ctx.save();
    const bounds = this.getBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    this.applyRotation(ctx, centerX, centerY);
    ctx.beginPath();
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }
  hitTest(x, y) {
    return false;
  }
  move(dx, dy) {
    this.points.forEach((p) => {
      p.x += dx;
      p.y += dy;
    });
    this.x += dx;
    this.y += dy;
  }
  resize(x, y) {
  }
  clone() {
    return new _PenPath({
      x: this.x,
      y: this.y,
      points: this.points,
      // Constructor copies
      strokeColor: this.strokeColor,
      lineWidth: this.lineWidth,
      rotation: this.rotation
    });
  }
  getBounds() {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    if (this.points.length === 0) return { minX: this.x, minY: this.y, maxX: this.x, maxY: this.y };
    this.points.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });
    return { minX, minY, maxX, maxY };
  }
};

// src/shapes/Text.ts
var TextShape = class _TextShape extends BaseShape {
  constructor(options) {
    super(options);
    this.fontSize = 20;
    this.fontFamily = "Arial";
    this.text = options.text;
  }
  draw(ctx) {
    ctx.save();
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    const lines = this.text.split("\n");
    let maxWidth = 0;
    lines.forEach((line) => {
      const w = ctx.measureText(line).width;
      if (w > maxWidth) maxWidth = w;
    });
    const lineHeight = this.fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const centerX = this.x + maxWidth / 2;
    const centerY = this.y + totalHeight / 2;
    this.applyRotation(ctx, centerX, centerY);
    ctx.fillStyle = this.strokeColor;
    ctx.textBaseline = "top";
    lines.forEach((line, index) => {
      ctx.fillText(line, this.x, this.y + index * lineHeight);
    });
    ctx.restore();
  }
  hitTest(x, y) {
    const lines = this.text.split("\n");
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
  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }
  resize(x, y) {
  }
  clone() {
    return new _TextShape({
      x: this.x,
      y: this.y,
      text: this.text,
      strokeColor: this.strokeColor,
      lineWidth: this.lineWidth,
      rotation: this.rotation
    });
  }
  getBounds(ctx) {
    ctx.save();
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    const lines = this.text.split("\n");
    let maxWidth = 0;
    lines.forEach((line) => {
      const w = ctx.measureText(line).width;
      if (w > maxWidth) maxWidth = w;
    });
    const lineHeight = this.fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    ctx.restore();
    return {
      x: this.x,
      y: this.y,
      width: maxWidth,
      height: totalHeight
    };
  }
};

// src/shapes/MosaicBrush.ts
var MosaicBrush = class _MosaicBrush extends BaseShape {
  // We need to inject this or context needs to provide it
  constructor(options) {
    super(options);
    this.pattern = null;
    this.points = options.points.map((p) => ({ ...p }));
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
  draw(ctx) {
    if (this.points.length < 2) return;
    ctx.save();
    const bounds = this.getBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    this.applyRotation(ctx, centerX, centerY);
    ctx.beginPath();
    if (this.pattern) {
      ctx.strokeStyle = this.pattern;
    } else {
      ctx.strokeStyle = "rgba(0,0,0,0.1)";
    }
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }
  hitTest(x, y) {
    return false;
  }
  move(dx, dy) {
    this.points.forEach((p) => {
      p.x += dx;
      p.y += dy;
    });
    this.x += dx;
    this.y += dy;
  }
  resize(x, y) {
  }
  clone() {
    const clone = new _MosaicBrush({
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
  getBounds() {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    if (this.points.length === 0) return { minX: this.x, minY: this.y, maxX: this.x, maxY: this.y };
    this.points.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });
    return { minX, minY, maxX, maxY };
  }
};

// src/core/HistoryManager.ts
var HistoryManager = class {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.limit = 20;
  }
  push(state) {
    const clone = state.map((s) => s.clone());
    this.undoStack.push(clone);
    if (this.undoStack.length > this.limit) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }
  undo(currentState) {
    if (this.undoStack.length === 0) return null;
    const currentClone = currentState.map((s) => s.clone());
    this.redoStack.push(currentClone);
    const prevState = this.undoStack.pop();
    return prevState ? prevState.map((s) => s.clone()) : null;
  }
  redo(currentState) {
    if (this.redoStack.length === 0) return null;
    const currentClone = currentState.map((s) => s.clone());
    this.undoStack.push(currentClone);
    const nextState = this.redoStack.pop();
    return nextState ? nextState.map((s) => s.clone()) : null;
  }
  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
};

// src/core/Transformer.ts
var Transformer = class {
  constructor() {
    this.shape = null;
    this.handleSize = 10;
    this.rotateHandleOffset = 30;
  }
  // Handles:
  // 0: top-left, 1: top-right, 2: bottom-right, 3: bottom-left
  // 4: rotate (top-center)
  // For paths, we might only support bounds resizing which scales the path.
  attach(shape) {
    this.shape = shape;
  }
  draw(ctx) {
    if (!this.shape) return;
    ctx.save();
    const bounds = this.getShapeBounds(this.shape, ctx);
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate(this.shape.rotation);
    ctx.translate(-centerX, -centerY);
    ctx.strokeStyle = "#00a8ff";
    ctx.lineWidth = 1;
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#00a8ff";
    const corners = [
      { x: bounds.x, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      { x: bounds.x, y: bounds.y + bounds.height }
    ];
    if (!(this.shape instanceof TextShape)) {
      corners.forEach((c) => {
        ctx.fillRect(c.x - this.handleSize / 2, c.y - this.handleSize / 2, this.handleSize, this.handleSize);
        ctx.strokeRect(c.x - this.handleSize / 2, c.y - this.handleSize / 2, this.handleSize, this.handleSize);
      });
    }
    ctx.restore();
  }
  // Returns handle index: 0-3 corners, 4 rotate, -1 none, -2 inside (drag)
  hitTest(x, y, ctx) {
    if (!this.shape) return -1;
    const bounds = this.getShapeBounds(this.shape, ctx);
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const cos = Math.cos(-this.shape.rotation);
    const sin = Math.sin(-this.shape.rotation);
    const localX = dx * cos - dy * sin + centerX;
    const localY = dx * sin + dy * cos + centerY;
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
    if (localX >= bounds.x && localX <= bounds.x + bounds.width && localY >= bounds.y && localY <= bounds.y + bounds.height) {
      return -2;
    }
    return -1;
  }
  dist(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
  }
  getShapeBounds(shape, ctx) {
    if ("getBounds" in shape && typeof shape.getBounds === "function" && ctx) {
      return shape.getBounds(ctx);
    }
    if ("width" in shape && "height" in shape) {
      return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
    }
    if ("rx" in shape && "ry" in shape) {
      const s = shape;
      return { x: s.x - Math.abs(s.rx), y: s.y - Math.abs(s.ry), width: Math.abs(s.rx) * 2, height: Math.abs(s.ry) * 2 };
    }
    if ("points" in shape) {
      const s = shape;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      s.points.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      });
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    if ("endX" in shape) {
      const s = shape;
      const minX = Math.min(s.x, s.endX);
      const minY = Math.min(s.y, s.endY);
      const maxX = Math.max(s.x, s.endX);
      const maxY = Math.max(s.y, s.endY);
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    return { x: shape.x, y: shape.y, width: 0, height: 0 };
  }
};

// src/core/Editor.ts
var ImageEditor = class {
  constructor(options) {
    this.shapes = [];
    this.currentTool = "select";
    this.currentColor = "#ff0000";
    this.currentLineWidth = 2;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.currentShape = null;
    this.selectedShape = null;
    this.backgroundImage = null;
    this.backgroundColor = "#ffffff";
    this.mousePos = null;
    this.activeTextShape = null;
    this.locale = "zh";
    // For Pen tool
    this.currentPenPath = [];
    // State for interaction
    this.transformAction = null;
    // 'drag', 'rotate', 'resize-tl', etc. (simplified to handle index)
    this.transformHandleIndex = -1;
    this.container = options.container;
    if (getComputedStyle(this.container).position === "static") {
      this.container.style.position = "relative";
    }
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    this.container.appendChild(this.canvas);
    this.resizeCanvas(options.width || 800, options.height || 600);
    if (options.locale) {
      this.locale = options.locale;
    }
    if (options.onSave) {
      this.onSave = options.onSave;
    }
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
  initTextArea() {
    this.textArea = document.createElement("textarea");
    this.textArea.style.position = "absolute";
    this.textArea.style.display = "none";
    this.textArea.style.background = "transparent";
    this.textArea.style.border = "1px dashed #ccc";
    this.textArea.style.outline = "none";
    this.textArea.style.padding = "0";
    this.textArea.style.margin = "0";
    this.textArea.style.resize = "none";
    this.textArea.style.overflow = "hidden";
    this.textArea.style.zIndex = "1000";
    this.textArea.style.font = "20px Arial";
    this.textArea.style.lineHeight = "1.2";
    this.textArea.style.whiteSpace = "nowrap";
    this.textArea.style.color = this.currentColor;
    this.container.appendChild(this.textArea);
    this.textArea.addEventListener("input", () => {
      this.textArea.value = this.textArea.value.replace(/\n/g, "");
      this.textArea.style.width = "0";
      this.textArea.style.height = "0";
      this.textArea.style.width = this.textArea.scrollWidth + 10 + "px";
      this.textArea.style.height = this.textArea.scrollHeight + 10 + "px";
    });
    this.textArea.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.finishTextEditing();
      }
    });
    this.textArea.addEventListener("blur", () => {
      setTimeout(() => this.finishTextEditing(), 100);
    });
  }
  finishTextEditing() {
    if (this.textArea.style.display === "none") return;
    const val = this.textArea.value;
    if (val.trim()) {
      if (this.activeTextShape) {
        if (this.activeTextShape.text !== val) {
          this.saveState();
          this.activeTextShape.text = val;
        }
      } else {
        this.saveState();
        const rect = this.textArea.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        const x = parseFloat(this.textArea.style.left) - this.canvas.offsetLeft;
        const y = parseFloat(this.textArea.style.top) - this.canvas.offsetTop;
        const textShape = new TextShape({
          x,
          y,
          text: val,
          strokeColor: this.currentColor,
          lineWidth: this.currentLineWidth
        });
        this.shapes.push(textShape);
      }
    } else if (this.activeTextShape) {
      this.saveState();
      this.shapes = this.shapes.filter((s) => s !== this.activeTextShape);
    }
    this.textArea.style.display = "none";
    this.textArea.value = "";
    this.activeTextShape = null;
    this.render();
  }
  resizeCanvas(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }
  initEvents() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
    this.canvas.addEventListener("mouseleave", () => {
      this.mousePos = null;
      this.render();
    });
    this.canvas.addEventListener("dblclick", (e) => {
      const { x, y } = this.getMousePos(e);
      for (let i = this.shapes.length - 1; i >= 0; i--) {
        const shape = this.shapes[i];
        if (shape instanceof TextShape && shape.hitTest(x, y)) {
          this.activeTextShape = shape;
          this.textArea.value = shape.text;
          this.textArea.style.left = shape.x + this.canvas.offsetLeft + "px";
          this.textArea.style.top = shape.y + this.canvas.offsetTop + "px";
          this.textArea.style.display = "block";
          this.textArea.style.color = shape.strokeColor;
          this.textArea.style.width = "auto";
          this.textArea.style.height = "auto";
          const event = new Event("input");
          this.textArea.dispatchEvent(event);
          this.textArea.focus();
          this.render();
          break;
        }
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (this.selectedShape) {
          this.saveState();
          this.shapes = this.shapes.filter((s) => s !== this.selectedShape);
          this.selectShape(null);
          this.render();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        this.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        this.redo();
      }
    });
  }
  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
  // --- Mosaic Helper ---
  createMosaicPattern() {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tCtx = tempCanvas.getContext("2d");
    if (this.backgroundImage) {
      tCtx.drawImage(this.backgroundImage, 0, 0, tempCanvas.width, tempCanvas.height);
    } else {
      tCtx.fillStyle = this.backgroundColor;
      tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    }
    this.shapes.forEach((s) => s.draw(tCtx));
    const pixelSize = 10;
    const w = tempCanvas.width;
    const h = tempCanvas.height;
    const sw = Math.ceil(w / pixelSize);
    const sh = Math.ceil(h / pixelSize);
    const tinyCanvas = document.createElement("canvas");
    tinyCanvas.width = sw;
    tinyCanvas.height = sh;
    const tinyCtx = tinyCanvas.getContext("2d");
    tinyCtx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, sw, sh);
    tCtx.imageSmoothingEnabled = false;
    tCtx.drawImage(tinyCanvas, 0, 0, sw, sh, 0, 0, w, h);
    return this.ctx.createPattern(tempCanvas, "no-repeat");
  }
  handleMouseDown(e) {
    const { x, y } = this.getMousePos(e);
    if (this.textArea.style.display === "block") {
      this.finishTextEditing();
    }
    this.startX = x;
    this.startY = y;
    this.isDragging = true;
    if (this.currentTool === "text") {
      this.textArea.value = "";
      this.textArea.style.left = x + this.canvas.offsetLeft + "px";
      this.textArea.style.top = y + this.canvas.offsetTop + "px";
      this.textArea.style.display = "block";
      this.textArea.style.color = this.currentColor;
      this.textArea.style.width = "20px";
      this.textArea.style.height = "24px";
      setTimeout(() => this.textArea.focus(), 0);
      this.activeTextShape = null;
      return;
    }
    if (this.currentTool === "select") {
      if (this.selectedShape) {
        const handleIndex = this.transformer.hitTest(x, y, this.ctx);
        if (handleIndex !== -1) {
          this.transformHandleIndex = handleIndex;
          this.saveState();
          return;
        }
      }
      let foundShape = null;
      for (let i = this.shapes.length - 1; i >= 0; i--) {
        if (this.shapes[i].hitTest(x, y)) {
          foundShape = this.shapes[i];
          break;
        }
      }
      if (foundShape !== this.selectedShape) {
        this.selectShape(foundShape);
      }
      if (foundShape) {
        this.transformHandleIndex = -2;
        this.saveState();
      } else {
        this.selectShape(null);
      }
    } else {
      this.saveState();
      this.selectShape(null);
      switch (this.currentTool) {
        case "rect":
          this.currentShape = new Rect({
            x,
            y,
            width: 0,
            height: 0,
            strokeColor: this.currentColor,
            lineWidth: this.currentLineWidth
          });
          break;
        case "circle":
          this.currentShape = new Circle({
            x,
            y,
            rx: 0,
            ry: 0,
            strokeColor: this.currentColor,
            lineWidth: this.currentLineWidth
          });
          break;
        case "arrow":
          this.currentShape = new Arrow({
            x,
            y,
            endX: x,
            endY: y,
            strokeColor: this.currentColor,
            lineWidth: this.currentLineWidth
          });
          break;
        case "pen":
          this.currentPenPath = [{ x, y }];
          this.currentShape = new PenPath({
            x,
            y,
            points: this.currentPenPath,
            strokeColor: this.currentColor,
            lineWidth: this.currentLineWidth
          });
          break;
        case "mosaic":
          const pattern = this.createMosaicPattern();
          const brush = new MosaicBrush({
            x,
            y,
            points: [{ x, y }],
            strokeColor: this.currentColor,
            // Ignored? Or used as fallback
            lineWidth: this.currentLineWidth * 2
            // Make mosaic thicker
          });
          brush.pattern = pattern;
          this.currentShape = brush;
          this.currentPenPath = [{ x, y }];
          break;
      }
      if (this.currentShape) {
        this.shapes.push(this.currentShape);
      }
    }
    this.render();
  }
  handleMouseMove(e) {
    const { x, y } = this.getMousePos(e);
    this.mousePos = { x, y };
    if (this.isDragging) {
      if (this.currentTool === "select" && this.selectedShape) {
        if (this.transformHandleIndex === -2) {
          const dx = x - this.startX;
          const dy = y - this.startY;
          this.selectedShape.move(dx, dy);
          this.startX = x;
          this.startY = y;
        } else if (this.transformHandleIndex !== -1) {
          if (this.transformHandleIndex === 4) {
          } else {
            this.selectedShape.resize(x, y);
          }
        }
      } else if (this.currentShape) {
        if (this.currentTool === "pen") {
          this.currentPenPath.push({ x, y });
          if (this.currentShape instanceof PenPath) {
            this.currentShape.points.push({ x, y });
          }
        } else if (this.currentTool === "mosaic") {
          this.currentPenPath.push({ x, y });
          this.currentShape.points = this.currentPenPath;
        } else {
          this.currentShape.resize(x, y);
        }
      }
    } else {
      this.updateCursorStyle(x, y);
    }
    this.render();
  }
  updateCursorStyle(x, y) {
    if (this.currentTool === "select") {
      if (this.selectedShape) {
        const handle = this.transformer.hitTest(x, y, this.ctx);
        switch (handle) {
          case 0:
            this.canvas.style.cursor = "nw-resize";
            break;
          case 1:
            this.canvas.style.cursor = "ne-resize";
            break;
          case 2:
            this.canvas.style.cursor = "se-resize";
            break;
          case 3:
            this.canvas.style.cursor = "sw-resize";
            break;
          case 4:
            this.canvas.style.cursor = "grab";
            break;
          // Rotate
          case -2:
            this.canvas.style.cursor = "move";
            break;
          // Drag inside
          default:
            this.canvas.style.cursor = "default";
            break;
        }
      } else {
        let found = false;
        for (let i = this.shapes.length - 1; i >= 0; i--) {
          if (this.shapes[i].hitTest(x, y)) {
            this.canvas.style.cursor = "move";
            found = true;
            break;
          }
        }
        if (!found) this.canvas.style.cursor = "default";
      }
    } else if (this.currentTool === "mosaic") {
      this.canvas.style.cursor = "none";
    } else {
      this.canvas.style.cursor = "crosshair";
    }
  }
  handleMouseUp(e) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.currentShape = null;
    this.transformHandleIndex = -1;
  }
  selectShape(shape) {
    this.shapes.forEach((s) => s.isSelected = false);
    this.selectedShape = shape;
    if (shape) {
      shape.isSelected = true;
      this.transformer.attach(shape);
    } else {
      this.transformer.attach(null);
    }
    this.render();
  }
  setTool(tool) {
    this.currentTool = tool;
    this.selectShape(null);
  }
  setColor(color) {
    this.currentColor = color;
    if (this.selectedShape) {
      this.saveState();
      this.selectedShape.strokeColor = color;
      this.render();
    }
  }
  setLineWidth(width) {
    this.currentLineWidth = width;
    if (this.selectedShape) {
      this.saveState();
      this.selectedShape.lineWidth = width;
      this.render();
    }
  }
  undo() {
    const prevState = this.historyManager.undo(this.shapes);
    if (prevState) {
      this.shapes = prevState;
      this.selectShape(null);
      this.render();
    }
  }
  redo() {
  }
  reset() {
    this.saveState();
    this.shapes = [];
    this.selectShape(null);
    this.render();
  }
  saveState() {
    this.historyManager.push(this.shapes);
  }
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.backgroundImage) {
      this.ctx.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    const editing = this.textArea && this.textArea.style.display === "block";
    this.shapes.forEach((shape) => {
      if (editing && this.activeTextShape && shape === this.activeTextShape) return;
      shape.draw(this.ctx);
    });
    if (!(editing && this.activeTextShape && this.selectedShape === this.activeTextShape)) {
      this.transformer.draw(this.ctx);
    }
    if (this.currentTool === "mosaic" && this.mousePos) {
      this.ctx.save();
      this.ctx.beginPath();
      const radius = this.currentLineWidth;
      this.ctx.arc(this.mousePos.x, this.mousePos.y, radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = "#000";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.restore();
    }
  }
  exportDataURL() {
    const prevSelection = this.selectedShape;
    this.selectShape(null);
    this.render();
    const data = this.canvas.toDataURL("image/png");
    if (prevSelection) this.selectShape(prevSelection);
    return data;
  }
  save() {
    const prevSelection = this.selectedShape;
    this.selectShape(null);
    this.render();
    this.canvas.toBlob((blob) => {
      if (blob && this.onSave) {
        this.onSave(blob);
      }
      if (prevSelection) this.selectShape(prevSelection);
    }, "image/png");
  }
};

// src/ui/Icons.ts
var Icons = {
  Select: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>`,
  Rect: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>`,
  Circle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`,
  Arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  Pen: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`,
  Text: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
  Mosaic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="M4 8h16M4 12h16M4 16h16M8 4v16M12 4v16M16 4v16"/></svg>`,
  Undo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`,
  Reset: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
  Save: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
  Export: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`
};

// src/ui/Toolbar.ts
var Toolbar = class {
  constructor(container, editor) {
    this.tools = [
      { type: "select", icon: Icons.Select },
      { type: "rect", icon: Icons.Rect },
      { type: "circle", icon: Icons.Circle },
      { type: "arrow", icon: Icons.Arrow },
      { type: "pen", icon: Icons.Pen },
      { type: "text", icon: Icons.Text },
      { type: "mosaic", icon: Icons.Mosaic }
    ];
    this.labels = {
      zh: {
        select: "\u9009\u62E9",
        rect: "\u77E9\u5F62",
        circle: "\u692D\u5706",
        arrow: "\u7BAD\u5934",
        pen: "\u753B\u7B14",
        text: "\u6587\u5B57",
        mosaic: "\u6253\u7801",
        undo: "\u64A4\u9500",
        reset: "\u91CD\u7F6E",
        save: "\u4FDD\u5B58",
        color: "\u989C\u8272: ",
        width: "\u7C97\u7EC6: ",
        confirmReset: "\u786E\u5B9A\u8981\u6E05\u7A7A\u6240\u6709\u5185\u5BB9\u5417\uFF1F"
      },
      en: {
        select: "Select",
        rect: "Rectangle",
        circle: "Ellipse",
        arrow: "Arrow",
        pen: "Pen",
        text: "Text",
        mosaic: "Mosaic",
        undo: "Undo",
        reset: "Reset",
        save: "Save",
        color: "Color: ",
        width: "Width: ",
        confirmReset: "Are you sure you want to reset all changes?"
      }
    };
    this.container = container;
    this.editor = editor;
    this.render();
  }
  get t() {
    return this.labels[this.editor.locale] || this.labels["zh"];
  }
  render() {
    this.container.innerHTML = "";
    this.container.className = "image-editor-toolbar";
    const actionsContainer = document.createElement("div");
    actionsContainer.className = "tools-group";
    this.createButton(actionsContainer, Icons.Undo, this.t.undo, () => this.editor.undo());
    this.createButton(actionsContainer, Icons.Reset, this.t.reset, () => {
      this.editor.reset();
    });
    this.createButton(actionsContainer, Icons.Save, this.t.save, () => {
      this.editor.save();
    });
    this.container.appendChild(actionsContainer);
    const sep1 = document.createElement("div");
    sep1.style.width = "1px";
    sep1.style.height = "24px";
    sep1.style.background = "#ccc";
    sep1.style.margin = "0 5px";
    this.container.appendChild(sep1);
    const toolsContainer = document.createElement("div");
    toolsContainer.className = "tools-group";
    this.tools.forEach((tool) => {
      const btn = document.createElement("button");
      btn.innerHTML = tool.icon;
      btn.title = this.t[tool.type] || tool.type;
      btn.className = "tool-btn mode-btn";
      btn.onclick = () => {
        this.editor.setTool(tool.type);
        this.setActive(btn);
      };
      if (tool.type === "select") btn.classList.add("active");
      toolsContainer.appendChild(btn);
    });
    this.container.appendChild(toolsContainer);
    const attrsContainer = document.createElement("div");
    attrsContainer.className = "attrs-group";
    const colorLabel = document.createElement("label");
    colorLabel.innerText = this.t.color;
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = "#ff0000";
    colorInput.onchange = (e) => {
      this.editor.setColor(e.target.value);
    };
    attrsContainer.appendChild(colorLabel);
    attrsContainer.appendChild(colorInput);
    const widthLabel = document.createElement("label");
    widthLabel.innerText = this.t.width;
    const widthInput = document.createElement("input");
    widthInput.type = "range";
    widthInput.min = "1";
    widthInput.max = "20";
    widthInput.value = "2";
    widthInput.onchange = (e) => {
      this.editor.setLineWidth(parseInt(e.target.value));
    };
    attrsContainer.appendChild(widthLabel);
    attrsContainer.appendChild(widthInput);
    this.container.appendChild(attrsContainer);
  }
  createButton(container, icon, title, onClick) {
    const btn = document.createElement("button");
    btn.innerHTML = icon;
    btn.title = title;
    btn.className = "tool-btn";
    btn.onclick = onClick;
    container.appendChild(btn);
    return btn;
  }
  setActive(btn) {
    const btns = this.container.querySelectorAll(".tools-group .tool-btn");
    const modeBtns = this.container.querySelectorAll(".mode-btn");
    modeBtns.forEach((b) => b.classList.remove("active"));
    if (btn.classList.contains("mode-btn")) {
      btn.classList.add("active");
    }
  }
};

// src/index.ts
var EditorApp = class {
  constructor(containerId, options) {
    const root = document.getElementById(containerId);
    if (!root) throw new Error("Container not found");
    const toolbarContainer = document.createElement("div");
    const editorContainer = document.createElement("div");
    root.appendChild(toolbarContainer);
    root.appendChild(editorContainer);
    this.editor = new ImageEditor({
      container: editorContainer,
      width: options.width,
      height: options.height,
      backgroundImage: options.backgroundImage,
      onSave: options.onSave
    });
    this.toolbar = new Toolbar(toolbarContainer, this.editor);
  }
};
window.ImageEditorApp = EditorApp;
export {
  EditorApp
};
