import { Action } from './Action';
import { TransitMap } from './TransitMap';

export class History {
  // public kuz I want to list all actions
  public actions: Action[] = [];
  public index: number = -1;

  public add(action: Action) {
    this.actions = this.actions.slice(0, this.index + 1);
    this.actions.push(action);
    this.index++;
  }

  public undo(map: TransitMap) {
    if (this.index < 0) {
      return;
    }
    this.actions[this.index].undo(map);
    this.index--;
  }

  public redo(map: TransitMap) {
    if (this.index >= this.actions.length - 1) {
      return;
    }
    this.index++;
    const action = this.actions[this.index];
    (action.redo ?? action.apply)(map);
  }
}
