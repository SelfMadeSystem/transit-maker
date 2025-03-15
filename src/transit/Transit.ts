import { Color } from '../components/color/Color';
import { Path2Dpp } from '../utils/Path2Dpp';
import { DrawingContext } from '../utils/drawingContext';
import { Vector2 } from '../utils/vec';

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
    this.segments.forEach(segment => segment.draw(ctx));
  }
}

export class RouteSegment {
  constructor(
    public start: SegmentPosition,
    public end: SegmentPosition,
  ) {}

  /** Gets the start position of the segment */
  getStart(): Vector2 {
    return this.start.type === 'vec'
      ? this.start.pos
      : this.start.segment.getPoint(this.start.position, this.start.offset);
  }

  /** Gets the end position of the segment */
  getEnd(): Vector2 {
    return this.end.type === 'vec'
      ? this.end.pos
      : this.end.segment.getPoint(this.end.position, this.end.offset);
  }

  /** Gets the point at a given position along the segment */
  getPoint(position: number, offset: number): Vector2 {
    const start = this.getStart();
    const end = this.getEnd();
    const pos = start.lerp(end, position);
    const normal = end.sub(start).normalize();
    const offsetVector = normal.rotate(Math.PI / 2).mult(offset);

    return pos.add(offsetVector);
  }

  /**
   * If a given segment is to snap to this segment, return true if an infinite
   * loop would be created. We don't like infinite loops as we'd never be able
   * to find the positions of the segments since they reference each other.
   */
  createsLoop(
    segment: RouteSegment,
    visited = new Set<RouteSegment>([segment]),
  ): boolean {
    if (visited.has(this)) return true;
    visited.add(this);
    return (
      (this.end.type === 'snap' &&
        this.end.segment.createsLoop(segment, visited)) ||
      (this.start.type === 'snap' &&
        this.start.segment.createsLoop(segment, visited))
    );
  }

  /** Draws the segment */
  draw(ctx: DrawingContext): void {
    const path = new Path2Dpp();
    path.moveTo(this.getStart());
    path.lineTo(this.getEnd());
    ctx.setStroke(Color.BLACK);
    ctx.strokePath(path);
  }
}

export class Stop {
  constructor(public pos: SegmentPosition) {}
}
