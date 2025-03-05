import { Color } from '../components/color/Color';
import { Path2Dpp } from '../utils/Path2Dpp';
import { DrawingContext } from '../utils/drawingContext';
import { id } from '../utils/id';
import { angleDelta, wrapAngle2PI } from '../utils/mathUtils';
import { Vector2, lineLineIntersection, sameHalfPlane } from '../utils/vec';
import { createStopAction, splitConnectionAction } from './Action';
import { SnapLine } from './Snapping';
import { SavedStyle, TransitMap } from './TransitMap';
import { RouteColor, TransitRoute } from './TransitRoute';
import { TransitStop } from './TransitStop';
import { Actionable, ClickInfo, LayeredDrawable } from './types';
import { getClosestPoint } from 'svg-path-commander';

export type ConnectionStrokeType = 'solid' | 'dotted' | 'dashed';

type BaseConnectionStroke = {
  id: number;
  color: RouteColor;
  width: number;
  clear: boolean;
  strokeType: ConnectionStrokeType;
  lineCap: CanvasLineCap;
};

type DottedConnectionStroke = BaseConnectionStroke & {
  strokeType: 'dotted';
  dottedSpacing: number;
  dottedOffset: number;
};

type DashedConnectionStroke = BaseConnectionStroke & {
  strokeType: 'dashed';
  dashedLength: number;
  dashedSpacing: number;
  dashedOffset: number;
};

type SolidConnectionStroke = BaseConnectionStroke & {
  strokeType: 'solid';
};

export type ConnectionStroke =
  | DottedConnectionStroke
  | DashedConnectionStroke
  | SolidConnectionStroke;

export type ConnectionStyle = {
  strokes: ConnectionStroke[];
};

export type SpecificConnectionStyle = {
  spacingMultiplier: number;
  spacingOffset: number; // [0, 1]
  lateralOffset: number;
  hidden: boolean;
  zIndex: number;
};

export const DEFALUT_CONNECTION_STYLE: SpecificConnectionStyle = {
  spacingMultiplier: 1,
  spacingOffset: 0,
  lateralOffset: 0,
  hidden: false,
  zIndex: 0,
};

export type PathResult = {
  path: Path2Dpp;
  length: number;
  rounded: boolean;
};

export class TransitConnection implements Actionable, LayeredDrawable {
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
  public fromConnection: TransitConnection | null = null;
  public toConnection: TransitConnection | null = null;
  public specificStyle: SpecificConnectionStyle = {
    ...DEFALUT_CONNECTION_STYLE,
  };
  public style?: SavedStyle<ConnectionStyle>;

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

  getStyle(): ConnectionStyle {
    return this.style?.style ?? this.route.style.connectionStyle.style;
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
    this.specificStyle.lateralOffset = -this.specificStyle.lateralOffset;
    [this.fromConnection, this.toConnection] = [
      this.toConnection,
      this.fromConnection,
    ];
  }

  // preDraw(ctx: CanvasRenderingContext2D): void {
  //   if (this.route.style.margin <= 0 || this.specificStyle.strokeType === 'hidden')
  //     return;

  //   const lineWidth = this.route.style.lineWidth;
  //   ctx.save();

  //   ctx.lineCap = 'butt';

  //   ctx.lineWidth = lineWidth + this.route.style.margin * 2;
  //   ctx.strokeStyle = '#000';
  //   // This globalCompositeOperation is used to add the margin to the line.
  //   // It works by removing all the regions "behind" the line, which, in
  //   // hindsight, is like duh super obvious but this took me idk like 2 days to
  //   // figure out. I felt like a genius when I finally got it though.
  //   ctx.globalCompositeOperation = 'destination-out';
  //   ctx.stroke(path);
  //   ctx.restore();
  // }

  getColor(color: RouteColor): Color {
    if (color === 'route') {
      return this.route.style.color;
    }
    return color;
  }

