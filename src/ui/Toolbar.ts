import { ImageEditor, ToolType } from '../core/Editor';
import { Icons } from './Icons';

export class Toolbar {
  private container: HTMLElement;
  private editor: ImageEditor;
  private tools: { type: ToolType; icon: string }[] = [
    { type: 'select', icon: Icons.Select },
    { type: 'rect', icon: Icons.Rect },
    { type: 'circle', icon: Icons.Circle },
    { type: 'arrow', icon: Icons.Arrow },
    { type: 'pen', icon: Icons.Pen },
    { type: 'text', icon: Icons.Text },
    { type: 'mosaic', icon: Icons.Mosaic },
  ];

  private labels = {
      zh: {
          select: '选择',
          rect: '矩形',
          circle: '圆形',
          arrow: '箭头',
          pen: '画笔',
          text: '文字',
          mosaic: '打码',
          undo: '撤销',
          reset: '重置',
          save: '保存',
          color: '颜色: ',
          width: '粗细: ',
          confirmReset: '确定要清空所有内容吗？'
      },
      en: {
          select: 'Select',
          rect: 'Rectangle',
          circle: 'Circle',
          arrow: 'Arrow',
          pen: 'Pen',
          text: 'Text',
          mosaic: 'Mosaic',
          undo: 'Undo',
          reset: 'Reset',
          save: 'Save',
          color: 'Color: ',
          width: 'Width: ',
          confirmReset: 'Are you sure you want to reset all changes?'
      }
  };

  constructor(container: HTMLElement, editor: ImageEditor) {
    this.container = container;
    this.editor = editor;
    this.render();
  }

  private get t() {
      return this.labels[this.editor.locale] || this.labels['zh'];
  }

  private render() {
    this.container.innerHTML = '';
    this.container.className = 'image-editor-toolbar';

    // Actions Group (Undo, Reset)
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'tools-group'; // Reuse class for layout
    
    this.createButton(actionsContainer, Icons.Undo, this.t.undo, () => this.editor.undo());
    this.createButton(actionsContainer, Icons.Reset, this.t.reset, () => {
        this.editor.reset();
    });
    this.createButton(actionsContainer, Icons.Save, this.t.save, () => {
        this.editor.save();
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
      btn.title = this.t[tool.type as keyof typeof this.t] || tool.type;
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
    colorLabel.innerText = this.t.color;
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
    widthLabel.innerText = this.t.width;
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
