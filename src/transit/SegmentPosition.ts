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

  unsnap() {
    if (this.type === 'snap') {
      this.pos = this.getPoint();
      this.type = 'vec';
      this.segment = undefined;
      this.position = undefined;
      this.offset = undefined;
    }
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
        console.log(dist);
        if (dist > 5) {
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
