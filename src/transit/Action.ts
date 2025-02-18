import { Vector2 } from '../utils/vec';
import { Label } from './Label';
import { TransitMap } from './TransitMap';
import { TransitStop } from './TransitStop';

/**
 * An action that can be applied and undone on a transit map.
 */
export interface Action {
  label: string;
  apply: (map: TransitMap) => void;
  undo: (map: TransitMap) => void;
  redo?: (map: TransitMap) => void;
}

export function createIsolatedStopAction(label: string, pos: Vector2): Action {
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
