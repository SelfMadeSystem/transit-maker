import { Color } from '../components/color/Color';
import { Path2Dpp } from '../utils/Path2Dpp';
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

  getPoint(): Vector2 {
    return this.pos.type === 'vec'
      ? this.pos.pos
      : this.pos.segment.getPoint(this.pos.position, this.pos.offset);
  }

  getPath(): Path2Dpp {
    const path = new Path2Dpp();
    path.arc(this.getPoint(), 5, 0, Math.PI * 2);
    return path;
  }

  draw(ctx: DrawingContext): void {
    ctx.setFill(Color.BLACK);
    ctx.fillPath(this.getPath());
  }
}

export class TransitMap {
  constructor(
    public routes: Route[],
    public stops: Stop[],
  ) {}

  draw(ctx: DrawingContext): void {
    for (const route of this.routes) {
      route.draw(ctx);
    }
    for (const stop of this.stops) {
      stop.draw(ctx);
    }
  }
}
