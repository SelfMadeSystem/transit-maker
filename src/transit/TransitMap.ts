import { showContextMenu } from '../components/context-menu';
import { CanvasDrawingContext, DrawingContext } from '../utils/drawingContext';
import { Vector2 } from '../utils/vec';
import { Route } from './Route';
import { Segment } from './Segment';
import { Stop } from './Stop';
import { Actionable } from './types';

class ContextMenuHelper {
  constructor(public map: TransitMap) {}

  selectRoute(pos: Vector2): Promise<Route | null> {
    return new Promise(resolve => {
      const items = this.map.routes.map(route => ({
        label: route.name,
        onClick: () => {
          resolve(route);
        },
      }));
      showContextMenu({
        pos,
        items,
        onClose: () => {
          resolve(null);
        },
      });
    });
  }
}

export class TransitMap {
  public routes: Route[] = [];
  public segments: Set<Segment> = new Set();
  public stops: Set<Stop> = new Set();
  public selected: Actionable | null = null;
  public defaultRoute: Route;
  public selectedRoute: Route;
  public ctxMenu: ContextMenuHelper = new ContextMenuHelper(this);
  constructor() {
    this.defaultRoute = new Route(this);
    this.defaultRoute.name = 'Default';
    this.selectedRoute = this.defaultRoute;
  }

  getSelectedAt(pos: Vector2, ctx: CanvasDrawingContext): Actionable | null {
    if (this.selected && this.selected.isOver(pos, ctx)) {
      return this.selected;
    }
    for (const segment of this.actionablesByZIndex().flat().reverse()) {
      if (segment.isOver(pos, ctx)) {
        return segment;
      }
    }
    return null;
  }

  actionablesByZIndex(
    callback?: (actionable: Actionable, zIndex: number) => boolean | void,
    reverse?: boolean,
  ): Actionable[][] {
    const aByZIndex = [...this.segments, ...this.stops]
      .sort((a, b) => a.getZIndex() - b.getZIndex())
      .reduce(
        (acc, segment) => {
          const last = acc[acc.length - 1];
          if (
            last.length === 0 ||
            last[0].getZIndex() === segment.getZIndex()
          ) {
            last.push(segment);
          } else {
            acc.push([segment]);
          }
          return acc;
        },
        [[]] as Actionable[][],
      );

    if (callback) {
      if (reverse) {
        for (const layer of aByZIndex.slice().reverse()) {
          for (const segment of layer.slice().reverse()) {
            if (callback(segment, segment.getZIndex())) {
              return aByZIndex;
            }
          }
        }
      } else {
        for (const layer of aByZIndex) {
          for (const segment of layer) {
            if (callback(segment, segment.getZIndex())) {
              return aByZIndex;
            }
          }
        }
      }
    }

    return aByZIndex;
  }

  draw(ctx: DrawingContext): void {
    const segments = this.actionablesByZIndex();
    for (const layer of segments) {
      const gens = layer.map(segment => segment.draw(ctx));
      let done = false;
      while (!done) {
        done = true;
        for (const gen of gens) {
          if (!gen.next().done) {
            done = false;
          }
        }
      }
    }
  }
}
