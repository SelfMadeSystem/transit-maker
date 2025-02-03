import { TransitStop } from './TransitStop';

export class TransitRoute {
  // TODO: Add support for:
  // - different styles (as mentioned in `TransitConnection`)
  // - idk what else
  public name: string;
  public color: string;
  public stops: Set<TransitStop>;

  constructor(name: string, color: string) {
    this.name = name;
    this.color = color;
    this.stops = new Set();
  }

  addStop(stop: TransitStop) {
    this.stops.add(stop);
  }
}
