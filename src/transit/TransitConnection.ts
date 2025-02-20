import { id } from '../utils/id';
import { angleDelta, wrapAngle2PI } from '../utils/mathUtils';
import { Vector2 } from '../utils/vec';
import { splitConnectionAction } from './Action';
import { SnapLine } from './Snapping';
import { TransitMap } from './TransitMap';
import { TransitRoute } from './TransitRoute';
import { TransitStop } from './TransitStop';
import { Actionable } from './types';
import { path as d3path } from 'd3-path';

export type ConnectionStrokeType = 'solid' | 'dotted' | 'dashed';

// Styles only for this individual connection. Other styles should be specific
// to the route.
export type ConnectionStyle = {
  strokeType: ConnectionStrokeType;
};

export function styleEquals(a: ConnectionStyle, b: ConnectionStyle): boolean {
  return a.strokeType === b.strokeType;
}

export const DEFALUT_CONNECTION_STYLE: ConnectionStyle = {
  strokeType: 'solid',
};

export class TransitConnection implements Actionable {
  public id: number = id();
  // TODO: Add support for:
  // - split routes (e.g. REM connection between Bois-Franc, Marie-Curie,
  //   Des Sources, and Sunnybrooke; yes, that's a single connection)
  // - multiple connections between the same two stops (e.g. line 11, 12, and 14
  //   between Montréal-Ouest and Lucien-L'Allier)
  // - go behind other lines when there's no stop in between (e.g. line 15 with
  //   lines 11, 12, 14, the text of "De la Savane", and line 2)
  public map: TransitMap;
  public from: TransitStop;
  public to: TransitStop;
  public route: TransitRoute;
  public lateralOffset: number = 0;
  public fromLateralOffset: number = 0;
  public toLateralOffset: number = 0;
  public style: ConnectionStyle = {
    ...DEFALUT_CONNECTION_STYLE,
  };

  constructor(
    map: TransitMap,
    from: TransitStop,
    to: TransitStop,
    route: TransitRoute,
  ) {
    this.map = map;
    this.from = from;
    this.to = to;
    this.route = route;
    this.reAdd();
  }

  reAdd(): void {
    this.map.connections.add(this);
    this.from.addConnection(this);
    this.to.addConnection(this);
  }

  remove(): void {
    this.map.connections.delete(this);
    this.from.removeConnection(this);
    this.to.removeConnection(this);
  }

  setWhichLateralOffset(which: TransitStop, offset: number) {
    if (which === this.from) {
      this.fromLateralOffset = offset;
    } else if (which === this.to) {
      this.toLateralOffset = offset;
    } else {
      throw new Error('The stop must be either the from or the to stop');
    }
  }

  getOtherStop(stop: TransitStop) {
    return stop === this.from ? this.to : this.from;
  }

  hasStop(stop: TransitStop) {
    return stop === this.from || stop === this.to;
  }

  setFrom(stop: TransitStop) {
    if (this.from === stop) {
      return;
    }
    if (this.to !== stop) {
      throw new Error('The stop must be either the from or the to stop');
    }

    [this.from, this.to] = [this.to, this.from];
    this.lateralOffset = -this.lateralOffset;
    this.fromLateralOffset = -this.fromLateralOffset;
    this.toLateralOffset = -this.toLateralOffset;
  }

  preDraw(ctx: CanvasRenderingContext2D): void {
    if (this.route.style.margin <= 0) {
      return;
    }
    const lineWidth = this.route.style.lineWidth;
    ctx.save();
    ctx.lineCap = 'round';

    const [path] = this.getPath();

    ctx.lineWidth = lineWidth + this.route.style.margin * 2;
    ctx.strokeStyle = '#000';
    ctx.stroke(path);
    ctx.restore();
  }

