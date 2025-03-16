import { CanvasDrawingContext, DrawingContext } from '../utils/drawingContext';
import { Vector2 } from '../utils/vec';

export type PosWithKeys = {
  pos: Vector2;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
};

export type ClickInfo = PosWithKeys & {
  button: number;
};

export interface Movable extends Actionable {
  getPos(): Vector2;
  setPos(pos: Vector2): void;
  moveTo(l: PosWithKeys): void;
}

export interface Transformable extends Movable {
  getNormalSize(): Vector2;
  getSize(): Vector2;
  getScale(): Vector2;
  setScale(scale: Vector2): void;
  getRotation(): number;
  setRotation(rotation: number): void;
  getCenterPos(): Vector2;
  setCenterPos(pos: Vector2): void;
}

export interface Actionable {
  remove(): void;
  // ctx is just used for getting text size
  isOver(pos: Vector2, ctx: CanvasDrawingContext): boolean;
  drawSelected(ctx: CanvasDrawingContext): void;
  doubleClick?(a: ClickInfo): void;
  singleClick?(a: ClickInfo): void;
}

export interface LayeredDrawable {
  draw(ctx: DrawingContext): Generator<void>;
}
