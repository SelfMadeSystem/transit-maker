import { Label } from './Label';
import { TransitConnection } from './TransitConnection';
import { TransitMap } from './TransitMap';
import { TransitStop } from './TransitStop';

export type GeoLocation = {
  x: number;
  y: number;
};

export type LocationWithKeys = GeoLocation & {
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
};

export type ClickInfo = {
  map: TransitMap;
  selected: SelectableItem | null;
};

export interface Movable {
  getLocation(): GeoLocation;
  moveTo(l: LocationWithKeys): void;
}

export interface Removable {
  remove(map: TransitMap): void;
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