  /**
   * Draws the transit connection on the given drawing context.
   * This method is implemented as a generator to allow for layer-by-layer
   * drawing. This is necessary because each layer may will different styles and
   * wet don't want layers from different connections to be drawn on top of each
   * other.
   *
   * @param ctx The drawing context to draw on.
   * @yields Yields after each stroke is drawn.
   *
   * The drawing process involves the following steps:
   * 1. Check if the connection is hidden. If it is, return early.
   * 2. Get the path and length of the connection.
   * 3. Get the style of the connection.
   * 4. For each stroke in the style:
   *   a. Set the stroke properties (width, color, line cap, etc.).
   *   b. Configure the dashed pattern based on the stroke type.
   *   c. Draw the stroke.
   *   d. Yield control to the caller.
   * 5. Restore the drawing context state after each stroke is drawn.
   */
  *draw(ctx: DrawingContext) {
    if (this.specificStyle.hidden) return;

    const { path, length } = this.getPath(true);
    const style = this.getStyle();
    for (const stroke of style.strokes) {
      const { width, clear, color: oultineColor, lineCap } = stroke;
      const color = this.getColor(oultineColor);
      let lineLength = 0;
      let lineDist = 0;
      ctx.save();
      ctx.setStrokeLineCap(lineCap);
      let offset = this.specificStyle.spacingOffset;
      switch (stroke.strokeType) {
        case 'solid':
          ctx.setStrokeDash([]);
          break;
        case 'dotted':
          ctx.setStrokeDash([
            0,
            stroke.dottedSpacing * this.specificStyle.spacingMultiplier,
          ]);
          lineDist =
            stroke.dottedSpacing * this.specificStyle.spacingMultiplier;
          ctx.setStrokeLineCap('round');
          offset += stroke.dottedOffset;
          break;
        case 'dashed':
          ctx.setStrokeDash([
            stroke.dashedLength,
            stroke.dashedSpacing * this.specificStyle.spacingMultiplier,
          ]);
          lineLength = stroke.dashedLength;
          lineDist =
            stroke.dashedLength +
            stroke.dashedSpacing * this.specificStyle.spacingMultiplier;
          offset += stroke.dashedOffset;
          break;
      }

      ctx.setStrokeDashOffset(
        lineLength * 0.5 + lineDist * offset - length / 2,
      );

      ctx.setStrokeWidth(width);

      ctx.setStroke(color);
      ctx.strokePath(path, clear);
      ctx.restore();
      yield;
    }
  }

  drawSelected(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const style = this.getStyle();
    const stroke = style.strokes[0];
    const lineWidth = stroke.width;
    ctx.setLineDash([lineWidth, lineWidth]);
    ctx.lineDashOffset = (Date.now() / 200) % (lineWidth * 2);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = stroke.width + 2;
    const { path: pathpp } = this.getPath();
    const path = pathpp.toPath2D();
    ctx.stroke(path);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'black';
    ctx.setLineDash([]);
    ctx.lineCap = 'square';
    ctx.lineWidth = stroke.width;
    ctx.stroke(path);
    ctx.restore();
  }

