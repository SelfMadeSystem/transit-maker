import { Color } from '../components/color/Color';
import { id } from '../utils/id';
import { TransitMap } from './TransitMap';
import { DEFAULT_STOP_STYLE, StopStyle } from './TransitStop';

// The REM has the `split` style. It's very weird, I've never seen it on any other transit map.
export type StrokeType = 'solid' | 'split';

export type RouteStyle = {
  color: Color;
  lineWidth: number;
  strokeType: StrokeType;
  // only for split lines
  innerWidth: number;
  innerColor: Color;
  // only for dotted lines
  dottedWidth: number;
  dottedSpacing: number;
  // only for dashed lines
  dashedWidth: number;
  dashedLength: number;
  dashedSpacing: number;
  dashedLineCap: CanvasLineCap;
  // etc.
  roundRadius: number;
  roundDistInstead: boolean; // distance from original instead of radius of circle
  margin: number;
  stopStyle: StopStyle;
  terminusStyle: StopStyle;
  zIndex: number;
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
      lineWidth: 2,
      strokeType: 'solid',
      innerWidth: 1,
      innerColor: new Color(0, 0, 0),
      dottedWidth: 2,
      dottedSpacing: 5,
      dashedWidth: 2,
      dashedLength: 10,
      dashedSpacing: 5,
      dashedLineCap: 'butt',
      roundRadius: 10,
      roundDistInstead: true,
      margin: 1,
      stopStyle: {
        ...DEFAULT_STOP_STYLE,
      },
      terminusStyle: {
        ...DEFAULT_STOP_STYLE,
      },
      zIndex: 0,
    };
    this.map.routes.add(this);
  }
}

// TODO: Some way to make this map-specific
export const createDefaultRoute = (map: TransitMap) => {
  const route = new TransitRoute(map, 'Transfer', new Color(255, 255, 255));
  return route;
};
