import { Color } from '../components/color/Color';
import { Path2Dpp } from '../utils/Path2Dpp';
import { CanvasDrawingContext, DrawingContext } from '../utils/drawingContext';
import { Vector2 } from '../utils/vec';
import { Route } from './Route';
import { SegmentPosition } from './SegmentPosition';
import { TransitMap } from './TransitMap';
import { Actionable, ClickInfo, DragInfo, LayeredDrawable } from './types';

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

export class Segment implements Actionable, LayeredDrawable {
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
  private dragInfo: {
    which: 'start' | 'end' | 'segment';
  } | null = null;
  public segmentPosDeps: Set<SegmentPosition> = new Set();
  constructor(
    public readonly map: TransitMap,
    public route: Route,
    public start: SegmentPosition,
    public end: SegmentPosition,
  ) {
    map.segments.add(this);
    this.start.segments.add(this);
    this.end.segments.add(this);
  }

  changeWhichEnd(old: SegmentPosition, newPos: SegmentPosition) {
    if (this.start === old) {
      this.start.segments.delete(this);
      this.start = newPos;
    } else if (this.end === old) {
      this.end.segments.delete(this);
      this.end = newPos;
    }
    newPos.segments.add(this);
  }

  remove(): void {
    this.map.segments.delete(this);
    this.start.segments.delete(this);
    this.end.segments.delete(this);
    for (const dep of this.segmentPosDeps) {
      dep.unsnap();
    }
  }

  isOver(pos: Vector2, _: CanvasDrawingContext): boolean {
    const path = this.getPath();
    return path.isPointClose(pos, this.getWidth());
  }

  getWhich(pos: Vector2): 'start' | 'end' | 'segment' | null {
    const start = this.getStart();
    const end = this.getEnd();
    const startDist = start.dist(pos);
    const endDist = end.dist(pos);
    const width = this.getWidth();
    if (startDist < endDist && startDist < width) {
      return 'start';
    } else if (endDist < startDist && endDist < width) {
      return 'end';
    }
    const path = this.getPath();
    if (path.isPointClose(pos, width)) {
      return 'segment';
    }
    return null;
  }

  disconnect(which: 'start' | 'end'): void {
    if (which === 'start') {
      this.start.segments.delete(this);
      this.start = this.start.clone();
      this.start.segments.add(this);
      this.start.unsnap();
    } else if (which === 'end') {
      this.end.segments.delete(this);
      this.end = this.end.clone();
      this.end.segments.add(this);
      this.end.unsnap();
    }
  }

  onClick(a: ClickInfo): void {
    const which = this.getWhich(a.pos);
    if (which) this.dragInfo = { which };

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
        }
      }
    }
  }

  onDrag(a: DragInfo): void {
    if (!this.dragInfo) return;
    const { delta, end, shiftKey } = a;
    switch (this.dragInfo.which) {
      case 'start':
        this.start.moveTo(end, true);
        if (shiftKey) {
          this.map.segmentsByZIndex(
            segment => this.start.trySnap(this, segment, end),
            true,
          );
        }
        break;
      case 'end':
        this.end.moveTo(end, true);
        if (shiftKey) {
          this.map.segmentsByZIndex(
            segment => this.end.trySnap(this, segment, end),
            true,
          );
        }
        break;
      case 'segment':
        this.start.moveBy(delta, this.end);
        break;
    }
  }

  onDragEnd(_: DragInfo): void {
    if (this.start.type === 'snap' && this.start.offset === 0) {
      if (this.start.position === 0) {
        this.start.mergeToSegment(this.start.segment!.start);
      } else if (this.start.position === 1) {
        this.start.mergeToSegment(this.start.segment!.end);
      }
    }

    if (this.end.type === 'snap' && this.end.offset === 0 && this.end.segment) {
      if (this.end.position === 0) {
        this.end.mergeToSegment(this.end.segment.start);
      } else if (this.end.position === 1) {
        this.end.mergeToSegment(this.end.segment.end);
      }
    }
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
  getPoint(position: number, offset: number): Vector2 {
    let start = this.getStart();
    let end = this.getEnd();

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
   * If a given segment is to snap to this segment, return true if an infinite
   * loop would be created. We don't like infinite loops as we'd never be able
   * to find the positions of the segments since they reference each other.
   */
  createsLoop(
    segment: Segment,
    visited = new Set<Segment>([segment]),
  ): boolean {
    if (visited.has(this)) return true;
    visited.add(this);
    return (
      (this.end.segment?.createsLoop(segment, visited) ||
        this.start.segment?.createsLoop(segment, visited)) ??
      false
    );
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

  getPath(): Path2Dpp {
    const path = new Path2Dpp();
    path.moveTo(this.getStart());
    path.lineTo(this.getEnd());
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
    this.getPoint(1, 1);
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
    ctx.setStrokeWidth(1);
    ctx.strokePath(
      Path2Dpp[this.start.type === 'vec' ? 'circle' : 'circleX'](start, 5),
    );
    ctx.setStroke(Color.RED);
    ctx.strokePath(
      Path2Dpp[this.end.type === 'vec' ? 'circle' : 'circleX'](end, 5),
    );

    ctx.restore();
  }
}