  draw(ctx: CanvasRenderingContext2D) {
    let lineWidth = this.route.style.lineWidth;
    ctx.save();
    ctx.lineCap = 'round';
    switch (this.style.strokeType) {
      case 'solid':
        ctx.setLineDash([]);
        break;
      case 'dotted':
        lineWidth = this.route.style.dottedWidth;
        ctx.setLineDash([0, lineWidth * 2]);
        break;
      case 'dashed':
        lineWidth = this.route.style.dashedWidth;
        ctx.setLineDash([lineWidth * 4, lineWidth * 3]);
        break;
    }

    const [path, length] = this.getPath();
    ctx.lineDashOffset = lineWidth * 2 - length / 2;

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = this.route.style.color.hex();
    ctx.stroke(path);
    ctx.restore();
  }

  postDraw(ctx: CanvasRenderingContext2D): void {
    if (
      this.route.style.strokeType === 'split' &&
      this.style.strokeType === 'solid'
    ) {
      const [path] = this.getPath();
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = this.route.style.innerWidth;
      ctx.stroke(path);
      ctx.restore();
    }
  }

  drawSelected(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const lineWidth = this.route.style.dottedWidth;
    ctx.setLineDash([lineWidth, lineWidth]);
    ctx.lineDashOffset = (Date.now() / 200) % (lineWidth * 2);
    ctx.strokeStyle = 'white';
    ctx.lineWidth =
      this.route.style.lineWidth + this.route.style.margin * 2 + 2;
    const [path] = this.getPath();
    ctx.stroke(path);
    ctx.restore();
  }

  getLateralOffset() {
    return Math.max(this.to.getLateralOffset(), this.from.getLateralOffset());
  }

  getFromToPosInfo() {
    let from = this.from.pos;
    let to = this.to.pos;
    const fromLateralOffset =
      (this.fromLateralOffset + this.lateralOffset) *
      this.from.getLateralOffset();
    const toLateralOffset =
      (this.toLateralOffset + this.lateralOffset) * this.to.getLateralOffset();

    if (fromLateralOffset !== 0 || toLateralOffset !== 0) {
      const direction = from.directionTo(to).cw90();
      from = from.add(direction.mult(fromLateralOffset));
      to = to.add(direction.mult(toLateralOffset));
    }

    const fromRounding = this.from.calculateRoundingStuff();
    const toRounding = this.to.calculateRoundingStuff();

    if (fromRounding) {
      const direction = from.directionTo(to);
      from = from.add(direction.mult(fromRounding.edgeDist));
    }

    if (toRounding) {
      const direction = to.directionTo(from);
      to = to.add(direction.mult(toRounding.edgeDist));
    }

    return [
      from,
      to,
      fromLateralOffset,
      toLateralOffset,
      fromRounding,
      toRounding,
    ] as const;
  }

  getPath(): [Path2D, number, boolean] {
    const [
      from,
      to,
      fromLateralOffset,
      toLateralOffset,
      fromRounding,
      toRounding,
    ] = this.getFromToPosInfo();
    const path = d3path();

    if (fromRounding) {
      const { center, ogPos, radius, edgeDist } = fromRounding;
      const startAngle = wrapAngle2PI(center.angleTo(from));
      const endAngle = wrapAngle2PI(center.angleTo(ogPos));
      const clockwise =
        wrapAngle2PI(angleDelta(startAngle, endAngle)) < Math.PI;

      const sign = clockwise ? 1 : -1;

      // if (fromLateralOffset * sign < edgeDist) {
      path.arc(
        center.x,
        center.y,
        radius - fromLateralOffset * sign,
        endAngle,
        startAngle,
        clockwise,
      );
      // } else {
      // path.moveTo(from.x, from.y);
      // }
    } else {
      path.moveTo(from.x, from.y);
    }

    if (toRounding) {
      const { center, ogPos, radius, edgeDist } = toRounding;
      const startAngle = center.angleTo(to);
      const endAngle = center.angleTo(ogPos);
      const clockwise =
        wrapAngle2PI(angleDelta(startAngle, endAngle)) < Math.PI;

      const sign = clockwise ? 1 : -1;

      // if (-toLateralOffset * sign < edgeDist) {
      path.arc(
        center.x,
        center.y,
        radius + toLateralOffset * sign,
        startAngle,
        endAngle,
        !clockwise,
      );
      // } else {
      // path.lineTo(to.x, to.y);
      // }
    } else {
      path.lineTo(to.x, to.y);
    }

    const str = path.toString();
    const svgPath = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path',
    );
    svgPath.setAttribute('d', str);
    const length = svgPath.getTotalLength();
    const path2d = new Path2D(str);

