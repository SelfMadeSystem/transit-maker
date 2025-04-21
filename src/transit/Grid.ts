import { Color } from '../components/color/Color';
import { Path2Dpp } from '../utils/Path2Dpp';
import { CanvasDrawingContext } from '../utils/drawingContext';
import { Vector2 } from '../utils/vec';
import { TransitMap } from './TransitMap';

export class Grid {
  public gridSize = 100;
  public gridOffset = new Vector2(0, 0);
  public gridRotation = new Vector2(0.2, -0.2);
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

    const xdiffT = Math.sin(this.gridRotation.x) * offset.y;
    const xdiffB = Math.sin(this.gridRotation.x) * (offset.y - ctx.height);
    const xadd =
      Math.floor(
        (Math.tan(Math.abs(this.gridRotation.x)) * ctx.height) / gridSize,
      ) * gridSize;
    for (
      let x = (gridOffset.x % gridSize) - gridSize - xadd;
      x < ctx.width + xadd;
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

    const ydiffT = Math.sin(this.gridRotation.y) * offset.x;
    const ydiffB = Math.sin(this.gridRotation.y) * (offset.x - ctx.width);
    const yadd =
      Math.floor(
        (Math.tan(Math.abs(this.gridRotation.y)) * ctx.width) / gridSize,
      ) * gridSize;
    for (
      let y = (gridOffset.y % gridSize) - gridSize - yadd;
      y < ctx.height + yadd;
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
