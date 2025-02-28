import { Vector2 } from '../utils/vec';
import { DecorationImage } from './DecorationImage';
import { Label } from './Label';
import { TransitConnection } from './TransitConnection';
import { TransitStop } from './TransitStop';

export type PosWithKeys = {
  pos: Vector2;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
};

export type ClickInfo = PosWithKeys & {
  selected: ActionableItem | null;
  setSelected: (selected: ActionableItem | null) => void;
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
  reAdd(): void;
  isOver(x: number, y: number, ctx: CanvasRenderingContext2D): boolean;
  drawSelected(ctx: CanvasRenderingContext2D): void;
  doubleClick?(a: ClickInfo): void;
  rightClick?(a: ClickInfo): void;
}

export interface LayeredDrawable {
  draw(ctx: CanvasRenderingContext2D): Generator<void>;
}

export type ActionableItem =
  | Label
  | TransitStop
  | TransitConnection
  | DecorationImage;

export type LayeredDrawableItem = TransitStop | TransitConnection;
