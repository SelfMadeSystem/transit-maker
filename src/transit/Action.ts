import { Vector2 } from '../utils/vec';
import { Label } from './Label';
import { TransitMap } from './TransitMap';
import { TransitStop } from './TransitStop';
import { ActionableItem, Movable } from './types';

/**
 * An action that can be applied and undone on a transit map.
 */
export interface Action {
  label: string;
  undo: (map: TransitMap) => void;
  redo: (map: TransitMap) => void;
}

export interface MoveAction extends Action {
  pos: Vector2;
}

function createActionFunction<
  T extends Action,
  Params extends [TransitMap, ...unknown[]],
>(a: (...params: Params) => T): (...params: Params) => T {
  return (...params: Params) => {
    const map = params[0];
    const action = a(...params);
    map.history.add(action);
    return action;
  };
}

export const createStopAction = createActionFunction(
  (map: TransitMap, label: string, pos: Vector2) => {
    const stop = new TransitStop(map, [new Label(map, label)], pos);

    return {
      label: 'Create Stop',
      undo() {
        stop.remove();
      },
      redo() {
        stop.reAdd();
      },
    };
  },
);

export const createLabelAction = createActionFunction(
  (map: TransitMap, label: string, pos: Vector2) => {
    const labelObj = new Label(map, label, pos);

    return {
      label: 'Create Label',
      undo() {
        labelObj.remove();
      },
      redo() {
        labelObj.reAdd();
      },
    };
  },
);

export const moveMovableAction = (stop: Movable) => {
  const ogPos = stop.getPos();
  const action: MoveAction = {
    label: 'Move',
    pos: ogPos,
    undo() {
      stop.setPos(ogPos);
    },
    redo() {
      stop.setPos(action.pos);
    },
  };

  return action;
};

export const connectStopsAction = createActionFunction(
  (map: TransitMap, stop1: TransitStop, stop2: TransitStop) => {
    const connection = map.createConnection(stop1, stop2, stop1.getRoute());
    return {
      label: 'Connect Stops',
      undo() {
        connection.remove();
      },
      redo() {
        connection.reAdd();
      },
    };
  },
);

export const removeAction = createActionFunction((_, obj: ActionableItem) => {
  obj.remove();
  return {
    label: 'Remove',
    undo() {
      obj.reAdd();
    },
    redo() {
      obj.remove();
    },
  };
});
