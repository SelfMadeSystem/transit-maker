import { CanvasDrawingContext, DrawingContext } from '../utils/drawingContext';
import { Vector2 } from '../utils/vec';
import { Route } from './Route';
import { Segment } from './Segment';
import { Actionable } from './types';

export class TransitMap {
  public routes: Route[] = [];
  public segments: Segment[] = [];
  public selected: Actionable | null = null;
  constructor() {}

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

  segmentsByZIndex(): Segment[][] {
    return this.segments
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
