import { Color } from '../components/color/Color';
import { TransitMap } from './TransitMap';

export class Route {
  public color: Color = Color.WHITE;
  public readonly index: number;
  constructor(public readonly map: TransitMap) {
    this.index = map.routes.length;
    map.routes.push(this);
  }
}
