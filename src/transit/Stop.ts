import { Color } from '../components/color/Color';
import { Path2Dpp } from '../utils/Path2Dpp';
import { DrawingContext } from '../utils/drawingContext';
import { Vector2 } from '../utils/vec';
import { SegmentPosition } from './SegmentPosition';

export class Stop {
  constructor(public pos: SegmentPosition) {}

  getPoint(): Vector2 {
    return this.pos.getPoint();
  }

  getPath(): Path2Dpp {
    const path = new Path2Dpp();
    path.arc(this.getPoint(), 5, 0, Math.PI * 2);
    return path;
  }

  draw(ctx: DrawingContext): void {
    ctx.setFill(Color.WHITE);
    ctx.fillPath(this.getPath());
  }
}
