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
};

export interface Movable extends Actionable {
  getPos(): Vector2;
  setPos(pos: Vector2): void;
  moveTo(l: PosWithKeys): void;
}

export interface Transformable extends Movable {
  scaleBy(s: number): void;
  rotateBy(angle: number): void;
  getSize(): Vector2;
  getRotation(): number;
  /**
   * Center of the object
   */
  getPos(): Vector2;
}

export interface Actionable {
  remove(): void;
  reAdd(): void;
  isOver(x: number, y: number, ctx: CanvasRenderingContext2D): boolean;
  drawSelected(ctx: CanvasRenderingContext2D): void;
  doubleClick?(a: ClickInfo): void;
  rightClick?(a: ClickInfo): void;
}

export type ActionableItem =
  | Label
  | TransitStop
  | TransitConnection
  | DecorationImage;
