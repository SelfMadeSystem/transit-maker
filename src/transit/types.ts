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

export type ClickInfo = {
  selected: SelectableItem | null;
};

export interface Movable {
  getPos(): Vector2;
  moveTo(l: PosWithKeys): void;
}

export interface Removable {
  remove(): void;
}

export interface Selectable extends Removable {
  isOver(x: number, y: number): boolean;
  drawSelected(ctx: CanvasRenderingContext2D): void;
}

export interface DoubleClickable {
  doubleClick(a: ClickInfo): void;
}

export interface RightClickable {
  rightClick(a: ClickInfo): void;
}

export type SelectableItem = Label | TransitStop | TransitConnection;