  getFromToPosInfo(rounding = true) {
    let from = this.from.pos;
    let to = this.to.pos;
    const { lateralOffset } = this.specificStyle;

    if (this.fromConnection) {
      const posInfo = this.fromConnection.getFromToPosInfo(rounding);
      from = posInfo[this.fromConnection.from === this.from ? 0 : 1];
    }
    if (this.toConnection) {
      const posInfo = this.toConnection.getFromToPosInfo(rounding);
      to = posInfo[this.toConnection.to === this.to ? 1 : 0];
    }
    if (lateralOffset) {
      const direction = from.directionTo(to).cw90().mult(lateralOffset);
      if (!this.fromConnection) from = from.add(direction);
      if (!this.toConnection) to = to.add(direction);
    }

    if (rounding) {
      const fromRounding = this.from.calculateRoundingStuff();
      const toRounding = this.to.calculateRoundingStuff();

      if (fromRounding) {
        const direction = from.directionTo(to);
        if (!direction.isNaN())
          from = from.add(direction.mult(fromRounding.edgeDist));
      }

      if (toRounding) {
        const direction = to.directionTo(from);
        if (!direction.isNaN())
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

  private pathCache: PathResult | null = null;

  getPath(noCache = false): PathResult {
    if (!noCache && this.pathCache) {
      return this.pathCache;
    }

    const [from, to, lateralOffset, fromRounding, toRounding] =
      this.getFromToPosInfo();

    const path = new Path2Dpp();

    if (fromRounding) {
      const { center, ogPos, radius } = fromRounding;
      const startAngle = wrapAngle2PI(center.angleTo(from));
      const endAngle = wrapAngle2PI(center.angleTo(ogPos));
      const clockwise =
        wrapAngle2PI(angleDelta(startAngle, endAngle)) < Math.PI;

      const sign = clockwise ? 1 : -1;

      const r = radius - lateralOffset * sign;

      if (r > 0 && sameHalfPlane(from, this.to.pos, center, ogPos)) {
        path.arc(...center.a, r, endAngle, startAngle, clockwise);
      } else {
        const newPos = lineLineIntersection(from, to, center, ogPos);
        if (!newPos) {
          path.lineTo(...from.a);
        } else {
          path.moveTo(...newPos.a);
        }
      }
    } else {
      path.moveTo(...from.a);
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
        path.arc(...center.a, r, startAngle, endAngle, !clockwise);
      } else {
        const newPos = lineLineIntersection(from, to, center, ogPos);
        if (!newPos) {
          path.lineTo(...to.a);
        } else {
          path.lineTo(...newPos.a);
        }
      }
    } else {
      path.lineTo(...to.a);
    }

    const length = path.getTotalLength();

    const result: PathResult = {
      path: path,
      length,
      rounded: !!(fromRounding || toRounding),
    };

    this.pathCache = result;

    return result;
  }

  isOver(x: number, y: number, ctx: CanvasRenderingContext2D) {
    const style = this.getStyle();
    const width = style.strokes[0].width + 2;
    const { path: pathpp } = this.getPath();
    ctx.lineWidth = width;
    const path = pathpp.toPath2D();
    return ctx.isPointInStroke(path, x, y);
  }

  getAngleVector(which: TransitStop): Vector2 {
    if (which !== this.from && which !== this.to) {
      throw new Error('The stop must be either the from or the to stop');
    }
    const from = this.getDrawPos(which, false);
    const to = this.getOtherDrawPos(which, false);
    return from.directionTo(to);
  }

  getAngle(which: TransitStop): number {
    return this.getAngleVector(which).angle();
  }

  getLineLength(): number {
    return this.from.pos.dist(this.to.pos);
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
    const whichDelta = which.pos.sub(this.getDrawPos(which, false));
    const delta = otherDelta.sub(whichDelta);

    snapLines.push(...other.getLinkedSnapLines());
    snapLines.push(...which.getLinkedSnapLines());

    for (const connection of other.connections) {
      if (connection === this) {
        continue;
      }
      const other2 = connection.getOtherStop(other);
      if (others.includes(other2)) {
        continue;
      }
      snapLines.push(...connection.getDirectSnapLines(other, delta));
    }

    const length = snapLines.length === 3 ? snapLines[0].length : null;
    const cardinalSnapLines = this.getCardinalSnapLines(other, length);

    return [...snapLines, ...cardinalSnapLines];
  }

  inheritStyle(connection: TransitConnection) {
    if (connection.style) {
      this.style = connection.style;
    }
    if (connection.specificStyle.hidden) {
      this.specificStyle.hidden = true;
    }
    this.specificStyle.zIndex = connection.specificStyle.zIndex;
    this.specificStyle.lateralOffset = connection.specificStyle.lateralOffset;
    if (this.from === connection.to || this.to === connection.from) {
      this.specificStyle.lateralOffset *= -1;
    }

    if (this.from === connection.from) {
      this.fromConnection = connection.fromConnection;
    }
    if (this.to === connection.to) {
      this.toConnection = connection.toConnection;
    }
  }

  doubleClick({ pos, setSelected, shiftKey }: ClickInfo): void {
    if (shiftKey) {
      const { path: pathpp } = this.getPath();
      const c = getClosestPoint(pathpp.getSVGPath().segments, pos);
      const closest = new Vector2(c);
      const stop = createStopAction(this.map, [], closest).data;
      stop.linked = {
        connection: this,
        length: 0.5,
      };
      setSelected(stop);
    } else {
      const stop = splitConnectionAction(this.map, this).data.stop;
      setSelected(stop);
    }
  }

  rightClick({ pos, setSelected }: ClickInfo) {
    const stop = splitConnectionAction(this.map, this).data.stop;
    const { path: pathpp } = this.getPath();
    const closest = new Vector2(
      getClosestPoint(pathpp.getSVGPath().segments, pos),
    );
    stop.setPos(closest);
    stop.hidden = true;
    setSelected(stop);
    return true;
  }
}
