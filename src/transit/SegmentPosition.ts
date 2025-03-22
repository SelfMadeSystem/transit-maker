import { Vector2 } from '../utils/vec';
import { Segment } from './Segment';

export class SegmentPosition {
  public segments: Set<Segment> = new Set();

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

  mergeToSegment(newPos: SegmentPosition) {
    if (!this.segment) return;
    this.segments.forEach(s => s.changeWhichEnd(this, newPos));
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
    thisSegment: Segment,
    segment: Segment,
    pos: Vector2,
    offset = 10,
  ): boolean {
    if (thisSegment === segment) {
      return false;
    }
    if (this.trySnapImpl(thisSegment, segment, pos, 0)) {
      return true;
    }
    if (offset !== 0 && this.trySnapImpl(thisSegment, segment, pos, offset)) {
      return true;
    }
    if (offset !== 0 && this.trySnapImpl(thisSegment, segment, pos, -offset)) {
      return true;
    }
    return false;
  }

  trySnapImpl(
    thisSegment: Segment,
    segment: Segment,
    pos: Vector2,
    offset = 10,
  ): boolean {
    if (segment.end === this || segment.start === this) {
      return false;
    }
    if (this.type === 'vec') {
      const path = segment.getPath();
      const length = path.getLengthAtPoint(pos);
      let newPoint = path.getPointAtLength(length);
      if (offset !== 0) {
        newPoint = newPoint.add(path.getNormalAtLength(length).mult(offset));
      }
      const dist = newPoint.dist(pos);
      if (dist < 5) {
        if (
          segment.createsLoop(thisSegment) ||
          (offset !== 0 && thisSegment.sharesEnd(segment))
        ) {
          // If the segment creates a loop, we don't want to snap but we can
          // move the point to where it would be
          this.pos = newPoint;
          return false;
        }
        this.segment = segment;
        this.position = length / path.getTotalLength();
        this.offset = offset;
        this.type = 'snap';
        this.pos = undefined;
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
    if (this.segments.size !== 2) {
      return undefined;
    }
    const [s1, s2] = Array.from(this.segments);
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
      const path = this.segment.getPath();
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
