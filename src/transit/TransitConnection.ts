import { id } from '../utils/id';
import { angleDelta, wrapAngle2PI } from '../utils/mathUtils';
import { Vector2, lineLineIntersection, sameHalfPlane } from '../utils/vec';
import { splitConnectionAction } from './Action';
import { SnapLine } from './Snapping';
import { TransitMap } from './TransitMap';
import { TransitRoute } from './TransitRoute';
import { TransitStop } from './TransitStop';
import { Actionable, ClickInfo } from './types';
import { path as d3path } from 'd3-path';

export type ConnectionStrokeType = 'solid' | 'dotted' | 'dashed';

// Styles only for this individual connection. Other styles should be specific
// to the route.
export type ConnectionStyle = {
  strokeType: ConnectionStrokeType;
  spacingMultiplier: number;
  spacingOffset: number; // [0, 1]
  zIndex: number;
};

export function styleEquals(a: ConnectionStyle, b: ConnectionStyle): boolean {
  return a.strokeType === b.strokeType;
}

export const DEFALUT_CONNECTION_STYLE: ConnectionStyle = {
  strokeType: 'solid',
  spacingMultiplier: 1,
  spacingOffset: 0,
  zIndex: 0,
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
  public fromConnection: TransitConnection | null = null;
  public toConnection: TransitConnection | null = null;
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

  setWhichConnection(which: TransitStop, connection: TransitConnection) {
    if (which === this.from) {
      this.fromConnection = connection;
    } else if (which === this.to) {
      this.toConnection = connection;
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
    [this.fromConnection, this.toConnection] = [
      this.toConnection,
      this.fromConnection,
    ];
  }

  preDraw(ctx: CanvasRenderingContext2D): void {
    if (this.route.style.margin <= 0) {
      return;
    }
    const lineWidth = this.route.style.lineWidth;
    ctx.save();

    ctx.lineCap = 'butt';

    const [path] = this.getPath();

    ctx.lineWidth = lineWidth + this.route.style.margin * 2;
    ctx.strokeStyle = '#000';
    ctx.stroke(path);
    ctx.restore();
  }

  draw(ctx: CanvasRenderingContext2D) {
    let lineWidth = this.route.style.lineWidth;
    let lineLength = 0;
    let lineDist = 0;
    ctx.save();
    switch (this.style.strokeType) {
      case 'solid':
        ctx.setLineDash([]);
        ctx.lineCap = this.route.style.lineCap;
        break;
      case 'dotted':
        lineWidth = this.route.style.dottedWidth;
        ctx.setLineDash([
          0,
          this.route.style.dottedSpacing * this.style.spacingMultiplier,
        ]);
        lineDist =
          this.route.style.dottedSpacing * this.style.spacingMultiplier;
        ctx.lineCap = 'round';
        break;
      case 'dashed':
        lineWidth = this.route.style.dashedWidth;
        ctx.setLineDash([
          this.route.style.dashedLength,
          this.route.style.dashedSpacing * this.style.spacingMultiplier,
        ]);
        lineLength = this.route.style.dashedLength;
        lineDist =
          this.route.style.dashedLength +
          this.route.style.dashedSpacing * this.style.spacingMultiplier;
        ctx.lineCap = this.route.style.dashedLineCap;
        break;
    }

    const [path, length] = this.getPath();
    ctx.lineDashOffset =
      lineLength * 0.5 + lineDist * this.style.spacingOffset - length / 2;

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
      ctx.lineCap = this.route.style.dashedLineCap;
      ctx.strokeStyle = this.route.style.innerColor.hex();
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

  getFromToPosInfo(rounding = true) {
    let from = this.from.pos;
    let to = this.to.pos;
    const lateralOffset = this.lateralOffset * this.from.getLateralOffset();

    if (this.fromConnection) {
      const posInfo = this.fromConnection.getFromToPosInfo();
      from = posInfo[this.fromConnection.from === this.from ? 0 : 1];
    }
    if (this.toConnection) {
      const posInfo = this.toConnection.getFromToPosInfo();
      to = posInfo[this.toConnection.to === this.to ? 1 : 0];
    }
    if (lateralOffset) {
      const direction = from.directionTo(to).cw90();
      if (!this.fromConnection) from = from.add(direction.mult(lateralOffset));
      if (!this.toConnection) to = to.add(direction.mult(lateralOffset));
    }

    if (rounding) {
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
      return [from, to, lateralOffset, fromRounding, toRounding] as const;
    }
    return [from, to, lateralOffset] as const;
  }

  getDrawPos(which: TransitStop, rounding = true) {
    const [from, to] = this.getFromToPosInfo(rounding);
    return which === this.from ? from : to;
  }

  getOtherDrawPos(which: TransitStop, rounding = true) {
    const [from, to] = this.getFromToPosInfo(rounding);
    return which === this.from ? to : from;
  }

  getPath(): [Path2D, number, boolean, SVGPathElement] {
    const [from, to, lateralOffset, fromRounding, toRounding] =
      this.getFromToPosInfo();
    const path = d3path();

    if (fromRounding) {
      const { center, ogPos, radius } = fromRounding;
      const startAngle = wrapAngle2PI(center.angleTo(from));
      const endAngle = wrapAngle2PI(center.angleTo(ogPos));
      const clockwise =
        wrapAngle2PI(angleDelta(startAngle, endAngle)) < Math.PI;

      const sign = clockwise ? 1 : -1;

      const r = radius - lateralOffset * sign;

      if (r > 0 && sameHalfPlane(from, this.to.pos, center, ogPos)) {
        path.arc(center.x, center.y, r, endAngle, startAngle, clockwise);
      } else {
        const newPos = lineLineIntersection(from, to, center, ogPos);
        if (!newPos) {
          console.error('no intersection');
          path.lineTo(from.x, from.y);
        } else {
          path.moveTo(newPos.x, newPos.y);
        }
      }
    } else {
      path.moveTo(from.x, from.y);
    }

    if (toRounding) {
      const { center, ogPos, radius } = toRounding;
      const startAngle = center.angleTo(to);
      const endAngle = center.angleTo(ogPos);
      const clockwise =
        wrapAngle2PI(angleDelta(startAngle, endAngle)) < Math.PI;

      const sign = clockwise ? 1 : -1;

      const r = radius + lateralOffset * sign;

      if (r > 0 && sameHalfPlane(to, this.from.pos, center, ogPos)) {
        path.arc(center.x, center.y, r, startAngle, endAngle, !clockwise);
      } else {
        const newPos = lineLineIntersection(from, to, center, ogPos);
        if (!newPos) {
          console.error('no intersection');
          path.lineTo(to.x, to.y);
        } else {
          path.lineTo(newPos.x, newPos.y);
        }
      }
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

    return [path2d, length, !!(fromRounding || toRounding), svgPath];
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
    const from = this.getDrawPos(which, false);
    const to = this.getOtherDrawPos(which, false);
    return Math.atan2(to.y - from.y, to.x - from.x);
  }

  isParallelTo(other: TransitConnection): boolean {
    const epsilon = 0.001;
    const angle1 = this.getAngle(this.from);
    const angle2 = other.getAngle(other.from);
    const diff = Math.abs(angle1 - angle2);
    return (
      diff < epsilon ||
      (diff > Math.PI - epsilon && diff < Math.PI + epsilon) ||
      diff > Math.PI * 2 - epsilon
    );
  }

  getDirectionVector(which: TransitStop): Vector2 {
    if (which !== this.from && which !== this.to) {
      throw new Error('The stop must be either the from or the to stop');
    }
    const from = this.getDrawPos(which, false);
    const to = this.getOtherDrawPos(which, false);
    return from.directionTo(to);
  }

  getDirectSnapLines(which: TransitStop, delta: Vector2): SnapLine[] {
    const other = this.getOtherStop(which);
    const pos =
      this.toConnection || this.fromConnection
        ? this.getDrawPos(which, false)
        : which.pos;
    const otherPos =
      this.toConnection || this.fromConnection
        ? this.getOtherDrawPos(which, false)
        : other.pos;
    const diff = pos.sub(otherPos).normalize();
    const dist = other.pos.dist(which.pos);

    const p = pos.sub(delta);
    return [
      new SnapLine(p, diff, 0, dist),
      new SnapLine(p, diff.rotateBy(Math.PI / 2), 1, dist),
      new SnapLine(p, diff.rotateBy(-Math.PI / 2), 1, dist),
    ];
  }

  getCardinalSnapLines(which: TransitStop, length: number | null): SnapLine[] {
    if (
      (which === this.from && this.fromConnection) ||
      (which === this.to && this.toConnection)
    ) {
      return [];
    }
    const delta = this.getOtherStop(which).pos.sub(
      this.getOtherDrawPos(which, false),
    );
    const pos = this.getDrawPos(which, false).add(delta);
    if (length === null) {
      return [
        new SnapLine(pos, new Vector2(1, 0), 2),
        new SnapLine(pos, new Vector2(0, 1), 2),
        new SnapLine(pos, new Vector2(1, 1).normalize(), 3),
        new SnapLine(pos, new Vector2(1, -1).normalize(), 3),
      ];
    } else {
      return [
        new SnapLine(pos, new Vector2(1, 0), 2, length),
        new SnapLine(pos, new Vector2(-1, 0), 2, length),
        new SnapLine(pos, new Vector2(0, 1), 2, length),
        new SnapLine(pos, new Vector2(0, -1), 2, length),
        new SnapLine(pos, new Vector2(1, 1).normalize(), 3, length),
        new SnapLine(pos, new Vector2(1, -1).normalize(), 3, length),
        new SnapLine(pos, new Vector2(-1, 1).normalize(), 3, length),
        new SnapLine(pos, new Vector2(-1, -1).normalize(), 3, length),
      ];
    }
  }

  getSnapLines(which: TransitStop): SnapLine[] {
    const snapLines: SnapLine[] = [];

    const others = which.getConnectingStops();
    const other = this.getOtherStop(which);
    const otherDelta = other.pos.sub(this.getOtherDrawPos(which, false));

    for (const connection of other.connections) {
      if (connection === this) {
        continue;
      }
      const other2 = connection.getOtherStop(other);
      if (others.includes(other2)) {
        continue;
      }
      snapLines.push(...connection.getDirectSnapLines(other, otherDelta));
    }

    const length = snapLines.length === 3 ? snapLines[0].length : null;
    const cardinalSnapLines = this.getCardinalSnapLines(other, length);

    return [...snapLines, ...cardinalSnapLines];
  }

  inheritStyle(connection: TransitConnection) {
    this.style = { ...connection.style };
    if (this.from === connection.from) {
      this.fromConnection = connection.fromConnection;
    }
    if (this.to === connection.to) {
      this.toConnection = connection.toConnection;
    }
  }

  doubleClick(): void {
    splitConnectionAction(this.map, this);
  }

  rightClick({ pos, setSelected }: ClickInfo) {
    const stop = splitConnectionAction(this.map, this).data.stop;
    stop.setPos(pos);
    stop.hidden = true;
    setSelected(stop);
    return true;
  }
}
