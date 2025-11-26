/*
 * @Author: YEYI millerye1995@foxmail.com
 * @Date: 2025-11-26 19:40:21
 * @LastEditors: YEYI millerye1995@foxmail.com
 * @LastEditTime: 2025-11-26 19:40:24
 * @FilePath: \image-editor\src\core\HistoryManager.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { BaseShape } from '../shapes/BaseShape';

export class HistoryManager {
  private undoStack: BaseShape[][] = [];
  private redoStack: BaseShape[][] = [];
  private limit: number = 20;

  push(state: BaseShape[]) {
    // Deep clone state
    const clone = state.map(s => s.clone());
    this.undoStack.push(clone);
    if (this.undoStack.length > this.limit) {
      this.undoStack.shift();
    }
    // Clear redo stack on new action
    this.redoStack = [];
  }

  undo(currentState: BaseShape[]): BaseShape[] | null {
    if (this.undoStack.length === 0) return null;
    
    // Save current state to redo stack before undoing
    const currentClone = currentState.map(s => s.clone());
    this.redoStack.push(currentClone);

    const prevState = this.undoStack.pop();
    // We need to clone the popped state so it stays "fresh" if we push it back later?
    // Actually, popped state is ours now.
    return prevState ? prevState.map(s => s.clone()) : null;
  }

  redo(currentState: BaseShape[]): BaseShape[] | null {
    if (this.redoStack.length === 0) return null;

    // Save current to undo stack
    const currentClone = currentState.map(s => s.clone());
    this.undoStack.push(currentClone);

    const nextState = this.redoStack.pop();
    return nextState ? nextState.map(s => s.clone()) : null;
  }
  
  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
