import { Color } from '../components/color/Color';
import { Path2Dpp } from '../utils/Path2Dpp';
import { CanvasDrawingContext } from '../utils/drawingContext';
import { mod, round } from '../utils/mathUtils';
import { Vector2 } from '../utils/vec';
import { TransitMap } from './TransitMap';

export class Grid {
  public gridSize = 100;
  public gridOffset = new Vector2(0, 0);
  public gridRotation = new Vector2(0, 0); // ]π/2, π/2[
  public minor = 3;
  public autoAdjust = true;
  constructor(_transitMap: TransitMap) {}

  draw(ctx: CanvasDrawingContext, zoom: number, offset: Vector2): void {
    ctx.save();
    ctx.identity();

    let gridSize = this.gridSize * zoom;
    if (this.autoAdjust) {
      gridSize /= Math.pow(2, Math.floor(Math.log2(zoom)));
    }
    const gridOffset = this.gridOffset.mult(zoom).add(offset);
    const majorPath = new Path2Dpp();
    const minorPath = new Path2Dpp();

    const xdiffT = mod(Math.tan(this.gridRotation.x) * offset.y, gridSize);
    const xdiffB = xdiffT - Math.tan(this.gridRotation.x) * ctx.height;
    const xoff = round(Math.tan(this.gridRotation.x) * ctx.height, gridSize);
    for (
      let x = (gridOffset.x % gridSize) - gridSize + Math.min(0, xoff);
      x < ctx.width + Math.max(0, xoff);
      x += gridSize
    ) {
      majorPath.moveTo(new Vector2(x + xdiffT, 0));
      majorPath.lineTo(new Vector2(x + xdiffB, ctx.height));

      for (let x1 = 1; x1 <= this.minor; x1++) {
        minorPath.moveTo(
          new Vector2(x + (gridSize / (this.minor + 1)) * x1 + xdiffT, 0),
        );
        minorPath.lineTo(
          new Vector2(
            x + (gridSize / (this.minor + 1)) * x1 + xdiffB,
            ctx.height,
          ),
        );
      }
    }

    const ydiffT = mod(Math.tan(this.gridRotation.y) * offset.x, gridSize);
    const ydiffB = ydiffT - Math.tan(this.gridRotation.y) * ctx.width;
    const yoff = round(Math.tan(this.gridRotation.y) * ctx.width, gridSize);
    for (
      let y = (gridOffset.y % gridSize) - gridSize + Math.min(0, yoff);
      y < ctx.height + Math.max(0, yoff);
      y += gridSize
    ) {
      majorPath.moveTo(new Vector2(0, y + ydiffT));
      majorPath.lineTo(new Vector2(ctx.width, y + ydiffB));

      for (let y1 = 1; y1 <= this.minor; y1++) {
        minorPath.moveTo(
          new Vector2(0, y + (gridSize / (this.minor + 1)) * y1 + ydiffT),
        );
        minorPath.lineTo(
          new Vector2(
            ctx.width,
            y + (gridSize / (this.minor + 1)) * y1 + ydiffB,
          ),
        );
      }
    }

    ctx.setStroke(Color.WHITE.withAlpha(0.7));
    ctx.setStrokeWidth(1);
    ctx.strokePath(majorPath);

    ctx.setStroke(Color.WHITE.withAlpha(0.4));
    ctx.setStrokeWidth(1);
    ctx.strokePath(minorPath);

    ctx.restore();
  }
}
