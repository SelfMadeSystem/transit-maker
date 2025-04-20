import { Color } from '../components/color/Color';
import { Path2Dpp } from '../utils/Path2Dpp';
import { CanvasDrawingContext } from '../utils/drawingContext';
import { Vector2 } from '../utils/vec';
import { TransitMap } from './TransitMap';

export class Grid {
  public gridSize = 20;
  public gridOffset = new Vector2(0, 0);
  public minor: number = 3;
  constructor(_transitMap: TransitMap) {}

  draw(ctx: CanvasDrawingContext, zoom: number, offset: Vector2): void {
    ctx.save();
    ctx.identity();

    const gridSize = this.gridSize * zoom;
    const gridOffset = this.gridOffset.mult(zoom).add(offset);
    const majorPath = new Path2Dpp();
    const minorPath = new Path2Dpp();

    for (
      let x = (gridOffset.x % gridSize) - gridSize;
      x < ctx.width;
      x += gridSize
    ) {
      majorPath.moveTo(new Vector2(x, 0));
      majorPath.lineTo(new Vector2(x, ctx.height));

      for (let x1 = 1; x1 <= this.minor; x1++) {
        minorPath.moveTo(
          new Vector2(x + (gridSize / (this.minor + 1)) * x1, 0),
        );
        minorPath.lineTo(
          new Vector2(x + (gridSize / (this.minor + 1)) * x1, ctx.height),
        );
      }
    }

    for (
      let y = (gridOffset.y % gridSize) - gridSize;
      y < ctx.height;
      y += gridSize
    ) {
      majorPath.moveTo(new Vector2(0, y));
      majorPath.lineTo(new Vector2(ctx.width, y));

      for (let y1 = 1; y1 <= this.minor; y1++) {
        minorPath.moveTo(
          new Vector2(0, y + (gridSize / (this.minor + 1)) * y1),
        );
        minorPath.lineTo(
          new Vector2(ctx.width, y + (gridSize / (this.minor + 1)) * y1),
        );
      }
    }

    ctx.setStroke(Color.WHITE);
    ctx.setStrokeWidth(1);
    ctx.strokePath(majorPath);

    if (zoom > 1.5) {
      ctx.setStroke(Color.WHITE.withAlpha(0.5));
      ctx.setStrokeWidth(1);
      ctx.strokePath(minorPath);
    }

    ctx.restore();
  }
}
