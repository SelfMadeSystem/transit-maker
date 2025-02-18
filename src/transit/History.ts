import { Action } from './Action';
import { TransitMap } from './TransitMap';

export interface HistoryAction {
  action: Action;
  index: number;
  undid: boolean;
}

export class History {
  // public kuz I want to list all actions
  public actions: Action[] = [];
  public index: number = -1;

  constructor(public changeCb: () => unknown) {}

  public historyActions(): HistoryAction[] {
    return this.actions.map((action, index) => ({
      action,
      index,
      undid: index > this.index,
    }));
  }

  public add(action: Action) {
    this.actions = this.actions.slice(0, this.index + 1);
    this.actions.push(action);
    this.index++;
    this.changeCb();
  }

  public undo(map: TransitMap) {
    if (this.index < 0) {
      return;
    }
    this.actions[this.index].undo(map);
    this.index--;
    this.changeCb();
  }

  public redo(map: TransitMap) {
    if (this.index >= this.actions.length - 1) {
      return;
    }
    this.index++;
    const action = this.actions[this.index];
    (action.redo ?? action.apply)(map);
    this.changeCb();
  }

  public setIndex(index: number, map: TransitMap) {
    if (index < -1 || index >= this.actions.length) {
      return;
    }
    while (this.index < index) {
      this.redo(map);
    }
    while (this.index > index) {
      this.undo(map);
    }
  }
}
