import { Vector2 } from '../utils/vec';
import { Grid } from './Grid';
import { Segment } from './Segment';

export class SegmentPosition {
  public deps: Set<Segment> = new Set();

  constructor(
    public type: 'vec', // no snapping kuz it's getting kinda (very) messy
    public pos: Vector2,
  ) {}

  removeDep(dep: Segment) {
    this.deps.delete(dep);
  }

  getOtherDep(dep: Segment): Segment | undefined {
    if (this.deps.size === 2) {
      return [...this.deps].find(s => s !== dep);
    }
    return undefined;
  }

  mergeAll(newPos: SegmentPosition) {
    [...this.deps].forEach(s => s.changeWhichEnd(this, newPos));
  }

  trySnap(
    lowestDistance: number,
    thisDep: Segment,
    segment: Segment,
    pos: Vector2,
    offset: number,
    merge = false,
  ): number {
    if (thisDep === segment) {
      return Infinity;
    }
    const result1 = this.trySnapImpl(
      lowestDistance,
      thisDep,
      segment,
      pos,
      0,
      merge,
    );
    if (merge || offset === 0) return result1; // never merge with offset
    const result2 = this.trySnapImpl(
      Math.min(lowestDistance, result1),
      thisDep,
      segment,
      pos,
      offset,
      merge,
    );
    const result3 = this.trySnapImpl(
      Math.min(lowestDistance, result1, result2),
      thisDep,
      segment,
      pos,
      -offset,
      merge,
    );

    return Math.min(result1, result2, result3);
  }

  trySnapImpl(
    lowestDistance: number,
    _thisDep: Segment, // idk if this is needed
    segment: Segment,
    pos: Vector2,
    offset: number,
    merge = false,
  ): number {
    if (segment.end === this || segment.start === this) {
      return Infinity;
    }
    const path = segment.getPath(offset);
    const length = path.getLengthAtPoint(pos);
    const newPoint = path.getPointAtLength(length);
    const dist = newPoint.dist(pos);
    if (dist < lowestDistance) {
      this.pos = newPoint;
      if (merge) {
        const tot = path.getTotalLength();
        const t = length / tot;
        const p = segment.getWhichEnd(t);
        if (p) this.mergeAll(p);
      }
      return dist;
    }
    return Infinity;
  }

  snapToGrid(grid: Grid, pos: Vector2, lowestDistance: number): number {
    const snapped = grid.snapToGrid(this.pos);
    const dist = snapped.dist(pos);
    if (dist < lowestDistance) {
      this.pos = snapped;
      return dist;
    }
    return Infinity;
  }

  getPoint(): Vector2 {
    return this.pos;
  }

  /** If there's only two segments on this position, gets the angle between the two */
  getAngle(which?: Segment): number | undefined {
    if (this.deps.size !== 2) {
      return undefined;
    }
    const [s1, s2] = Array.from(this.deps);
    if (!(s1 instanceof Segment) || !(s2 instanceof Segment)) {
      return undefined;
    }
    const p = this.getPoint();
    const p1 = s1.getOtherEnd(this).getPoint();
    const p2 = s2.getOtherEnd(this).getPoint();
    const a = p1.angleBetween(p2, p);

    const sign = s1 === which ? -1 : 1;
    return a * sign;
  }

  moveTo(to: Vector2) {
    this.pos = to;
  }

  moveBy(delta: Vector2, other?: SegmentPosition) {
    if (other) {
      this.moveTo(this.getPoint().add(delta));
      other.moveTo(other.getPoint().add(delta));
      return;
    }
    this.moveTo(this.getPoint().add(delta));
  }

  debugDraw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(this.getPoint().x, this.getPoint().y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(
      this.type === 'vec' ? 'vec' : 'snap',
      this.getPoint().x + 10,
      this.getPoint().y + 10,
    );
    ctx.restore();
  }

  clone(): SegmentPosition {
    return new SegmentPosition(this.type, this.pos);
  }

  static vec(pos: Vector2): SegmentPosition {
    return new SegmentPosition('vec', pos);
  }

  static snap(
    segment: Segment,
    position: number,
    offset: number,
  ): SegmentPosition {
    return new SegmentPosition('vec', segment.getPoint(position, offset));
  }
}
