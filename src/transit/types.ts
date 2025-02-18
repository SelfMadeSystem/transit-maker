import { Vector2 } from '../utils/vec';
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
  moveTo(l: PosWithKeys): void;
}

export interface Actionable {
  remove(): void;
  reAdd(): void;
  isOver(x: number, y: number, ctx: CanvasRenderingContext2D): boolean;
  drawSelected(ctx: CanvasRenderingContext2D): void;
  doubleClick?(a: ClickInfo): void;
  rightClick?(a: ClickInfo): void;
}

export type ActionableItem = Label | TransitStop | TransitConnection;
