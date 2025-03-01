import { Color } from '../components/color/Color';
import { id } from '../utils/id';
import { ConnectionStyle } from './TransitConnection';
import { SavedStyle, TransitMap } from './TransitMap';
import { StopStyle } from './TransitStop';

export type RouteColor = Color | 'route';

export type RouteStyle = {
  color: Color;
  // TODO: Make the styles be shared styles and have option to create a new
  // style for this route
  connectionStyle: SavedStyle<ConnectionStyle>;
  stopStyle: SavedStyle<StopStyle>;
  terminusStyle: SavedStyle<StopStyle>;
  lateralOffset: number;
  roundRadius: number;
  roundDistInstead: boolean; // distance from original instead of radius of circle
  zIndex: number;
  stopZIndex: number;
};

export class TransitRoute {
  public id: number = id();
  public map: TransitMap;
  public name: string;
  public style: RouteStyle;

  constructor(map: TransitMap, name: string, color: Color) {
    this.map = map;
    this.name = name;
    this.style = {
      color,
      connectionStyle: map.defaultConnectionStyle,
      stopStyle: map.defaultStopStyle,
      terminusStyle: map.defaultStopStyle,
      lateralOffset: 5,
      roundRadius: 10,
      roundDistInstead: true,
      zIndex: 0,
      stopZIndex: 1,
    };
    this.map.routes.add(this);
  }
}

// TODO: Some way to make this map-specific
export const createDefaultRoute = (map: TransitMap) => {
  const route = new TransitRoute(map, 'Transfer', Color.WHITE);
  return route;
};
