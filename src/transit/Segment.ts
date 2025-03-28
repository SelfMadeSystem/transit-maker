import { Color } from '../components/color/Color';
import { Path2Dpp } from '../utils/Path2Dpp';
import { CanvasDrawingContext, DrawingContext } from '../utils/drawingContext';
import { Vector2, midpointShortestArc } from '../utils/vec';
import { Route } from './Route';
import { SegmentPosition } from './SegmentPosition';
import { Stop } from './Stop';
import { TransitMap } from './TransitMap';
import { Actionable, ClickInfo, DragInfo } from './types';

export type SegmentStrokeType = 'solid' | 'dotted' | 'dashed';

type BaseSegmentStroke = {
  id: number;
  color: Color | null;
  width: number;
  clear: boolean;
  strokeType: SegmentStrokeType;
  lineCap: CanvasLineCap;
};

type DottedSegmentStroke = BaseSegmentStroke & {
  strokeType: 'dotted';
  dottedSpacing: number;
  dottedOffset: number;
};

type DashedSegmentStroke = BaseSegmentStroke & {
  strokeType: 'dashed';
  dashedLength: number;
  dashedSpacing: number;
  dashedOffset: number;
};

type SolidSegmentStroke = BaseSegmentStroke & {
  strokeType: 'solid';
};

export type SegmentStroke =
  | DottedSegmentStroke
  | DashedSegmentStroke
  | SolidSegmentStroke;

export type SegmentStyle = {
  strokes: SegmentStroke[];
};

export type SpecificSegmentStyle = {
  spacingMultiplier: number;
  spacingOffset: number; // [0, 1]
  lateralOffset: number;
  hidden: boolean;
  zIndex: number;
};

export const DEFALUT_SEGMENT_STYLE: SpecificSegmentStyle = {
  spacingMultiplier: 1,
  spacingOffset: 0,
  lateralOffset: 0,
  hidden: false,
  zIndex: 0,
};

type SegDragInfo = {
  which: 'start' | 'end' | 'segment';
  offset?: Vector2;
};

export class Segment implements Actionable {
  public style: SegmentStyle = {
    strokes: [
      {
        strokeType: 'solid',
        clear: true,
        color: Color.TRANSPARENT,
        id: 0,
        lineCap: 'butt',
        width: 6,
      },
      {
        strokeType: 'solid',
        clear: false,
        color: null,
        id: 1,
        lineCap: 'round',
        width: 2,
      },
    ],
  };
  public specificStyle: SpecificSegmentStyle = { ...DEFALUT_SEGMENT_STYLE };
  private dragInfo: SegDragInfo | null = null;
  public segmentPosDeps: Set<SegmentPosition> = new Set();
  constructor(
    public readonly map: TransitMap,
    public route: Route,
    public start: SegmentPosition,
    public end: SegmentPosition,
  ) {
    map.segments.add(this);
    this.start.deps.add(this);
    this.end.deps.add(this);
  }

  changeWhichEnd(old: SegmentPosition, newPos: SegmentPosition) {
    if (this.start === old) {
      this.start.removeDep(this);
      this.start = newPos;
    } else if (this.end === old) {
      this.end.removeDep(this);
      this.end = newPos;
    }
    newPos.deps.add(this);
  }

  /** If 0, then this.start. If 1, then this.end. Otherwise, undefined. */
  getWhichEnd(index: number): SegmentPosition | undefined {
    if (index === 0) {
      return this.start;
    } else if (index === 1) {
      return this.end;
    } else {
      return undefined;
    }
  }

  remove(): void {
    this.map.segments.delete(this);
    this.start.removeDep(this);
    this.end.removeDep(this);
  }

  isOver(pos: Vector2, _: CanvasDrawingContext): boolean {
    const path = this.getPath();
    return path.isPointClose(pos, this.getWidth());
  }

