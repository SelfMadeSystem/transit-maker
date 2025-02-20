import { id } from '../utils/id';
import { Vector2 } from '../utils/vec';
import { TransitMap } from './TransitMap';
import { Actionable, Movable, PosWithKeys } from './types';

export class DecorationImage implements Actionable, Movable {
  public id: number = id();
  public image: HTMLImageElement;
  public map: TransitMap;
  public pos: Vector2;
  public scale: number = 1;

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

  getSize() {
    return new Vector2(this.image.width, this.image.height).mult(this.scale);
  }

  draw(ctx: CanvasRenderingContext2D) {
    const size = this.getSize();
    ctx.drawImage(
      this.image,
      this.pos.x - size.x / 2,
      this.pos.y - size.y / 2,
      size.x,
      size.y,
    );
  }

  drawSelected(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    const size = this.getSize();
    ctx.strokeRect(
      this.pos.x - size.x / 2,
      this.pos.y - size.y / 2,
      size.x,
      size.y,
    );
  }

  isOver(x: number, y: number) {
    const size = this.getSize();
    return (
      x >= this.pos.x - size.x / 2 &&
      x <= this.pos.x + size.x / 2 &&
      y >= this.pos.y - size.y / 2 &&
      y <= this.pos.y + size.y / 2
    );
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
}
