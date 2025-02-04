import { id } from '../utils/id';
import { Vector2 } from '../utils/vec';
import { SnapLine } from './Snapping';
import { TransitMap } from './TransitMap';
import { TransitRoute } from './TransitRoute';
import { TransitStop } from './TransitStop';
import {
  ClickInfo,
  DoubleClickable,
  RightClickable,
  Selectable,
} from './types';

export type ConnectionStrokeType = 'solid' | 'dotted' | 'dashed';

// Styles only for this individual connection. Other styles should be specific
// to the route.
export type ConnectionStyle = {
  strokeType: ConnectionStrokeType;
};

export class TransitConnection
  implements Selectable, DoubleClickable, RightClickable
{
  public id: number = id();
  // TODO: Add support for:
  // - split routes (e.g. REM connection between Bois-Franc, Marie-Curie,
  //   Des Sources, and Sunnybrooke; yes, that's a single connection)
  // - multiple connections between the same two stops (e.g. line 11, 12, and 14
  //   between Montréal-Ouest and Lucien-L'Allier)
  // - rounded corners
  // - go behind other lines when there's no stop in between (e.g. line 15 with
  //   lines 11, 12, 14, the text of "De la Savane", and line 2)
  public from: TransitStop;
  public to: TransitStop;
  public route: TransitRoute;
  public style: ConnectionStyle = {
    strokeType: 'solid',
  };

  constructor(from: TransitStop, to: TransitStop, route: TransitRoute) {
    this.from = from;
    this.to = to;
    this.route = route;
  }

  getOtherStop(stop: TransitStop) {
    return stop === this.from ? this.to : this.from;
  }

  draw(ctx: CanvasRenderingContext2D): void | {
    postDraw: () => void;
  } {
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
    ctx.beginPath();
    ctx.moveTo(this.from.pos.x, this.from.pos.y);
    ctx.lineTo(this.to.pos.x, this.to.pos.y);
    if (this.route.style.margin > 0) {
      ctx.lineWidth = lineWidth + this.route.style.margin * 2;
      ctx.strokeStyle = '#000';
      ctx.stroke();
    }
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = this.route.style.color;
    ctx.stroke();
    ctx.restore();

    if (
      this.route.style.strokeType === 'split' &&
      this.style.strokeType === 'solid'
    ) {
      return {
        postDraw: () => {
          ctx.save();
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(this.from.pos.x, this.from.pos.y);
          ctx.lineTo(this.to.pos.x, this.to.pos.y);
          ctx.lineWidth = this.route.style.innerWidth;
          ctx.strokeStyle = '#000';
          ctx.stroke();
          ctx.restore();
        },
      };
    }
  }

  drawSelected(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = 'white';
    ctx.lineWidth =
      this.route.style.lineWidth + this.route.style.margin * 2 + 2;
    ctx.beginPath();
    ctx.moveTo(this.from.pos.x, this.from.pos.y);
    ctx.lineTo(this.to.pos.x, this.to.pos.y);
    ctx.stroke();
    ctx.restore();
  }

  isOver(x: number, y: number) {
    const width = 5;
    const x1 = this.from.pos.x;
    const y1 = this.from.pos.y;
    const x2 = this.to.pos.x;
    const y2 = this.to.pos.y;

    const withinBoundingBox =
      Math.min(x1, x2) <= x + width &&
      x <= Math.max(x1, x2) + width &&
      Math.min(y1, y2) <= y + width &&
      y <= Math.max(y1, y2) + width;

    if (!withinBoundingBox) {
      return false;
    }

    const distance = Math.abs(
      (y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1,
    );
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    return distance / length < width;
  }

  getAngle(which: TransitStop): number {
    if (which !== this.from && which !== this.to) {
      throw new Error('The stop must be either the from or the to stop');
    }
    const from = which;
    const to = this.getOtherStop(from);
    return Math.atan2(to.pos.y - from.pos.y, to.pos.x - from.pos.x);
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

    return [
      ...snapLines,
      new SnapLine(other.pos, new Vector2(1, 0), 2),
      new SnapLine(other.pos, new Vector2(0, 1), 2),
      new SnapLine(other.pos, new Vector2(1, 1).normalize(), 3),
      new SnapLine(other.pos, new Vector2(1, -1).normalize(), 3),
    ];
  }

  remove(map: TransitMap): void {
    map.removeConnection(this);
  }

  doubleClick({ map }: ClickInfo): void {
    map.splitConnection(this);
  }

  rightClick(): void {}
}
