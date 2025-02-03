import {
  DEFAULT_STOP_STYLE,
  TransitStopStyle as StopStyle,
  TransitStop,
} from './TransitStop';

// The REM has the `split` style. It's very weird, I've never seen it on any other transit map.
export type StrokeType = 'solid' | 'split';

export type RouteStyle = {
  color: string;
  lineWidth: number;
  strokeType: StrokeType;
  innerWidth: number; // only for split lines
  stopStyle: StopStyle;
};

export class TransitRoute {
  // TODO: Add support for:
  // - different styles (as mentioned in `TransitConnection`)
  // - idk what else
  public name: string;
  public stops: Set<TransitStop>;
  public style: RouteStyle;

  constructor(name: string, color: string) {
    this.name = name;
    this.style = {
      color,
      lineWidth: 5,
      strokeType: 'split',
      innerWidth: 1,
      stopStyle: {
        ...DEFAULT_STOP_STYLE,
        radius: 2,
        strokeColor: '#0000',
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
