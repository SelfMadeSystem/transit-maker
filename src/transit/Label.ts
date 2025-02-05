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
  public pos: Vector2;
  public stop: TransitStop;
  private cachedDimensions: [tl: Vector2, br: Vector2] | null = null;
  private cacheKey: string | null = null;

  constructor(text: string, pos: Vector2 = new Vector2(0, -15)) {
    this.text = text;
    this.pos = pos;
    this.stop = null as unknown as TransitStop; // should always be set immediately after construction
  }

  getDrawPos(): Vector2 {
    return this.pos.add(this.stop.getDrawPos());
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.getDimensions(ctx);
    ctx.font = LabelFont;
    ctx.fillStyle = 'white';
    const drawPos = this.getDrawPos();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, drawPos.x, drawPos.y);
  }

  getDimensions(ctx: CanvasRenderingContext2D): [Vector2, Vector2] {
    if (this.cacheKey === this.text) {
      return this.cachedDimensions as [Vector2, Vector2];
    }
    ctx.font = LabelFont;
    this.cacheKey = this.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textMetrics = ctx.measureText(this.cacheKey);
    const tl = new Vector2(
      textMetrics.actualBoundingBoxLeft,
      textMetrics.actualBoundingBoxAscent,
    );
    const br = new Vector2(
      textMetrics.actualBoundingBoxRight,
      textMetrics.actualBoundingBoxDescent,
    );
    const dimensions: [Vector2, Vector2] = [tl, br];
    this.cachedDimensions = dimensions;
    return dimensions;
  }

  drawSelected(ctx: CanvasRenderingContext2D) {
    const [tl, br] = this.getDimensions(ctx);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    const topLeft = this.getDrawPos().sub(tl);
    const dimensions = br.add(tl);
    ctx.strokeRect(
      topLeft.x - 2,
      topLeft.y - 2,
      dimensions.x + 4,
      dimensions.y * 2 + 4,
    );
  }

  isOver(x: number, y: number) {
    const dimensions = this.cachedDimensions;
    if (!dimensions) {
      return false;
    }
    const [tl, br] = dimensions;
    const drawPos = this.getDrawPos();
    const topLeft = drawPos.sub(tl);
    const bottomRight = drawPos.add(br);
    return (
      x >= topLeft.x &&
      x <= bottomRight.x &&
      y >= topLeft.y &&
      y <= bottomRight.y
    );
  }

  getPos(): Vector2 {
    return this.pos;
  }

  moveTo({ pos }: PosWithKeys) {
    this.pos = pos;
  }

  remove(): void {
    this.stop.labels.delete(this);
  }

  clone(): Label {
    return new Label(this.text, this.pos);
  }
}
