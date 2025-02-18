import { id } from '../utils/id';
import { TransitMap } from './TransitMap';
import { DEFAULT_STOP_STYLE, StopStyle } from './TransitStop';

// The REM has the `split` style. It's very weird, I've never seen it on any other transit map.
export type StrokeType = 'solid' | 'split';

export type RouteStyle = {
  color: string;
  lineWidth: number;
  strokeType: StrokeType;
  innerWidth: number; // only for split lines
  dottedWidth: number; // only for dotted lines
  dashedWidth: number; // only for dashed lines
  roundRadius: number;
  margin: number;
  stopStyle: StopStyle;
  terminusStyle: StopStyle;
};

export class TransitRoute {
  public id: number = id();
  public map: TransitMap;
  public name: string;
  public style: RouteStyle;

  constructor(map: TransitMap, name: string, color: string) {
    this.map = map;
    this.name = name;
    this.style = {
      color,
      lineWidth: 2,
      strokeType: 'solid',
      innerWidth: 1,
      dottedWidth: 2,
      dashedWidth: 2,
      roundRadius: 10,
      margin: 1,
      stopStyle: {
        ...DEFAULT_STOP_STYLE,
      },
      terminusStyle: {
        ...DEFAULT_STOP_STYLE,
      },
    };
    this.map.routes.add(this);
  }
}

// TODO: Some way to make this map-specific
export const createDefaultRoute = (map: TransitMap) => {
  const route = new TransitRoute(map, 'Transfer', 'white');
  route.style.roundRadius = 0;
  route.style.margin = 0;
  return route;
};
