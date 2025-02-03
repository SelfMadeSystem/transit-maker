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
  doubleClick(map: TransitMap): void;
}

export interface RightClickable {
  rightClick(map: TransitMap): void;
}

export type SelectableItem = Label | TransitStop | TransitConnection;
