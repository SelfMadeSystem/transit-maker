import { Color } from '../components/color/Color';
import { Path2Dpp } from '../utils/Path2Dpp';
import { CanvasDrawingContext, DrawingContext } from '../utils/drawingContext';
import { Vector2 } from '../utils/vec';
import { Route } from './Route';
import { Segment } from './Segment';
import { SegmentPosition } from './SegmentPosition';
import { TransitMap } from './TransitMap';
import { Actionable, ClickInfo, DragInfo } from './types';

export class Stop implements Actionable {
  constructor(
    public map: TransitMap,
    public pos: SegmentPosition,
  ) {
    this.pos.deps.add(this);
    this.map.stops.add(this);
  }
  remove(): void {
    this.pos.removeDep(this);
    this.map.stops.delete(this);
  }
  isOver(pos: Vector2, _: CanvasDrawingContext): boolean {
    const distance = this.getPoint().sub(pos).length();
    return distance < 5;
  }

  changeWhichEnd(oldPos: SegmentPosition, newPos: SegmentPosition): void {
    if (this.pos === oldPos) {
      this.pos = newPos;
    }
  }

  getPoint(): Vector2 {
    return this.pos.getPoint();
  }

  getPath(): Path2Dpp {
    const path = new Path2Dpp();
    path.arc(this.getPoint(), 5, 0, Math.PI * 2);
    return path;
  }

  getZIndex(): number {
    return 69420;
  }

  getRoute(): Route {
    const candidates: Set<Route> = new Set();
    if (this.pos.segment && this.pos.offset === 0) {
      candidates.add(this.pos.segment.route);
    }
    if (this.pos.deps.size > 1) {
      [...this.pos.deps].forEach(
        dep => dep instanceof Segment && candidates.add(dep.route),
      );
    }
    if (candidates.size === 1) {
      return candidates.values().next().value!;
    }
    return this.map.defaultRoute;
  }

  *draw(ctx: DrawingContext): Generator<void> {
    ctx.setFill(this.getRoute().color);
    ctx.fillPath(this.getPath());
    yield;
  }
  drawSelected(ctx: CanvasDrawingContext): void {
    ctx.setStroke(Color.WHITE);
    const path = this.getPath();
    const length = path.getTotalLength();
    ctx.setStrokeDash([length * 0.125, length * 0.075]);
    ctx.setStrokeDashOffset(performance.now() / 100);
    ctx.strokePath(this.getPath());
  }
  onClick(_: ClickInfo): void {}
  onDrag(a: DragInfo): void {
    const { shiftKey, end } = a;
    this.pos.moveTo(end, true);
    if (shiftKey) {
      this.map.actionablesByZIndex(
        segment =>
          segment instanceof Segment && this.pos.trySnap(this, segment, end, 0),
        true,
      );
    }
  }
  onDragEnd(_: DragInfo): void {}
}
