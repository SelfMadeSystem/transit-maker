import { Vector2 } from '../utils/vec';

export const SNAP_DISTANCE = 10;
export const SNAP_POINT_DISTANCE = 5;

// TODO: Allow the use to enable/disable snapping for each type of snap line.

export class SnapInfo {
  public original: Vector2;
  public doSnapDistance: boolean;
  public snapped: Vector2 | null;
  public snapLines: SnapLine[];
  public snapPoints: Vector2[];

  constructor(original: Vector2, doSnapDistance: boolean) {
    this.original = original;
    this.doSnapDistance = doSnapDistance;
    this.snapped = null;
    this.snapLines = [];
    this.snapPoints = [];
  }

  getPos(): Vector2 {
    return this.snapped ?? this.original;
  }

  addSnapLines(snapLines: SnapLine[]): SnapInfo {
    for (const snapLine of snapLines) {
      if (snapLine.canSnapTo(this.original)) {
        this.snapLines.push(snapLine);
      }
    }
    this.snapLines.sort((a, b) => a.priority - b.priority);
    return this;
  }

  calculateStuff(): void {
    this.calculateSnapPoints();
    this.filterSnapLines();
    this.snap();
  }

  calculateSnapPoints(): void {
    this.snapPoints = [];
    for (let i = 0; i < this.snapLines.length; i++) {
      for (let j = i + 1; j < this.snapLines.length; j++) {
        const intersection = this.snapLines[i].intersect(this.snapLines[j]);
        if (
          intersection &&
          !this.snapLines.some(p => p.origin.dist(intersection) < 1) &&
          !this.snapPoints.some(p => p.dist(intersection) < 1)
        ) {
          this.snapPoints.push(intersection);
        }
      }
    }
  }

  filterSnapLines(): void {
    // Pairs down the number of snap lines to two at most. If there are two snap
    // lines, they must not be parallel.
    if (this.snapLines.length <= 2) {
      const a = this.snapLines[0];
      const b = this.snapLines[1];
      if (a && b && a.direction.isParallel(b.direction)) {
        this.snapLines = [a.meOrPriority(b)];
      }
      return;
    }

    const bestSnapLines = [this.snapLines[0]];
    const bestPriority = this.snapLines[0].priority;
    for (let i = 1; i < this.snapLines.length; i++) {
      const snapLine = this.snapLines[i];
      if (snapLine.priority === bestPriority || bestSnapLines.length < 2) {
        bestSnapLines.push(snapLine);
      } else {
        break;
      }
    }
    this.snapLines = bestSnapLines;
  }

  snap(): void {
    for (const snapPoint of this.snapPoints) {
      const distance = snapPoint.dist(this.original);
      if (distance < SNAP_POINT_DISTANCE) {
        this.snapped = snapPoint;
        return;
      }
    }
    for (const snapLine of this.snapLines) {
      const snapped = this.doSnapDistance
        ? snapLine.snapWithLength(this.original)
        : snapLine.snapTo(this.original);
      if (snapped) {
        this.snapped = snapped;
        return;
      }
    }
  }

  debugDraw(ctx: CanvasRenderingContext2D): void {
    // draws all snap points
    ctx.save();
    ctx.fillStyle = '#9ff9';
    for (const snapPoint of this.snapPoints) {
      ctx.beginPath();
      ctx.arc(...snapPoint.a, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();
    // draws a circle at the original position and a line to the snapped position
    ctx.save();
    ctx.strokeStyle = '#ff99';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(...this.original.a, 5, 0, 2 * Math.PI);
    ctx.moveTo(...this.original.a);
    ctx.lineTo(...this.getPos().a);
    ctx.stroke();
    ctx.restore();
  }
}

const LENGTH_MULTIPLIERS = [
  1 / 4,
  1 / 3,
  1 / 2,
  1,
  3 / 2,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
];

export class SnapLine {
  public origin: Vector2;
  public direction: Vector2;
  public priority: number;
  public length: number | null;

  constructor(
    origin: Vector2,
    direction: Vector2,
    priority: number,
    length: number | null = null,
  ) {
    this.origin = origin;
    this.direction = direction;
    this.priority = priority;
    this.length = length;
  }

  meOrPriority(other: SnapLine): SnapLine {
    return this.priority <= other.priority ? this : other;
  }

  canSnapTo(point: Vector2): boolean {
    const delta = point.sub(this.origin);
    const projection = delta.dot(this.direction);
    const perpendicular = delta.sub(this.direction.mult(projection));
    return (
      perpendicular.length() < SNAP_DISTANCE &&
      (projection >= 0 || this.length === null)
    );
  }

  snapTo(point: Vector2): Vector2 | null {
    const delta = point.sub(this.origin);
    const projection = delta.dot(this.direction);
    if (this.length !== null && projection < 0) {
      return null;
    }
    return this.origin.add(this.direction.mult(projection));
  }

  snapWithLength(point: Vector2): Vector2 | null {
    const snap = this.snapTo(point);
    if (!snap || this.length === null) {
      return snap;
    }
    const delta = snap.sub(this.origin);
    const length = delta.length();

    // Find the closest length multiplier `n` such that `this.length * n` is as
    // close to `length` as possible.

    let bestDiff = Infinity;
    let bestDelta = delta;
    for (const multiplier of LENGTH_MULTIPLIERS) {
      const candidateLength = this.length * multiplier;
      const candidateDelta = this.direction.mult(candidateLength);
      const candidateDiff = Math.abs(candidateLength - length);
      if (candidateDiff < bestDiff) {
        bestDiff = candidateDiff;
        bestDelta = candidateDelta;
      }
    }

    return this.origin.add(bestDelta);
  }

  intersect(other: SnapLine): Vector2 | null {
    const delta = other.origin.sub(this.origin);
    const cross = other.direction.cross(this.direction);
    if (cross === 0) {
      return null;
    }
    const t = delta.cross(other.direction) / cross;
    return this.origin.sub(this.direction.mult(t));
  }

  debugDraw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = '#fff9';
    ctx.lineWidth = 1;
    if (this.length !== null) {
      ctx.setLineDash([5, 5]);
    }
    ctx.beginPath();
    ctx.moveTo(
      this.origin.x - this.direction.x * (this.length ?? 100),
      this.origin.y - this.direction.y * (this.length ?? 100),
    );
    ctx.lineTo(...this.origin.a);
    ctx.arc(...this.origin.a, 5, 0, 2 * Math.PI);
    ctx.moveTo(...this.origin.a);
    ctx.lineTo(
      this.origin.x + this.direction.x * 100,
      this.origin.y + this.direction.y * 100,
    );
    ctx.stroke();
    ctx.restore();
  }
}
