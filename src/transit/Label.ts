import { Color } from '../components/color/Color';
import { id } from '../utils/id';
import { Vector2 } from '../utils/vec';
import { isOverTransformable } from './Transformable';
import { TransitMap } from './TransitMap';
import { TransitStop } from './TransitStop';
import { Actionable, PosWithKeys, Transformable } from './types';

export type LabelStyle = {
  font: string;
  italic: boolean;
  size: number;
  weight: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  color: Color;
  margin: number;
};

export class Label implements Transformable, Actionable {
  // TODO: Add support for:
  // - text formatting (e.g. bold for important/transfer stations)
  // - line icon identifier (e.g. blue circle with white "5" for line 5 in Montreal)
  // - connection icon (e.g. airport, intercity rail, etc.)
  // - other icons (e.g. wheelchair accessible, parking, etc.)
  public id: number = id();
  public map: TransitMap;
  public text: string;
  public pos: Vector2;
  public scale: Vector2 = new Vector2(1, 1);
  public rotation: number = 0;
  public stop: TransitStop | null;
  public style: LabelStyle = {
    font: 'Roboto',
    italic: false,
    size: 10,
    weight: '400',
    textAlign: 'left',
    textBaseline: 'middle',
    color: new Color(255, 255, 255),
    margin: 0.5,
  };
  private cachedDimensions: [tl: Vector2, br: Vector2] | null = null;
  private cacheKey: string | null = null;

  constructor(
    map: TransitMap,
    text: string,
    pos: Vector2 = new Vector2(0, -15),
  ) {
    this.map = map;
    this.text = text;
    this.pos = pos;
    this.stop = null;
    this.reAdd();
  }

  reAdd() {
    this.map.labels.add(this);
    this.stop?.labels.add(this);
  }

  remove(): void {
    this.map.labels.delete(this);
    this.stop?.labels.delete(this);
  }

  disconnectFromStop() {
    const drawPos = this.getDrawPos();
    this.pos = drawPos;
    this.stop = null;
  }

  connectToStop(stop: TransitStop) {
    const stopPos = stop.getDrawPos();
    this.pos = this.pos.sub(stopPos);
    this.stop = stop;
  }

  getDrawPos(): Vector2 {
    if (!this.stop) {
      return this.pos;
    }
    return this.pos.add(this.stop.getDrawPos());
  }

  setDrawPos(pos: Vector2) {
    if (!this.stop) {
      this.pos = pos;
    } else {
      this.pos = pos.sub(this.stop.getDrawPos());
    }
  }

  getFont() {
    return `${this.style.italic ? 'italic' : ''} ${this.style.weight} ${
      this.style.size
    }px '${this.style.font}'`;
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.getDimensions(ctx);
    ctx.save();
    const drawPos = this.getDrawPos();
    ctx.translate(drawPos.x, drawPos.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.scale.x, this.scale.y);
    ctx.font = this.getFont();
    ctx.fillStyle = this.style.color.hex();
    ctx.textAlign = this.style.textAlign;
    ctx.textBaseline = this.style.textBaseline;

    if (this.style.margin > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = this.style.margin * 2;
      ctx.strokeText(this.text, 0, 0);
      ctx.restore();
    }

    ctx.fillText(this.text, 0, 0);
    ctx.restore();
  }

  getDimensions(ctx: CanvasRenderingContext2D): [Vector2, Vector2] {
    const key =
      this.text +
      this.style.font +
      this.style.size +
      this.style.weight +
      this.style.italic +
      this.style.textAlign +
      this.style.textBaseline;
    if (this.cacheKey === key) {
      return this.cachedDimensions as [Vector2, Vector2];
    }
    ctx.font = this.getFont();
    this.cacheKey = key;
    ctx.textAlign = this.style.textAlign;
    ctx.textBaseline = this.style.textBaseline;
    const textMetrics = ctx.measureText(this.text);
    const tl = new Vector2(
      textMetrics.actualBoundingBoxLeft,
      textMetrics.fontBoundingBoxAscent,
    );
    const br = new Vector2(
      textMetrics.actualBoundingBoxRight,
      textMetrics.fontBoundingBoxDescent,
    );
    const dimensions: [Vector2, Vector2] = [tl, br];
    this.cachedDimensions = dimensions;
    return dimensions;
  }

  drawSelected(_: CanvasRenderingContext2D) {
    // const [tl, br] = this.getDimensions(ctx);
    // ctx.strokeStyle = 'white';
    // ctx.lineWidth = 1;
    // const topLeft = this.getDrawPos().sub(tl);
    // const dimensions = br.add(tl);
    // ctx.strokeRect(
    //   topLeft.x - 2,
    //   topLeft.y - 2,
    //   dimensions.x + 4,
    //   dimensions.y + 4,
    // );
  }

  isOver(x: number, y: number) {
    return isOverTransformable(this, new Vector2(x, y));
  }

  private getCenterOffset(): Vector2 {
    const offset = { x: 0, y: 0 };

    const dimensions = this.cachedDimensions;
    if (!dimensions) {
      return new Vector2(offset.x, offset.y);
    }

    const [tl, br] = dimensions;

    offset.x += (br.x - tl.x) / 2;
    offset.y += (br.y - tl.y) / 2;

    return new Vector2(offset.x, offset.y)
      .mult(this.scale.x, this.scale.y)
      .rotateBy(this.rotation);
  }

  getCenterPos(): Vector2 {
    return this.getDrawPos().add(this.getCenterOffset());
  }

  setCenterPos(pos: Vector2) {
    this.setDrawPos(pos.sub(this.getCenterOffset()));
  }

  getScale(): Vector2 {
    return this.scale;
  }

  setScale(scale: Vector2) {
    this.scale = scale;
  }

  setRotation(angle: number) {
    const center = this.getCenterPos();
    this.rotation = angle;
    this.setCenterPos(center);
  }

  getRotation() {
    return this.rotation;
  }

  getNormalSize(): Vector2 {
    const dimensions = this.cachedDimensions;
    if (!dimensions) {
      return new Vector2(10, 10);
    }
    const [tl, br] = dimensions;
    return br.add(tl);
  }

  getSize() {
    return this.getNormalSize().mult(this.scale.x, this.scale.y);
  }

  getPos(): Vector2 {
    return this.pos;
  }

  setPos(pos: Vector2) {
    this.pos = pos;
  }

  moveTo({ pos }: PosWithKeys) {
    this.pos = pos;
  }

  inheritStyle(label: Label) {
    this.style = { ...label.style };
    this.rotation = label.rotation;
    this.scale = label.scale;
  }
}
