import { id } from '../utils/id';
import { TransitMap } from './TransitMap';
import { DEFAULT_STOP_STYLE, StopStyle, TransitStop } from './TransitStop';
import { z } from 'zod';

// The REM has the `split` style. It's very weird, I've never seen it on any other transit map.
export const RouteStyle = z.object({
  color: z.string(),
  lineWidth: z.number(),
  strokeType: z.enum(['solid', 'split']),
  innerWidth: z.number(), // only for split lines
  dottedWidth: z.number(), // only for dotted lines
  dashedWidth: z.number(), // only for dashed lines
  roundRadius: z.number(),
  margin: z.number(),
  stopStyle: StopStyle,
  terminusStyle: StopStyle,
});

export type RouteStyle = z.infer<typeof RouteStyle>;
export type StrokeType = RouteStyle['strokeType'];

export const SerializedRoute = z.object({
  id: z.number(),
  name: z.string(),
  style: RouteStyle,
});
export type SerializedRoute = z.infer<typeof SerializedRoute>;

export class TransitRoute {
  public id: number = id();
  public map: TransitMap;
  public name: string;
  public stops: Set<TransitStop>;
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
    this.stops = new Set();
    this.map.routes.add(this);
  }

  addStop(stop: TransitStop) {
    this.stops.add(stop);
  }

  removeStop(stop: TransitStop) {
    this.stops.delete(stop);
  }

  serialize(): SerializedRoute {
    return {
      id: this.id,
      name: this.name,
      style: this.style,
    };
  }
}

// TODO: Some way to make this map-specific
export const createDefaultRoute = (map: TransitMap) => {
  const route = new TransitRoute(map, 'Transfer', 'white');
  route.style.roundRadius = 0;
  route.style.margin = 0;
  return route;
};
