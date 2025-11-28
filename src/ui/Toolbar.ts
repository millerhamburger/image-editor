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
          circle: '椭圆',
          arrow: '箭头',
          pen: '画笔',
          text: '文字',
          mosaic: '打码',
          undo: '撤销',
          reset: '重置',
          save: '保存',
          color: '颜色',
          width: '线条粗细',
          confirmReset: '确定要清空所有内容吗？'
      },
      en: {
          select: 'Select',
          rect: 'Rectangle',
          circle: 'Ellipse',
          arrow: 'Arrow',
          pen: 'Pen',
          text: 'Text',
          mosaic: 'Mosaic',
          undo: 'Undo',
          reset: 'Reset',
          save: 'Save',
          color: 'Color',
          width: 'Width',
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

    // Center Group - all tools & attributes
    const centerGroup = document.createElement('div');
    centerGroup.className = 'tools-group center-group attrs-group';
    this.createButton(centerGroup, Icons.Undo, this.t.undo, () => this.editor.undo());
    this.createButton(centerGroup, Icons.Reset, this.t.reset, () => {
        this.editor.reset();
    });
    const sepAfterReset = document.createElement('div');
    sepAfterReset.className = 'toolbar-sep';
    centerGroup.appendChild(sepAfterReset);

    // Color picker
    // Mode buttons appended into center
    this.tools.forEach(tool => {
      const label = this.t[tool.type as keyof typeof this.t] || tool.type;
      const btn = this.createButton(centerGroup, tool.icon, label, () => {
        this.editor.setTool(tool.type);
        this.setActive(btn);
      });
      btn.classList.add('mode-btn');
      if (tool.type === 'select') btn.classList.add('active');
    });

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = '#ff0000';
    colorInput.style.position = 'absolute';
    colorInput.style.opacity = '0';
    colorInput.style.width = '1px';
    colorInput.style.height = '1px';
    colorInput.style.border = '0';
    colorInput.style.padding = '0';
    const colorBtnIcon = `<span class="swatch-icon" style="background-color:${colorInput.value}"></span>`;
    const colorBtn = this.createButton(centerGroup, colorBtnIcon, this.t.color.trim(), () => {
      const left = (colorBtn as HTMLElement).offsetLeft;
      const top = (colorBtn as HTMLElement).offsetTop + (colorBtn as HTMLElement).offsetHeight + 6;
      colorInput.style.left = `${left}px`;
      colorInput.style.top = `${top}px`;
      const anyInput = colorInput as any;
      if (typeof anyInput.showPicker === 'function') {
        requestAnimationFrame(() => anyInput.showPicker());
      } else {
        requestAnimationFrame(() => colorInput.click());
      }
    });
    colorInput.onchange = (e) => {
      const val = (e.target as HTMLInputElement).value;
      const sw = colorBtn.querySelector('.swatch-icon') as HTMLElement;
      if (sw) sw.style.backgroundColor = val;
      this.editor.setColor(val);
    };
    centerGroup.appendChild(colorInput);

    // Width picker
    const widths = [2, 6, 12];
    const widthBtnIcon = `<span class="width-preview" data-width="2"></span>`;
    const widthBtn = this.createButton(centerGroup, widthBtnIcon, this.t.width.trim(), () => {
      if (widthPopover.style.display !== 'none') {
        widthPopover.style.display = 'none';
        document.removeEventListener('mousedown', handleOutside);
        return;
      }
      const btnRect = widthBtn.getBoundingClientRect();
      const groupRect = centerGroup.getBoundingClientRect();
      widthPopover.style.left = (btnRect.left - groupRect.left) + 'px';
      widthPopover.style.top = (btnRect.top - groupRect.top + btnRect.height + 6) + 'px';
      widthPopover.style.display = 'flex';
      document.addEventListener('mousedown', handleOutside);
    });
    const widthPopover = document.createElement('div');
    widthPopover.className = 'width-popover';
    const handleOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!widthPopover.contains(t) && !widthBtn.contains(t as Node)) {
        widthPopover.style.display = 'none';
        document.removeEventListener('mousedown', handleOutside);
      }
    };
    widthPopover.addEventListener('mousedown', (e) => e.stopPropagation());
    widthBtn.addEventListener('mousedown', (e) => e.stopPropagation());
    widths.forEach(w => {
      const dot = document.createElement('button');
      dot.className = 'width-dot';
      dot.setAttribute('data-width', String(w));
      dot.onclick = () => {
        this.editor.setLineWidth(w);
        const prev = widthBtn.querySelector('.width-preview') as HTMLElement;
        if (prev) prev.setAttribute('data-width', String(w));
        widthPopover.style.display = 'none';
        document.removeEventListener('mousedown', handleOutside);
      };
      widthPopover.appendChild(dot);
    });
    widthPopover.style.display = 'none';
    centerGroup.appendChild(widthPopover);
    
    this.container.appendChild(centerGroup);

    // Save at far right
    const saveGroup = document.createElement('div');
    saveGroup.className = 'save-group';
    const saveBtn = this.createButton(saveGroup, Icons.Save, this.t.save, () => {
        this.editor.save();
    });
    saveBtn.classList.add('primary');
    this.container.appendChild(saveGroup);
  }

  private createButton(container: HTMLElement, icon: string, title: string, onClick: () => void) {
      const btn = document.createElement('button');
      btn.innerHTML = `<span class="btn-icon">${icon}</span><span class="btn-label">${title}</span>`;
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