  getDragInfo(pos: Vector2): SegDragInfo | null {
    const path = this.getPath();
    const start = path.getStartPoint();
    const end = path.getEndPoint();
    const startDist = start.dist(pos);
    const endDist = end.dist(pos);
    const width = this.getWidth();
    if (startDist < endDist && startDist < width) {
      return {
        which: 'start',
        offset: pos.sub(this.getStart()),
      };
    } else if (endDist < startDist && endDist < width) {
      return {
        which: 'end',
        offset: pos.sub(this.getEnd()),
      };
    }
    if (path.isPointClose(pos, width)) {
      return { which: 'segment' };
    }
    return null;
  }

  disconnect(which: 'start' | 'end'): void {
    if (which === 'start') {
      this.start.removeDep(this);
      this.start = this.start.clone();
      this.start.deps.add(this);
    } else if (which === 'end') {
      this.end.removeDep(this);
      this.end = this.end.clone();
      this.end.deps.add(this);
    }
  }

  onClick(a: ClickInfo): void {
    const dragInfo = this.getDragInfo(a.pos);
    if (dragInfo) this.dragInfo = dragInfo;
    const which = this.dragInfo?.which;

    switch (a.button) {
      case 'left': {
        if (a.clickType === 'double') {
          let newStart: SegmentPosition = this.start;
          let newEnd: SegmentPosition = this.end;
          if (which === 'start') {
            newEnd = SegmentPosition.vec(this.start.getPoint());
          } else if (which === 'end') {
            newStart = this.end;
            newEnd = SegmentPosition.vec(this.end.getPoint());
          } else if (which === 'segment') {
            const path = this.getPath();
            const length = path.getLengthAtPoint(a.pos);
            const position = length / path.getTotalLength();
            const point = path.getPointAtLength(length);

            newStart = SegmentPosition.snap(this, position, 0);
            newEnd = SegmentPosition.vec(point);
          }
          const newSegment = new Segment(
            this.map,
            this.route,
            newStart,
            newEnd,
          );
          newSegment.style = this.style;
          newSegment.specificStyle = this.specificStyle;
          newSegment.dragInfo = { which: 'end' };
          this.map.selected = newSegment;
          break;
        }
        break;
      }
      case 'right': {
        if (which === 'start' || which === 'end') {
          this.disconnect(which);
        } else {
          this.map.ctxMenu.selectRoute(a.screenPos).then(route => {
            if (route) {
              this.route = route;
              this.map.selected = this;
            } else {
              this.map.selected = null;
            }
          });
        }
      }
    }
  }

  onDrag(a: DragInfo): void {
    if (!this.dragInfo) return;
    const { delta, shiftKey } = a;
    let end = a.end;
    if (this.dragInfo.offset) {
      end = end.sub(this.dragInfo.offset);
    }
    switch (this.dragInfo.which) {
      case 'start':
        this.start.moveTo(end);
        if (shiftKey) {
          this.map.actionablesByZIndex(
            segment =>
              segment instanceof Segment &&
              this.start.trySnap(this, segment, end),
            true,
          );
        }
        break;
      case 'end':
        this.end.moveTo(end);
        if (shiftKey) {
          this.map.actionablesByZIndex(
            segment =>
              segment instanceof Segment &&
              this.end.trySnap(this, segment, end),
            true,
          );
        }
        break;
      case 'segment':
        this.start.moveBy(delta, this.end);
        break;
    }
  }

