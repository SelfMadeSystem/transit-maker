import { Color } from '../components/color/Color';
import { Path2Dpp } from '../utils/Path2Dpp';
import { DrawingContext } from '../utils/drawingContext';
import { Vector2 } from '../utils/vec';
import { SegmentPosition } from './Transit';

export type SegmentStrokeType = 'solid' | 'dotted' | 'dashed';

type BaseSegmentStroke = {
  id: number;
  color: Color;
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

export class RouteSegment {
  public style: SegmentStyle = {
    strokes: [
      {
        strokeType: 'solid',
        clear: true,
        color: Color.TRANSPARENT,
        id: 0,
        lineCap: 'butt',
        width: 4,
      },
      {
        strokeType: 'solid',
        clear: false,
        color: Color.BLACK,
        id: 1,
        lineCap: 'round',
        width: 3,
      },
    ],
  };
  public specificStyle: SpecificSegmentStyle = { ...DEFALUT_SEGMENT_STYLE };
  constructor(
    public start: SegmentPosition,
    public end: SegmentPosition,
  ) {}

  /** Gets the start position of the segment */
  getStart(): Vector2 {
    return this.start.type === 'vec'
      ? this.start.pos
      : this.start.segment.getPoint(this.start.position, this.start.offset);
  }

  /** Gets the end position of the segment */
  getEnd(): Vector2 {
    return this.end.type === 'vec'
      ? this.end.pos
      : this.end.segment.getPoint(this.end.position, this.end.offset);
  }

  /** Gets the point at a given position along the segment */
  getPoint(position: number, offset: number): Vector2 {
    const start = this.getStart();
    const end = this.getEnd();
    const pos = start.lerp(end, position);
    const normal = end.sub(start).normalize();
    const offsetVector = normal.rotate(Math.PI / 2).mult(offset);

    return pos.add(offsetVector);
  }

  /**
   * If a given segment is to snap to this segment, return true if an infinite
   * loop would be created. We don't like infinite loops as we'd never be able
   * to find the positions of the segments since they reference each other.
   */
  createsLoop(
    segment: RouteSegment,
    visited = new Set<RouteSegment>([segment]),
  ): boolean {
    if (visited.has(this)) return true;
    visited.add(this);
    return (
      (this.end.type === 'snap' &&
        this.end.segment.createsLoop(segment, visited)) ||
      (this.start.type === 'snap' &&
        this.start.segment.createsLoop(segment, visited))
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

    ctx.setStroke(color);
  }

  /** Draws the segment */
  *draw(ctx: DrawingContext): Generator<void> {
    const path = new Path2Dpp();
    path.moveTo(this.getStart());
    path.lineTo(this.getEnd());

    for (const stroke of this.style.strokes) {
      ctx.save();
      this.applyStroke(ctx, stroke);
      ctx.strokePath(path, stroke.clear);
      ctx.restore();
      yield;
    }
  }
}
