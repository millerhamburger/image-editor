# Image Editor / 图片编辑器

[English](#english) | [中文](#中文)

<a name="中文"></a>

## 简介

`bunnn-canvas-image-editor` 是一个基于 HTML5 Canvas 的简易图片编辑器，支持多种绘图工具、撤销/重置、多语言支持以及图片保存功能。

## 功能特性

*   **基础绘图**：矩形、圆形、箭头。
*   **画笔工具**：自由绘制线条。
*   **文字工具**：支持文本输入、双击编辑。
*   **马赛克/打码**：局部打码。
*   **图片保存**：支持导出为 Blob 图片格式。
*   **国际化**：内置中英文支持。

## 安装

```bash
npm install bunnn-canvas-image-editor
```

## 在 React 项目中使用

虽然这是一个原生 JS 库，但可以非常容易地集成到 React 项目中。

### 1. 引入样式

在项目的入口文件（如 `main.tsx` 或 `App.tsx`）或组件中引入 CSS：

```javascript
import 'bunnn-canvas-image-editor/dist/style.css';
```

### 2. 创建组件

```tsx
import React, { useEffect, useRef } from 'react';
import { EditorApp } from 'bunnn-canvas-image-editor';

const ImageEditor = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null);

  useEffect(() => {
    // 确保容器存在且未初始化过
    if (containerRef.current && !editorInstanceRef.current) {
      // 这里的 id 必须与 div 的 id 一致
      editorInstanceRef.current = new EditorApp(containerRef.current.id, {
        width: 800,
        height: 600,
        backgroundImage: 'https://picsum.photos/800/600', // 可选背景图
        locale: 'zh', // 设置语言: 'zh' 或 'en'
        onSave: (blob) => {
          // 处理保存逻辑，例如下载
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
    <div 
      id="editor-container" 
      ref={containerRef} 
      style={{ border: '1px solid #ddd' }}
    />
  );
};

export default ImageEditor;
```

### 配置选项 (EditorOptions)

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `container` | `HTMLElement` | (内部使用) 编辑器挂载的 DOM 容器 |
| `width` | `number` | 画布宽度 |
| `height` | `number` | 画布高度 |
| `backgroundImage` | `string` | (可选) 背景图片 URL |
| `backgroundColor` | `string` | (可选) 背景颜色，默认为白色 |
| `locale` | `'zh' \| 'en'` | (可选) 语言，默认为 'zh' |
| `onSave` | `(blob: Blob) => void` | (可选) 点击保存按钮时的回调函数 |

---

<a name="English"></a>

## Introduction

`bunnn-canvas-image-editor` is a simple HTML5 Canvas based image editor, supporting various drawing tools, undo/reset, multi-language support, and image saving.

## Features

*   **Basic Shapes**: Rectangle, Circle, Arrow.
*   **Pen Tool**: Freehand drawing.
*   **Text Tool**: Text input, double-click to edit.
*   **Mosaic**: Local pixelation.
*   **Save**: Export as Blob image.
*   **i18n**: Built-in Chinese and English support.

## Installation

```bash
npm install bunnn-canvas-image-editor
```

## Usage in React

Although this is a vanilla JS library, it can be easily integrated into React projects.

### 1. Import Styles

Import the CSS in your entry file (e.g., `main.tsx` or `App.tsx`) or component:

```javascript
import 'bunnn-canvas-image-editor/dist/style.css';
```

### 2. Create Component

```tsx
import React, { useEffect, useRef } from 'react';
import { EditorApp } from 'bunnn-canvas-image-editor';

const ImageEditor = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Ensure container exists and is not initialized
    if (containerRef.current && !editorInstanceRef.current) {
      // The id must match the div's id
      editorInstanceRef.current = new EditorApp(containerRef.current.id, {
        width: 800,
        height: 600,
        backgroundImage: 'https://picsum.photos/800/600', // Optional
        locale: 'en', // 'zh' or 'en'
        onSave: (blob) => {
          // Handle save logic, e.g., download
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
    <div 
      id="editor-container" 
      ref={containerRef} 
      style={{ border: '1px solid #ddd' }}
    />
  );
};

export default ImageEditor;
```

### Options (EditorOptions)

| Option | Type | Description |
| --- | --- | --- |
| `container` | `HTMLElement` | (Internal) DOM container for the editor |
| `width` | `number` | Canvas width |
| `height` | `number` | Canvas height |
| `backgroundImage` | `string` | (Optional) Background image URL |
| `backgroundColor` | `string` | (Optional) Background color, default is white |
| `locale` | `'zh' \| 'en'` | (Optional) Language, default is 'zh' |
| `onSave` | `(blob: Blob) => void` | (Optional) Callback when save button is clicked |
