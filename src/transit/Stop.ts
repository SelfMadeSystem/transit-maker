import { Color } from '../components/color/Color';
import { Path2Dpp } from '../utils/Path2Dpp';
import { CanvasDrawingContext, DrawingContext } from '../utils/drawingContext';
import { Vector2 } from '../utils/vec';
import { Route, createRouteSelector } from './Route';
import { Segment } from './Segment';
import { TransitMap } from './TransitMap';
import { Actionable, ClickInfo, DragInfo } from './types';
import { FolderApi } from 'tweakpane';

type SnapResult = [Vector2, Segment, number, number];

export class StopPosition {
  constructor(
    public type: 'vec' | 'segment',
    public pos: Vector2,
    public segment?: Segment,
    public position: number = 0,
  ) {}

  static fromSegment(segment: Segment, position: number): StopPosition {
    return new StopPosition(
      'segment',
      segment.getPoint(position, 0),
      segment,
      position,
    );
  }

  static fromVector(pos: Vector2): StopPosition {
    return new StopPosition('vec', pos);
  }

  moveTo(pos: Vector2): void {
    if (this.type === 'vec') {
      this.pos = pos;
    } else {
      const [closestPos, closestPosition] =
        this.segment!.getClosestPointPosition(pos);
      this.pos = closestPos;
      this.position = closestPosition;

      if (this.pos.dist(pos) > 10) {
        this.type = 'vec';
        this.segment = undefined;
        this.position = 0;
      }
    }
  }

  getPoint(): Vector2 {
    return this.type === 'vec'
      ? this.pos
      : this.segment!.getPoint(this.position, 0);
  }

  trySnap(segment: Segment, pos: Vector2): false | SnapResult {
    if (this.type === 'vec') {
      const [closestPos, closestPosition] =
        segment.getClosestPointPosition(pos);
      const distance = closestPos.dist(pos);
      if (distance < 5) {
        return [closestPos, segment, closestPosition, distance];
      }
    }
    return false;
  }

  doSnap(segment: Segment, closestPos: Vector2, closestPosition: number): void {
    this.type = 'segment';
    this.pos = closestPos;
    this.segment = segment;
    this.position = closestPosition;
  }
}

export class Stop implements Actionable {
  public route: Route | null = null;
  constructor(
    public map: TransitMap,
    public pos: StopPosition,
  ) {
    this.map.stops.add(this);
  }
  remove(): void {
    this.map.stops.delete(this);
  }
  isOver(pos: Vector2, _: CanvasDrawingContext): boolean {
    const distance = this.getPoint().sub(pos).length();
    return distance < 5;
  }

  changeWhichEnd(oldPos: StopPosition, newPos: StopPosition): void {
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
    if (this.route) {
      return this.route;
    }
    const candidates: Set<Route> = new Set();
    if (this.pos.segment) {
      candidates.add(this.pos.segment.route);
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
    this.pos.moveTo(end);
    if (shiftKey && this.pos.type === 'vec') {
      const snapResults: SnapResult[] = [];
      this.map.actionablesByZIndex(segment => {
        if (!(segment instanceof Segment)) return false;
        const result = this.pos.trySnap(segment, end);
        if (result) {
          snapResults.push(result);
        }
        return false;
      }, true);

      if (snapResults.length > 0) {
        let lowestDistance = 1000;
        let bestResult: SnapResult | undefined;
        for (const result of snapResults) {
          const distance = result[3];
          if (distance < lowestDistance) {
            lowestDistance = distance;
            bestResult = result;
          }
        }
        if (bestResult) {
          const [closestPos, segment, closestPosition] = bestResult;
          this.pos.doSnap(segment, closestPos, closestPosition);
        }
      }
    }
  }
  onDragEnd(_: DragInfo): void {}

  tweakpaneFolder(folder: FolderApi): void {
    createRouteSelector(folder, this.map, this.route, value => {
      this.route = value;
    });
  }
}
