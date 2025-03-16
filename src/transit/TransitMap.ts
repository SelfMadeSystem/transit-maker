import { CanvasDrawingContext, DrawingContext } from '../utils/drawingContext';
import { Vector2 } from '../utils/vec';
import { Route } from './Route';
import { Segment } from './Segment';
import { Actionable } from './types';

export class TransitMap {
  public routes: Route[] = [];
  public segments: Set<Segment> = new Set();
  public selected: Actionable | null = null;
  public defaultRoute: Route;
  public selectedRoute: Route;
  constructor() {
    this.defaultRoute = new Route(this);
    this.selectedRoute = this.defaultRoute;
  }

  getSelectedAt(pos: Vector2, ctx: CanvasDrawingContext): Actionable | null {
    if (this.selected && this.selected.isOver(pos, ctx)) {
      return this.selected;
    }
    for (const segment of this.segmentsByZIndex().flat().reverse()) {
      if (segment.isOver(pos, ctx)) {
        return segment;
      }
    }
    return null;
  }

  segmentsByZIndex(
    callback?: (segment: Segment, zIndex: number) => boolean | void,
    reverse?: boolean,
  ): Segment[][] {
    const segmentsByZIndex = [...this.segments]
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
        [[]] as Segment[][],
      );

    if (callback) {
      if (reverse) {
        for (const layer of segmentsByZIndex.slice().reverse()) {
          for (const segment of layer.slice().reverse()) {
            if (callback(segment, segment.getZIndex())) {
              return segmentsByZIndex;
            }
          }
        }
      } else {
        for (const layer of segmentsByZIndex) {
          for (const segment of layer) {
            if (callback(segment, segment.getZIndex())) {
              return segmentsByZIndex;
            }
          }
        }
      }
    }

    return segmentsByZIndex;
  }

  draw(ctx: DrawingContext): void {
    const segments = this.segmentsByZIndex();
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
