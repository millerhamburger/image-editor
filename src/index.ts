import { ImageEditor } from './core/Editor';
import { Toolbar } from './ui/Toolbar';

export class EditorApp {
  editor: ImageEditor;
  toolbar: Toolbar;

  constructor(containerId: string, options: { width: number; height: number; backgroundImage?: string }) {
    const root = document.getElementById(containerId);
    if (!root) throw new Error('Container not found');

    // Layout
    const toolbarContainer = document.createElement('div');
    const editorContainer = document.createElement('div');
    root.appendChild(toolbarContainer);
    root.appendChild(editorContainer);

    this.editor = new ImageEditor({
      container: editorContainer,
      width: options.width,
      height: options.height,
      backgroundImage: options.backgroundImage
    });

    this.toolbar = new Toolbar(toolbarContainer, this.editor);
  }
}

// For browser global usage
(window as any).ImageEditorApp = EditorApp;