  onDragEnd(a: DragInfo): void {
    if (this.getStart().equals(this.getEnd())) {
      // convert to a stop
      const stop = new Stop(this.map, this.start);
      this.map.selected = stop;
      this.remove();
      return;
    }
    if (!this.dragInfo) return;
    const { shiftKey } = a;
    let end = a.end;
    if (this.dragInfo.offset) {
      end = end.sub(this.dragInfo.offset);
    }
    if (!shiftKey) return;
    const p =
      this.dragInfo.which === 'start'
        ? this.start
        : this.dragInfo.which === 'end'
          ? this.end
          : null;
    if (!p) return;
    this.map.actionablesByZIndex(
      segment =>
        segment instanceof Segment && p.trySnap(this, segment, end, 10, true),
      true,
    );
    /* else if (position === 0 || position === 1) {
        const thisPoint = pos.getPoint();
        const deps = [...segment.segmentPosDeps];
        const p = segment.getWhichEnd(position);
        if (p) {
          const otherDep = p.getOtherDep(segment);
          if (otherDep && otherDep instanceof Segment) {
            deps.push(...otherDep.segmentPosDeps);
          }
        }
        for (const otherPos of deps) {
          if (otherPos === pos) continue;
          const otherPoint = otherPos.getPoint();
          if (
            otherPos.type === 'snap' &&
            Math.abs(otherPos.offset!) === Math.abs(offset) &&
            (otherPos.position === 0 || otherPos.position === 1)
          ) {
            if (thisPoint.dist(otherPoint) < EPSILON) {
              pos.mergeToSegment(otherPos);
              break;
            }
          }
        }
      } */
  }

  /** Gets the width of the segment */
  getWidth(): number {
    return this.style.strokes[0].width;
  }

  /** Gets the z index of the segment */
  getZIndex(): number {
    return (
      this.specificStyle.zIndex + this.route.index / this.map.routes.length
    );
  }

  /** Gets the start position of the segment */
  getStart(): Vector2 {
    return this.start.getPoint();
  }

  /** Gets the end position of the segment */
  getEnd(): Vector2 {
    return this.end.getPoint();
  }

  /**
   * Gets the other position of the segment. The position given must be either
   * this.start or this.end.
   */
  getOtherEnd(position: SegmentPosition): SegmentPosition {
    if (position === this.start) {
      return this.end;
    } else if (position === this.end) {
      return this.start;
    } else {
      throw new Error('Invalid position');
    }
  }

  /** Gets the point at a given position along the segment */
  getPoint(position: number, offset: number, dontRound = false): Vector2 {
    const path = this.getPath(offset, dontRound);
    const length = path.getTotalLength();
    return path.getPointAtLength(length * position);
  }

  getOffsetPoint(position: number, offset: number): Vector2 {
    let start = this.getStart();
    let end = this.getEnd();

    if (start.equals(end)) {
      return start;
    }

    const normal = end.sub(start).normalize();
    if (offset !== 0) {
      const startAngle = this.start.getAngle(this);
      const endAngle = this.end.getAngle(this);

      if (startAngle !== undefined) {
        start = start.add(
          normal.mult(
            Math.tan((Math.PI - Math.abs(startAngle)) / 2) *
              offset *
              Math.sign(startAngle),
          ),
        );
      }
      if (endAngle !== undefined) {
        end = end.add(
          normal.mult(
            Math.tan((Math.PI - Math.abs(endAngle)) / 2) *
              offset *
              Math.sign(endAngle),
          ),
        );
      }
    }
    const pos = start.lerp(end, position);
    const offsetVector = normal.cw90().mult(offset);

    return pos.add(offsetVector);
  }

  /**
   * Determines if this segment and another segment share the same start or end.
   */
  sharesEnd(segment: Segment): boolean {
    return (
      this.start === segment.start ||
      this.end === segment.end ||
      this.start === segment.end ||
      this.end === segment.start
    );
  }

  applyStroke(ctx: DrawingContext, stroke: SegmentStroke) {
    const { width, color, lineCap } = stroke;
    let lineLength = 0;
    let lineDist = 0;
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
        lineDist = stroke.dottedSpacing * this.specificStyle.spacingMultiplier;
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

    ctx.setStrokeDashOffset(lineLength * 0.5 + lineDist * offset - length / 2);

    ctx.setStrokeWidth(width);

    ctx.setStroke(color ?? this.route.color);
  }

