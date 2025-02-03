import { TransitMap } from './TransitMap';
import { TransitRoute } from './TransitRoute';
import { TransitStop } from './TransitStop';
import { DoubleClickable, Drawable, RightClickable, Selectable } from './types';

export type StrokeType = 'solid' | 'dotted' | 'dashed';

// Styles only for this individual connection. Other styles should be specific
// to the route.
export type ConnectionStyle = {
  strokeType: StrokeType;
};

export class TransitConnection
  implements Drawable, Selectable, DoubleClickable, RightClickable
{
  // TODO: Add support for:
  // - split routes (e.g. REM connection between Bois-Franc, Marie-Curie,
  //   Des Sources, and Sunnybrooke; yes, that's a single connection)
  // - multiple connections between the same two stops (e.g. line 11, 12, and 14
  //   between Montréal-Ouest and Lucien-L'Allier)
  // - rounded corners
  // - go behind other lines when there's no stop in between (e.g. line 15 with
  //   lines 11, 12, 14, the text of "De la Savane", and line 2)
  // TODO: Different styles (todo in conjunction with `TransitRoute` since it'll
  // likely house the style information):
  // - Thick line
  // - Thin line
  // - Split (?) line (e.g. REM)
  // - Dotted line (continuation of a line beyond the map)
  // - Dashed line (future line)
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

  draw(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = this.route.color;
    const lineWidth = 2;
    ctx.lineWidth = lineWidth;
    ctx.save();
    ctx.lineCap = 'round';
    switch (this.style.strokeType) {
      case 'solid':
        ctx.setLineDash([]);
        break;
      case 'dotted':
        ctx.setLineDash([0, lineWidth * 2]);
        break;
      case 'dashed':
        ctx.setLineDash([lineWidth * 4, lineWidth * 3]);
        break;
    }
    ctx.beginPath();
    ctx.moveTo(this.from.location.x, this.from.location.y);
    ctx.lineTo(this.to.location.x, this.to.location.y);
    ctx.stroke();
    ctx.restore();
  }

  drawSelected(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.from.location.x, this.from.location.y);
    ctx.lineTo(this.to.location.x, this.to.location.y);
    ctx.stroke();
    ctx.restore();
  }

  isOver(x: number, y: number) {
    const width = 5;
    const x1 = this.from.location.x;
    const y1 = this.from.location.y;
    const x2 = this.to.location.x;
    const y2 = this.to.location.y;

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

  remove(map: TransitMap): void {
    map.removeConnection(this);
  }

  doubleClick(map: TransitMap) {
    map.splitConnection(this);
  }

  rightClick(): void {}

  getAngle(which: TransitStop): number {
    if (which !== this.from && which !== this.to) {
      throw new Error('The stop must be either the from or the to stop');
    }
    return Math.atan2(
      this.to.location.y - this.from.location.y,
      this.to.location.x - this.from.location.x,
    );
  }
}
