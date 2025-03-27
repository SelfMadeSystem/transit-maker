import { Color } from '../components/color/Color';
import { TransitMap } from './TransitMap';

export class Route {
  public color: Color = Color.WHITE;
  public name: string;
  public readonly index: number;
  constructor(public readonly map: TransitMap) {
    this.index = map.routes.length;
    this.name = `Route ${this.index + 1}`;
    map.routes.push(this);
  }
}