    return [path2d, length, !!(fromRounding || toRounding)];
  }

  isOver(x: number, y: number, ctx: CanvasRenderingContext2D) {
    const width = this.route.style.lineWidth + this.route.style.margin * 2 + 2;
    const [path] = this.getPath();
    ctx.lineWidth = width;
    return ctx.isPointInStroke(path, x, y);
  }

  getAngle(which: TransitStop): number {
    if (which !== this.from && which !== this.to) {
      throw new Error('The stop must be either the from or the to stop');
    }
    const from = which;
    const to = this.getOtherStop(from);
    return Math.atan2(to.pos.y - from.pos.y, to.pos.x - from.pos.x);
  }

  isParallelTo(other: TransitConnection): boolean {
    const angle1 = this.getAngle(this.from);
    const angle2 = other.getAngle(other.from);
    const diff = Math.abs(angle1 - angle2);
    return (
      diff < 0.1 ||
      (diff > Math.PI - 0.1 && diff < Math.PI + 0.1) ||
      diff > Math.PI * 2 - 0.1
    );
  }

  getDirectionVector(which: TransitStop): Vector2 {
    if (which !== this.from && which !== this.to) {
      throw new Error('The stop must be either the from or the to stop');
    }
    const from = which;
    const to = this.getOtherStop(from);
    return from.pos.directionTo(to.pos);
  }

  getDirectSnapLines(which: TransitStop): SnapLine[] {
    const other = this.getOtherStop(which);
    const diff = which.pos.sub(other.pos).normalize();
    const dist = other.pos.dist(which.pos);

    return [
      new SnapLine(which.pos, diff, 0, dist),
      new SnapLine(which.pos, diff.rotateBy(Math.PI / 2), 1, dist),
      new SnapLine(which.pos, diff.rotateBy(-Math.PI / 2), 1, dist),
    ];
  }

  getCardinalSnapLines(which: TransitStop, length: number | null): SnapLine[] {
    if (length === null) {
      return [
        new SnapLine(which.pos, new Vector2(1, 0), 2),
        new SnapLine(which.pos, new Vector2(0, 1), 2),
        new SnapLine(which.pos, new Vector2(1, 1).normalize(), 3),
        new SnapLine(which.pos, new Vector2(1, -1).normalize(), 3),
      ];
    } else {
      return [
        new SnapLine(which.pos, new Vector2(1, 0), 2, length),
        new SnapLine(which.pos, new Vector2(-1, 0), 2, length),
        new SnapLine(which.pos, new Vector2(0, 1), 2, length),
        new SnapLine(which.pos, new Vector2(0, -1), 2, length),
        new SnapLine(which.pos, new Vector2(1, 1).normalize(), 3, length),
        new SnapLine(which.pos, new Vector2(1, -1).normalize(), 3, length),
        new SnapLine(which.pos, new Vector2(-1, 1).normalize(), 3, length),
        new SnapLine(which.pos, new Vector2(-1, -1).normalize(), 3, length),
      ];
    }
  }

  getSnapLines(which: TransitStop): SnapLine[] {
    const snapLines: SnapLine[] = [];

    const others = which.getConnectingStops();
    const other = this.getOtherStop(which);

    for (const connection of other.connections) {
      if (connection === this) {
        continue;
      }
      const other2 = connection.getOtherStop(other);
      if (others.includes(other2)) {
        continue;
      }
      snapLines.push(...connection.getDirectSnapLines(other));
    }

    const length = snapLines.length === 3 ? snapLines[0].length : null;
    const cardinalSnapLines = this.getCardinalSnapLines(other, length);

    return [...snapLines, ...cardinalSnapLines];
  }

  doubleClick(): void {
    splitConnectionAction(this.map, this);
  }

  rightClick(): void {}
}