  getPath(offset = 0, dontRound = false): Path2Dpp {
    const [start, end] =
      offset === 0
        ? [this.getStart(), this.getEnd()]
        : [this.getOffsetPoint(0, offset), this.getOffsetPoint(1, offset)];
    const startRounding = this.start.rounding;
    const endRounding = this.end.rounding;
    const path = new Path2Dpp();

    if (dontRound || (startRounding === 0 && endRounding === 0)) {
      // No rounding, just draw a line
      path.moveTo(start);
      path.lineTo(end);
      return path;
    }

    const midpoint = start.lerp(end, 0.5);
    const startDep = this.start.getOtherDep(this);
    if (startDep instanceof Segment) {
      const depPos = startDep.getOffsetPoint(
        startDep.start === this.start ? 1 : 0,
        offset * (startDep.start === this.start ? -1 : 1),
      );
      const startAngle = this.start.getAngle(this)!;
      const stuff = Path2Dpp.calculateArcTo(
        depPos,
        start,
        midpoint,
        startRounding - offset * Math.sign(startAngle),
      );
      if (stuff) {
        const { start, end, center, sweepFlag, radius } = stuff;
        const midpoint = midpointShortestArc(start, end, center, radius);
        path.moveTo(midpoint);
        path.arcSvg(new Vector2(radius), 0, false, sweepFlag, end);
      } else {
        path.moveTo(start);
      }
    } else {
      path.moveTo(start);
    }

    const endDep = this.end.getOtherDep(this);
    if (endDep instanceof Segment) {
      const depPos = endDep.getOffsetPoint(
        endDep.end === this.end ? 0 : 1,
        offset * (endDep.end === this.end ? -1 : 1),
      );
      const endAngle = this.end.getAngle(this)!;
      const stuff = Path2Dpp.calculateArcTo(
        midpoint,
        end,
        depPos,
        endRounding + offset * Math.sign(endAngle),
      );
      if (stuff) {
        const { start, end, center, sweepFlag, radius } = stuff;
        const midpoint = midpointShortestArc(start, end, center, radius);
        path.lineTo(start);
        path.arcSvg(new Vector2(radius), 0, false, sweepFlag, midpoint);
      } else {
        path.lineTo(end);
      }
    } else {
      path.lineTo(end);
    }

    return path;
  }

  /** Draws the segment */
  *draw(ctx: DrawingContext): Generator<void> {
    const path = this.getPath();

    for (const stroke of this.style.strokes) {
      ctx.save();
      this.applyStroke(ctx, stroke);
      ctx.strokePath(path, stroke.clear);
      ctx.restore();
      yield;
    }
  }

  drawSelected(ctx: DrawingContext) {
    ctx.save();
    const path = this.getPath();
    const start = this.getStart();
    const end = this.getEnd();
    ctx.setCtx('fg');

    ctx.setStroke(Color.WHITE);
    ctx.setStrokeWidth(this.getWidth() + 2);
    ctx.setStrokeDash([2, 3]);
    ctx.setStrokeDashOffset(performance.now() / 100);
    ctx.strokePath(path, false);

    ctx.setStroke(Color.TRANSPARENT);
    ctx.setStrokeDash([]);
    ctx.setStrokeWidth(this.getWidth());
    ctx.strokePath(path, true);

    ctx.setStroke(Color.WHITE);
    ctx.setStrokeWidth(0.5);
    ctx.setStrokeDash([5, 2]);
    ctx.setStrokeDashOffset(0);
    ctx.strokePath(this.getPath(0, true), false);

    ctx.setStroke(Color.WHITE);
    ctx.setStrokeDash([]);
    ctx.strokePath(
      Path2Dpp[this.start.type === 'vec' ? 'circle' : 'circleX'](start, 5),
    );
    ctx.setStroke(Color.RED);
    ctx.strokePath(
      Path2Dpp[this.end.type === 'vec' ? 'circle' : 'circleX'](end, 5),
    );

    ctx.restore();
  }

  debugDraw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = Color.CYAN.hex();
    const path = this.getPath();
    ctx.stroke(path.toPath2D());
    ctx.fillStyle = Color.MAGENTA.hex();
    ctx.beginPath();
    ctx.arc(...this.getStart().a, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = Color.YELLOW.hex();
    ctx.beginPath();
    ctx.arc(...this.getEnd().a, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
