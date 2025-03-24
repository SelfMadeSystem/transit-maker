import { Vector2 } from '../utils/vec';
import { Segment } from './Segment';
import { Stop } from './Stop';

export type SegmentPositionDep = Segment | Stop;

export class SegmentPosition {
  public deps: Set<SegmentPositionDep> = new Set();

  constructor(
    public type: 'vec' | 'snap',
    public pos?: Vector2,
    public segment?: Segment,
    public position?: number,
    public offset?: number,
  ) {
    if (segment) {
      segment.segmentPosDeps.add(this);
    }
  }

  removeDep(dep: SegmentPositionDep) {
    this.deps.delete(dep);
    if (this.deps.size === 0) {
      this.unsnap();
    }
  }

  getOtherDep(dep: SegmentPositionDep): SegmentPositionDep | undefined {
    if (this.deps.size === 2) {
      return [...this.deps].find(s => s !== dep);
    }
    return undefined;
  }

  mergeToSegment(newPos: SegmentPosition) {
    if (!this.segment) return;
    [...this.deps].forEach(s => s.changeWhichEnd(this, newPos));
  }

  setVec(pos: Vector2) {
    if (this.type === 'snap') {
      this.unsnap();
    }
    this.pos = pos;
  }

  setSnap(segment: Segment, position: number, offset: number) {
    if (this.type === 'snap') {
      this.unsnap();
    }
    this.segment = segment;
    segment.segmentPosDeps.add(this);
    this.position = position;
    this.offset = offset;
    this.type = 'snap';
  }

  unsnap() {
    if (this.type === 'snap') {
      this.pos = this.getPoint();
      this.type = 'vec';
      if (this.segment) {
        this.segment.segmentPosDeps.delete(this);
      }
      this.segment = undefined;
      this.position = undefined;
      this.offset = undefined;
    }
  }

  trySnap(
    thisDep: SegmentPositionDep,
    segment: Segment,
    pos: Vector2,
    offset = 10,
  ): boolean {
    if (thisDep === segment) {
      return false;
    }
    if (this.trySnapImpl(thisDep, segment, pos, 0)) {
      return true;
    }
    if (offset !== 0 && this.trySnapImpl(thisDep, segment, pos, offset)) {
      return true;
    }
    if (offset !== 0 && this.trySnapImpl(thisDep, segment, pos, -offset)) {
      return true;
    }
    return false;
  }

  trySnapImpl(
    thisDep: SegmentPositionDep,
    segment: Segment,
    pos: Vector2,
    offset = 10,
  ): boolean {
    if (segment.end === this || segment.start === this) {
      return false;
    }
    if (this.type === 'vec') {
      const path = segment.getPath(offset);
      const length = path.getLengthAtPoint(pos);
      const newPoint = path.getPointAtLength(length);
      const dist = newPoint.dist(pos);
      if (dist < 5) {
        if (
          thisDep instanceof Segment &&
          (segment.createsLoop(thisDep) ||
            (offset !== 0 && thisDep.sharesEnd(segment)))
        ) {
          // If the segment creates a loop, we don't want to snap but we can
          // move the point to where it would be
          this.pos = newPoint;
          return false;
        }
        this.setSnap(segment, length / path.getTotalLength(), offset);
        return true;
      }
      return false;
    }
    return true;
  }

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

  moveTo(to: Vector2, unsnap?: boolean) {
    if (this.type === 'vec' && this.pos) {
      this.pos = to;
    } else if (
      this.type === 'snap' &&
      this.segment &&
      this.position !== undefined &&
      this.offset !== undefined
    ) {
      const path = this.segment.getPath(this.offset);
      const length = path.getLengthAtPoint(to);
      this.position = length / path.getTotalLength();
      if (unsnap) {
        const point = this.getPoint();
        const dist = point.dist(to);
        if (dist > 25) {
          this.unsnap();
          this.pos = to;
        }
      }
    }
  }

  moveBy(delta: Vector2, other?: SegmentPosition) {
    if (other) {
      if (
        (this.type === 'vec' && other.type === 'vec') ||
        (this.type === 'snap' && other.type === 'snap')
      ) {
        this.moveTo(this.getPoint().add(delta));
        other.moveTo(other.getPoint().add(delta));
      } else if (this.type === 'vec' && other.type === 'snap') {
        const prev = other.getPoint();
        other.moveBy(delta);
        this.moveTo(this.getPoint().add(other.getPoint().sub(prev)));
      } else {
        other.moveBy(delta, this);
      }
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
    return new SegmentPosition(
      this.type,
      this.pos,
      this.segment,
      this.position,
      this.offset,
    );
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
