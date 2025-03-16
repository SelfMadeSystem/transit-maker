import { Color } from '../components/color/Color';
import { Path2Dpp } from '../utils/Path2Dpp';
import { DrawingContext } from '../utils/drawingContext';
import { Vector2 } from '../utils/vec';
import { Route, SegmentPosition, TransitMap } from './Transit';

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

export class Segment {
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
  constructor(
    public readonly map: TransitMap,
    public route: Route,
    public start: SegmentPosition,
    public end: SegmentPosition,
  ) {
    map.segments.push(this);
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
    ctx.save();
    const path = this.getPath();
    const start = this.getStart();
    const end = this.getEnd();
    ctx.setCtx('fg');

    ctx.setStroke(Color.WHITE);
    ctx.setStrokeWidth(this.style.strokes[0].width + 2);
    ctx.setStrokeDash([2, 3]);
    ctx.setStrokeDashOffset(performance.now() / 100);
    ctx.strokePath(path, false);

    ctx.setStroke(Color.TRANSPARENT);
    ctx.setStrokeDash([]);
    ctx.setStrokeWidth(this.style.strokes[0].width);
    ctx.strokePath(path, true);

    ctx.setStroke(Color.WHITE);
    ctx.setStrokeWidth(2);
    ctx.strokePath(Path2Dpp.circle(start, 5));
    ctx.strokePath(Path2Dpp.circle(end, 5));

    ctx.restore();
  }
}
