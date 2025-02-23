import { Vector2 } from '../utils/vec';
import { DecorationImage } from './DecorationImage';
import { Label } from './Label';
import { TransitConnection } from './TransitConnection';
import { TransitMap } from './TransitMap';
import { TransitStop } from './TransitStop';
import { ActionableItem, Movable } from './types';

/**
 * An action that can be applied and undone on a transit map.
 */
export type Action<T = unknown> = {
  label: string;
  undo: (map: TransitMap) => void;
  redo: (map: TransitMap) => void;
  data: T;
};

export interface MoveAction extends Action<Vector2> {
  pos: Vector2;
}

export function createActionFunction<
  T extends Action<unknown> | null,
  Params extends [TransitMap, ...unknown[]],
>(a: (...params: Params) => T): (...params: Params) => T {
  return (...params: Params) => {
    const map = params[0];
    const action = a(...params);
    if (!action) {
      return action;
    }
    map.history.add(action);
    return action;
  };
}

export const createStopAction = createActionFunction(
  (map: TransitMap, label: string, pos: Vector2) => {
    const stop = new TransitStop(
      map,
      label ? [new Label(map, label)] : [],
      pos,
    );

    return {
      label: 'Create Stop',
      undo() {
        stop.remove();
      },
      redo() {
        stop.reAdd();
      },
      data: stop,
    };
  },
);

export const createLabelAction = createActionFunction(
  (map: TransitMap, label: string, pos: Vector2 = new Vector2(0, -15)) => {
    const labelObj = new Label(map, label, pos);

    return {
      label: 'Create Label',
      undo() {
        labelObj.remove();
      },
      redo() {
        labelObj.reAdd();
      },
      data: labelObj,
    };
  },
);

export const createImageAction = createActionFunction(
  (map: TransitMap, image: HTMLImageElement, pos: Vector2) => {
    const decoration = new DecorationImage(map, image, pos);

    return {
      label: 'Create Image',
      undo() {
        decoration.remove();
      },
      redo() {
        decoration.reAdd();
      },
      data: decoration,
    };
  },
);

export const moveMovableAction = (stop: Movable) => {
  const ogPos = stop.getPos();
  const action = {
    label: 'Move',
    pos: ogPos,
    undo() {
      stop.setPos(ogPos);
    },
    redo() {
      stop.setPos(action.pos);
    },
    data: ogPos,
  } satisfies MoveAction;

  return action;
};

export const connectStopsAction = createActionFunction(
  (map: TransitMap, stop1: TransitStop, stop2: TransitStop) => {
    const connection = new TransitConnection(
      map,
      stop1,
      stop2,
      stop1.getRoute(),
    );
    return {
      label: 'Connect Stops',
      undo() {
        connection.remove();
      },
      redo() {
        connection.reAdd();
      },
      data: connection,
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
    data: obj,
  };
});

export const splitConnectionAction = createActionFunction(
  (map: TransitMap, connection: TransitConnection) => {
    connection.remove();
    const from = connection.from;
    const to = connection.to;

    const route = connection.route;
    const stop = new TransitStop(
      map,
      [],
      new Vector2((from.pos.x + to.pos.x) / 2, (from.pos.y + to.pos.y) / 2),
    );

    const connection1 = new TransitConnection(map, from, stop, route);
    const connection2 = new TransitConnection(map, stop, to, route);
    connection1.inheritStyle(connection);
    connection2.inheritStyle(connection);

    return {
      label: 'Split Connection',
      undo() {
        stop.remove();
        connection.reAdd();
      },
      redo() {
        stop.reAdd();
        connection.remove();
      },
      data: { stop, connection1, connection2 },
    };
  },
);
