import { Vector2 } from '../utils/vec';
import { TransitStop } from './TransitStop';
import { Movable, PosWithKeys, Selectable } from './types';

const LabelFont = '10px sans-serif';

export class Label implements Selectable, Movable {
  // TODO: Add support for:
  // - text formatting (e.g. bold for important/transfer stations)
  // - line icon identifier (e.g. blue circle with white "5" for line 5 in Montreal)
  // - connection icon (e.g. airport, intercity rail, etc.)
  // - other icons (e.g. wheelchair accessible, parking, etc.)
  public text: string;
  public x: number;
  public y: number;
  public stop: TransitStop;
  private cachedDimensions: TextMetrics | null = null;
  private cacheKey: string | null = null;

  constructor(text: string, x: number = 0, y: number = -15) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.stop = null as unknown as TransitStop; // should always be set immediately after construction
  }

  draw(ctx: CanvasRenderingContext2D) {
    {
      this.getDimensions(ctx);
      // const dimensions = this.getDimensions(ctx);
      // const x = this.x + this.stop.pos.x - dimensions.width / 2;
      // const y =
      //   this.y + this.stop.pos.y - dimensions.actualBoundingBoxAscent;
      // ctx.fillStyle = "black";
      // ctx.fillRect(
      //   x - 2,
      //   y - 2,
      //   dimensions.width + 4,
      //   dimensions.actualBoundingBoxAscent * 2 + 4
      // );
    }
    {
      ctx.font = LabelFont;
      ctx.fillStyle = 'white';
      const stopPos = this.stop.getDrawPos();
      const x = this.x + stopPos.x;
      const y = this.y + stopPos.y;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.text, x, y);
    }
  }

  getDimensions(ctx: CanvasRenderingContext2D) {
    ctx.font = LabelFont;
    if (this.cacheKey !== this.text) {
      this.cacheKey = this.text;
    }
    return (this.cachedDimensions = ctx.measureText(this.cacheKey));
  }

  drawSelected(ctx: CanvasRenderingContext2D) {
    const dimensions = this.getDimensions(ctx);
    const x = this.x + this.stop.pos.x - dimensions.width / 2;
    const y = this.y + this.stop.pos.y - dimensions.actualBoundingBoxAscent;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      x - 2,
      y - 2,
      dimensions.width + 4,
      dimensions.actualBoundingBoxAscent * 2 + 4,
    );
  }

  isOver(x: number, y: number) {
    const dimensions = this.cachedDimensions;
    if (!dimensions) {
      return false;
    }
    const x1 = this.x + this.stop.pos.x - dimensions.width / 2;
    const y1 = this.y + this.stop.pos.y - dimensions.actualBoundingBoxAscent;
    const x2 = x1 + dimensions.width;
    const y2 = y1 + dimensions.actualBoundingBoxAscent * 2;
    return x >= x1 && x <= x2 && y >= y1 && y <= y2;
  }

  getPos(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  moveTo({ pos: { x, y } }: PosWithKeys) {
    this.x = x;
    this.y = y;
  }

  remove(): void {
    this.stop.labels.delete(this);
  }

  clone(): Label {
    return new Label(this.text, this.x, this.y);
  }
}
