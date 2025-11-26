import { ImageEditor, ToolType } from '../core/Editor';
import { Icons } from './Icons';

export class Toolbar {
  private container: HTMLElement;
  private editor: ImageEditor;
  private tools: { type: ToolType; title: string; icon: string }[] = [
    { type: 'select', title: 'Select', icon: Icons.Select },
    { type: 'rect', title: 'Rectangle', icon: Icons.Rect },
    { type: 'circle', title: 'Circle', icon: Icons.Circle },
    { type: 'arrow', title: 'Arrow', icon: Icons.Arrow },
    { type: 'pen', title: 'Pen', icon: Icons.Pen },
    { type: 'text', title: 'Text', icon: Icons.Text },
    { type: 'mosaic', title: 'Mosaic', icon: Icons.Mosaic },
  ];

  constructor(container: HTMLElement, editor: ImageEditor) {
    this.container = container;
    this.editor = editor;
    this.render();
  }

  private render() {
    this.container.innerHTML = '';
    this.container.className = 'image-editor-toolbar';

    // Actions Group (Undo, Reset)
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'tools-group'; // Reuse class for layout
    
    this.createButton(actionsContainer, Icons.Undo, 'Undo', () => this.editor.undo());
    this.createButton(actionsContainer, Icons.Reset, 'Reset', () => {
        if(confirm('Are you sure you want to reset all changes?')) {
            this.editor.reset();
        }
    });

    this.container.appendChild(actionsContainer);

    // Separator
    const sep1 = document.createElement('div');
    sep1.style.width = '1px';
    sep1.style.height = '24px';
    sep1.style.background = '#ccc';
    sep1.style.margin = '0 5px';
    this.container.appendChild(sep1);

    // Tools Group
    const toolsContainer = document.createElement('div');
    toolsContainer.className = 'tools-group';

    this.tools.forEach(tool => {
      const btn = document.createElement('button');
      btn.innerHTML = tool.icon;
      btn.title = tool.title;
      btn.className = 'tool-btn mode-btn';
      btn.onclick = () => {
        this.editor.setTool(tool.type);
        this.setActive(btn);
      };
      if (tool.type === 'select') btn.classList.add('active');
      toolsContainer.appendChild(btn);
    });

    this.container.appendChild(toolsContainer);

    // Attributes Group
    const attrsContainer = document.createElement('div');
    attrsContainer.className = 'attrs-group';

    // Color picker
    const colorLabel = document.createElement('label');
    colorLabel.innerText = 'Color: ';
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = '#ff0000';
    colorInput.onchange = (e) => {
      this.editor.setColor((e.target as HTMLInputElement).value);
    };
    attrsContainer.appendChild(colorLabel);
    attrsContainer.appendChild(colorInput);

    // Width picker
    const widthLabel = document.createElement('label');
    widthLabel.innerText = 'Width: ';
    const widthInput = document.createElement('input');
    widthInput.type = 'range';
    widthInput.min = '1';
    widthInput.max = '20';
    widthInput.value = '2';
    widthInput.onchange = (e) => {
      this.editor.setLineWidth(parseInt((e.target as HTMLInputElement).value));
    };
    attrsContainer.appendChild(widthLabel);
    attrsContainer.appendChild(widthInput);
    
    // Export button
    this.createButton(attrsContainer, Icons.Export, 'Export', () => {
        const url = this.editor.exportDataURL();
        const win = window.open();
        win?.document.write('<img src="' + url + '"/>');
    });

    this.container.appendChild(attrsContainer);
  }

  private createButton(container: HTMLElement, icon: string, title: string, onClick: () => void) {
      const btn = document.createElement('button');
      btn.innerHTML = icon;
      btn.title = title;
      btn.className = 'tool-btn';
      btn.onclick = onClick;
      container.appendChild(btn);
      return btn;
  }

  private setActive(btn: HTMLElement) {
    const btns = this.container.querySelectorAll('.tools-group .tool-btn'); // Only tool buttons
    // Actually we have two groups with class 'tools-group'.
    // We only want to deactivate buttons in the "Tools Group", not actions.
    // The actions don't have "active" state in the same way (they are momentary).
    // So we should verify which button is clicked.
    // The tool buttons are in the second container.
    // Let's just remove active from all siblings of the clicked button?
    // Or keep it simple: Select all tool-btns that map to tools.
    // Easier: Store tool buttons in an array or give them a specific class 'mode-btn'.
    
    // Let's refine:
    // Only tools need active state.
    // Actions don't.
    // I will modify the loop for tools to add a class 'mode-btn'.
    
    // Re-implementing logic in `render` to add class, then here:
    const modeBtns = this.container.querySelectorAll('.mode-btn');
    modeBtns.forEach(b => b.classList.remove('active'));
    
    if (btn.classList.contains('mode-btn')) {
        btn.classList.add('active');
    }
  }
}
