import { id } from '../utils/id';
import { DEFAULT_STOP_STYLE, StopStyle, TransitStop } from './TransitStop';

// The REM has the `split` style. It's very weird, I've never seen it on any other transit map.
export type StrokeType = 'solid' | 'split';

export type RouteStyle = {
  color: string;
  lineWidth: number;
  strokeType: StrokeType;
  innerWidth: number; // only for split lines
  dottedWidth: number; // only for dotted lines
  dashedWidth: number; // only for dashed lines
  margin: number;
  stopStyle: StopStyle;
};

export class TransitRoute {
  public id: number = id();
  public name: string;
  public stops: Set<TransitStop>;
  public style: RouteStyle;

  constructor(name: string, color: string) {
    this.name = name;
    this.style = {
      color,
      lineWidth: 2,
      strokeType: 'solid',
      innerWidth: 1,
      dottedWidth: 2,
      dashedWidth: 2,
      margin: 1,
      stopStyle: {
        ...DEFAULT_STOP_STYLE,
      },
    };
    this.stops = new Set();
  }

  addStop(stop: TransitStop) {
    this.stops.add(stop);
  }
}

// TODO: Some way to make this map-specific
export const TRANSFER_ROUTE = new TransitRoute('Transfer', 'white');
