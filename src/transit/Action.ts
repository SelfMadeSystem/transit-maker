import { Vector2 } from '../utils/vec';
import { Label } from './Label';
import { TransitMap } from './TransitMap';
import { TransitStop } from './TransitStop';
import { Movable } from './types';

/**
 * An action that can be applied and undone on a transit map.
 */
export interface Action {
  label: string;
  apply: (map: TransitMap) => void;
  undo: (map: TransitMap) => void;
  redo?: (map: TransitMap) => void;
}

export interface MoveAction extends Action {
  pos: Vector2;
}

export function createStopAction(label: string, pos: Vector2): Action {
  let stop: TransitStop | null = null;

  return {
    label: 'Create Stop',
    apply(map) {
      stop = new TransitStop(map, [new Label(map, label)], pos);
    },
    undo() {
      if (stop) {
        stop.remove();
      }
    },
    redo() {
      if (stop) {
        stop.reAdd();
      }
    },
  };
}

export function moveMovableAction(stop: Movable): MoveAction {
  const ogPos = stop.getPos();
  const action: MoveAction = {
    label: 'Move',
    pos: ogPos,
    apply() {
      stop.setPos(action.pos);
    },
    undo() {
      stop.setPos(ogPos);
    },
  };

  return action;
}
