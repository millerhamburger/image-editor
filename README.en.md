# Image Editor

[中文](./README.md) | English

## Introduction

`bunnn-canvas-image-editor` is a simple HTML5 Canvas-based image editor supporting multiple drawing tools, undo/reset, i18n, and saving as Blob.

![Preview](./example/preview.gif)

## Features

- Basic Shapes: Rectangle, Circle, Arrow
- Pen Tool: Freehand drawing
- Text Tool: Text input, double-click to edit
- Mosaic: Local pixelation
- Save: Export as Blob image
- i18n: Built-in Chinese and English (Chinese default)

## Installation

```bash
npm install bunnn-canvas-image-editor
```

## Usage in React

### Import styles

```javascript
import 'bunnn-canvas-image-editor/dist/style.css';
```

### Create component

```tsx
import React, { useEffect, useRef } from 'react';
import { EditorApp } from 'bunnn-canvas-image-editor';

const ImageEditor = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (containerRef.current && !editorInstanceRef.current) {
      editorInstanceRef.current = new EditorApp(containerRef.current.id, {
        width: 800,
        height: 600,
        backgroundImage: 'https://picsum.photos/800/600',
        locale: 'en',
        onSave: (blob) => {
          const link = document.createElement('a');
          link.download = 'edited-image.png';
          link.href = URL.createObjectURL(blob);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      });
    }
  }, []);

  return (
    <div id="editor-container" ref={containerRef} style={{ border: '1px solid #ddd' }} />
  );
};

export default ImageEditor;
```

## Options (EditorOptions)

- `container`: `HTMLElement` DOM container (internal)
- `width`: `number` canvas width
- `height`: `number` canvas height
- `backgroundImage`: `string` optional background image URL
- `backgroundColor`: `string` optional background color, default white
- `locale`: `'zh' | 'en'` optional language, default Chinese
- `onSave`: `(blob: Blob) => void` optional save callback

