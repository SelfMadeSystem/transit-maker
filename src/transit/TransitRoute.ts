import { Color } from '../components/color/Color';
import { clone } from '../utils/clone';
import { id } from '../utils/id';
import { ConnectionStyle } from './TransitConnection';
import { TransitMap } from './TransitMap';
import { DEFAULT_STOP_STYLE, StopStyle } from './TransitStop';

export type RouteColor = Color | 'route';

export type RouteStyle = {
  color: Color;
  connectionStyle: ConnectionStyle;
  stopStyle: StopStyle;
  terminusStyle: StopStyle;
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
      connectionStyle: {
        outlines: [
          {
            color: Color.TRANSPARENT,
            width: 4,
            clear: true,
            strokeType: 'solid',
            lineCap: 'butt',
          },
          {
            color: 'route',
            width: 2,
            clear: false,
            strokeType: 'solid',
            lineCap: 'round',
          },
        ],
      },
      lateralOffset: 5,
      roundRadius: 10,
      roundDistInstead: true,
      stopStyle: clone(DEFAULT_STOP_STYLE),
      terminusStyle: clone(DEFAULT_STOP_STYLE),
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
