import { Color } from '../components/color/Color';
import { DrawingContext } from '../utils/drawingContext';
import { Vector2 } from '../utils/vec';
import { Segment } from './Segment';

export class SegmentPosition {
  constructor(
    public type: 'vec' | 'snap',
    public pos?: Vector2,
    public segment?: Segment,
    public position?: number,
    public offset?: number,
  ) {}

  getPoint(): Vector2 {
    if (this.type === 'vec' && this.pos) {
      return this.pos;
    } else if (
      this.type === 'snap' &&
      this.segment &&
      this.position !== undefined &&
      this.offset !== undefined
    ) {
      return this.segment.getPoint(this.position, this.offset);
    }
    throw new Error('Invalid SegmentPosition');
  }

  static vec(pos: Vector2): SegmentPosition {
    return new SegmentPosition('vec', pos);
  }

  static snap(
    segment: Segment,
    position: number,
    offset: number,
  ): SegmentPosition {
    return new SegmentPosition('snap', undefined, segment, position, offset);
  }
}

export class Route {
  public color: Color = Color.WHITE;
  public readonly index: number;
  constructor(public readonly map: TransitMap) {
    this.index = map.routes.length;
    map.routes.push(this);
  }
}

/* export class Stop {
  constructor(public pos: SegmentPosition) {}

  getPoint(): Vector2 {
    return this.pos.getPoint();
  }

  getPath(): Path2Dpp {
    const path = new Path2Dpp();
    path.arc(this.getPoint(), 5, 0, Math.PI * 2);
    return path;
  }

  draw(ctx: DrawingContext): void {
    ctx.setFill(Color.WHITE);
    ctx.fillPath(this.getPath());
  }
} */

export class TransitMap {
  public routes: Route[] = [];
  public segments: Segment[] = [];
  constructor() {}

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
