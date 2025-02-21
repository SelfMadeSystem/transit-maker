import { id } from '../utils/id';
import { Vector2 } from '../utils/vec';
import { isOverTransformable } from './Transformable';
import { TransitMap } from './TransitMap';
import { Actionable, PosWithKeys, Transformable } from './types';

export class DecorationImage implements Transformable, Actionable {
  public id: number = id();
  public image: HTMLImageElement;
  public map: TransitMap;
  public pos: Vector2;
  public scale: Vector2 = new Vector2(1, 1);
  public rotation: number = 0;

  constructor(map: TransitMap, image: HTMLImageElement, pos: Vector2) {
    this.map = map;
    this.image = image;
    this.pos = pos;
    this.reAdd();
  }

  reAdd() {
    this.map.images.add(this);
  }

  remove(): void {
    this.map.images.delete(this);
  }

  getScale(): Vector2 {
    return this.scale;
  }

  setScale(scale: Vector2) {
    this.scale = scale;
  }

  setRotation(angle: number) {
    this.rotation = angle;
  }

  getRotation() {
    return this.rotation;
  }

  getNormalSize(): Vector2 {
    return new Vector2(this.image.width, this.image.height);
  }

  getSize() {
    return new Vector2(this.image.width, this.image.height).mult(
      this.scale.x,
      this.scale.y,
    );
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const size = this.getSize();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.rotation);
    ctx.drawImage(this.image, -size.x / 2, -size.y / 2, size.x, size.y);
    ctx.restore();
  }

  drawSelected(_ctx: CanvasRenderingContext2D) {
    // import('./Transformable.ts').drawTransformableRegion is used instead
    // of this method
    /* ctx.strokeStyle = 'white';
    const size = this.getSize();
    const scale = size.length() / 50;
    ctx.lineWidth = scale;
    ctx.strokeRect(
      this.pos.x - size.x / 2 - scale * 2,
      this.pos.y - size.y / 2 - scale * 2,
      size.x + scale * 4,
      size.y + scale * 4,
    ); */
  }

  isOver(x: number, y: number) {
    return isOverTransformable(this, new Vector2(x, y));
  }

  getPos(): Vector2 {
    return this.pos;
  }

  setPos(pos: Vector2) {
    this.pos = pos;
  }

  getCenterPos(): Vector2 {
    return this.pos;
  }

  setCenterPos(pos: Vector2) {
    this.pos = pos;
  }

  moveTo({ pos }: PosWithKeys) {
    this.pos = pos;
  }
}
