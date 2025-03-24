import { CanvasDrawingContext, DrawingContext } from '../utils/drawingContext';
import { Vector2 } from '../utils/vec';

export type ClickType = 'single' | 'double';
export type ClickButton = 'left' | 'middle' | 'right';

export type PosWithKeys = {
  pos: Vector2;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  clickType: ClickType;
  button: ClickButton;
};

export const eventToPosWithKeys = (
  e: MouseEvent,
  pos: Vector2,
): PosWithKeys => ({
  pos,
  shiftKey: e.shiftKey,
  ctrlKey: e.ctrlKey,
  altKey: e.altKey,
  clickType: e.detail === 2 ? 'double' : 'single',
  button: e.button === 0 ? 'left' : e.button === 1 ? 'middle' : 'right',
});

export type ClickInfo = PosWithKeys; // i might add more stuff to this later
export type DragInfo = {
  start: Vector2;
  end: Vector2;
  delta: Vector2;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  clickType: ClickType;
  button: ClickButton;
};

export const eventToDragInfo = (
  e: MouseEvent,
  start: Vector2,
  end: Vector2,
  delta: Vector2,
): DragInfo => ({
  start,
  end,
  delta,
  shiftKey: e.shiftKey,
  ctrlKey: e.ctrlKey,
  altKey: e.altKey,
  clickType: e.detail === 2 ? 'double' : 'single',
  button: e.button === 0 ? 'left' : e.button === 1 ? 'middle' : 'right',
});

export interface Transformable {
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
  getZIndex(): number;
  onClick?(a: ClickInfo): void;
  onDrag?(a: DragInfo): void;
  onDragEnd?(a: DragInfo): void;
  draw(ctx: DrawingContext): Generator<void>;
}
