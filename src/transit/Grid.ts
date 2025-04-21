import { Color } from '../components/color/Color';
import { Path2Dpp } from '../utils/Path2Dpp';
import { CanvasDrawingContext } from '../utils/drawingContext';
import { mod, round } from '../utils/mathUtils';
import { Vector2 } from '../utils/vec';
import { TransitMap } from './TransitMap';

export class Grid {
  public showGrid = true;
  public gridSize = 100;
  public gridOffset = new Vector2(0, 0);
  public gridSkew = new Vector2(0, 0); // ]π/2, π/2[
  public minor = 3;
  public autoAdjust = true;
  public prevZoom = 1;
  constructor(_transitMap: TransitMap) {}

  draw(ctx: CanvasDrawingContext, zoom: number, offset: Vector2): void {
    this.prevZoom = zoom;
    if (!this.showGrid) return;
    ctx.save();
    ctx.identity();

    const gridSize = this.getGridSize(zoom) * zoom;
    const gridOffset = this.gridOffset.mult(zoom).add(offset);
    const majorPath = new Path2Dpp();
    const minorPath = new Path2Dpp();

    const xdiffT = mod(Math.tan(this.gridSkew.x) * offset.y, gridSize);
    const xdiffB = xdiffT - Math.tan(this.gridSkew.x) * ctx.height;
    const xoff = round(Math.tan(this.gridSkew.x) * ctx.height, gridSize);
    for (
      let x = (gridOffset.x % gridSize) - gridSize * 2 + Math.min(0, xoff);
      x < ctx.width + gridSize + Math.max(0, xoff);
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

    const ydiffT = mod(Math.tan(this.gridSkew.y) * offset.x, gridSize);
    const ydiffB = ydiffT - Math.tan(this.gridSkew.y) * ctx.width;
    const yoff = round(Math.tan(this.gridSkew.y) * ctx.width, gridSize);
    for (
      let y = (gridOffset.y % gridSize) - gridSize * 2 + Math.min(0, yoff);
      y < ctx.height + gridSize + Math.max(0, yoff);
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

  getGridSize(zoom: number = this.prevZoom): number {
    if (this.autoAdjust) {
      return this.gridSize / Math.pow(2, Math.floor(Math.log2(zoom)));
    }
    return this.gridSize;
  }

  toWorldCoords(coords: Vector2): Vector2 {
    // Adjust for skew
    const ySkewOffset = Math.tan(this.gridSkew.x) * coords.y;
    const xSkewOffset = Math.tan(this.gridSkew.y) * coords.x;

    // Calculate world coordinates by:
    // 1. Multiplying grid coordinates by grid size
    // 2. Adding grid offset
    // 3. Adjusting for grid skew
    return new Vector2(
      coords.x + this.gridOffset.x + ySkewOffset,
      coords.y + this.gridOffset.y + xSkewOffset,
    );
  }

  toGridCoords(coords: Vector2): Vector2 {
    // We need to solve the system of equations:
    // x_world = x_grid + gridOffset.x + tan(gridSkew.x) * y_grid
    // y_world = y_grid + gridOffset.y + tan(gridSkew.y) * x_grid

    // First solve for x_grid using the substitution of y_grid from the second equation
    // This gives us x_grid in terms of world coordinates
    const tanSkewX = Math.tan(this.gridSkew.x);
    const tanSkewY = Math.tan(this.gridSkew.y);

    // Formula derived by solving the system of equations
    const xGrid =
      (coords.x -
        this.gridOffset.x -
        tanSkewX * (coords.y - this.gridOffset.y)) /
      (1 - tanSkewX * tanSkewY);

    // Now we can find y_grid by substituting x_grid back
    const yGrid = coords.y - this.gridOffset.y - tanSkewY * xGrid;

    return new Vector2(xGrid, yGrid);
  }

  snapToGrid(coords: Vector2): Vector2 {
    if (!this.showGrid) return coords;
    const gridSize = this.getGridSize() / (this.minor + 1);
    const gridCoords = this.toWorldCoords(coords);
    const rounded = gridCoords.round(gridSize);
    const worldCoords = this.toGridCoords(rounded);
    return worldCoords;
  }
}
