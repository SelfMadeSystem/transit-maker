import { DrawingContext } from '../utils/drawingContext';
import { Vector2 } from '../utils/vec';
import { RouteSegment } from './Segment';

export type SegmentPosition =
  | {
      type: 'vec';
      pos: Vector2;
    }
  | {
      type: 'snap';
      segment: RouteSegment;
      position: number;
      offset: number;
    };

export class Route {
  constructor(public segments: RouteSegment[]) {}

  draw(ctx: DrawingContext): void {
    const gens = new Set(this.segments.map(seg => seg.draw(ctx)));

    while (gens.size) {
      for (const gen of gens) {
        const { done } = gen.next();
        if (done) gens.delete(gen);
      }
    }
  }
}

export class Stop {
  constructor(public pos: SegmentPosition) {}
}
