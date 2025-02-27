import { Vector2 } from './vec';
import SVGPathCommander from 'svg-path-commander';

const pi = Math.PI,
  tau = 2 * pi,
  epsilon = 1e-6,
  tauEpsilon = tau - epsilon;

export class Path2Dpp {
  public x0: number | null = null;
  public y0: number | null = null;
  public x1: number | null = null;
  public y1: number | null = null;
  private path: string = '';
  private svgPath: SVGPathCommander | null = null;

  constructor() {}

  /**
   * Append method to add commands to the path string
   */
  private append(strings: TemplateStringsArray, ...values: number[]): void {
    this.svgPath = null;
    let i = 0;
    for (; i < values.length; ++i) {
      this.path += strings[i] + values[i];
    }
    this.path += strings[i];
  }

  //#region Path methods
  /**
   * Move to a new point (x, y)
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/moveTo}
   */
  moveTo(x: number, y: number): void {
    this.svgPath = null;
    this.append`M${(this.x0 = this.x1 = +x)},${(this.y0 = this.y1 = +y)}`;
  }

  /**
   * Close the current path
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/closePath}
   */
  closePath(): void {
    if (this.x1 !== null) {
      this.x1 = this.x0;
      this.y1 = this.y0;
      this.append`Z`;
    }
  }

  /**
   * Draw a line to a new point (x, y)
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineTo}
   */
  lineTo(x: number, y: number): void {
    this.svgPath = null;
    this.append`L${(this.x1 = +x)},${(this.y1 = +y)}`;
  }

  /**
   * Draw a quadratic curve to a new point (x, y) with control point (cpx, cpy)
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/quadraticCurveTo}
   */
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    this.svgPath = null;
    this.append`Q${+cpx},${+cpy},${(this.x1 = +x)},${(this.y1 = +y)}`;
  }

  /**
   * Draw a bezier curve to a new point (x, y) with control points (cpx1, cpy1) and (cpx2, cpy2)
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/bezierCurveTo}
   */
  bezierCurveTo(
    cpx1: number,
    cpy1: number,
    cpx2: number,
    cpy2: number,
    x: number,
    y: number,
  ): void {
    this.svgPath = null;
    this
      .append`C${+cpx1},${+cpy1},${+cpx2},${+cpy2},${(this.x1 = +x)},${(this.y1 = +y)}`;
  }

  /**
   * Draw an arc to a new point (x2, y2) with radius
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/arcTo}
   */
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
    this.svgPath = null;
    x1 = +x1;
    y1 = +y1;
    x2 = +x2;
    y2 = +y2;
    radius = +radius;

    if (radius < 0) throw new Error(`negative radius: ${radius}`);

    if (this.x1 === null || this.y1 === null) {
      this.append`M${(this.x1 = x1)},${(this.y1 = y1)}`;
      return;
    }

    const x0 = this.x1,
      y0 = this.y1,
      x21 = x2 - x1,
      y21 = y2 - y1,
      x01 = x0 - x1,
      y01 = y0 - y1,
      l01_2 = x01 * x01 + y01 * y01;

    if (!(l01_2 > epsilon)) {
      // Do nothing
    } else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !radius) {
      this.append`L${(this.x1 = x1)},${(this.y1 = y1)}`;
    } else {
      const x20 = x2 - x0,
        y20 = y2 - y0,
        l21_2 = x21 * x21 + y21 * y21,
        l20_2 = x20 * x20 + y20 * y20,
        l21 = Math.sqrt(l21_2),
        l01 = Math.sqrt(l01_2),
        l =
          radius *
          Math.tan(
            (pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2,
          ),
        t01 = l / l01,
        t21 = l / l21;

      if (Math.abs(t01 - 1) > epsilon) {
        this.append`L${x1 + t01 * x01},${y1 + t01 * y01}`;
      }

      this
        .append`A${radius},${radius},0,0,${+(y01 * x20 > x01 * y20)},${(this.x1 = x1 + t21 * x21)},${(this.y1 = y1 + t21 * y21)}`;
    }
  }

  /**
   * Draw an arc with center (x, y), radius, startAngle, endAngle, and optional anticlockwise direction
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/arc}
   */
  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    anticlockwise?: boolean,
  ): void {
    this.svgPath = null;
    anticlockwise = !!anticlockwise;

    if (radius < 0) throw new Error(`negative radius: ${radius}`);

    const dx = radius * Math.cos(startAngle),
      dy = radius * Math.sin(startAngle),
      x0 = x + dx,
      y0 = y + dy,
      cw = 1 ^ +anticlockwise;
    let da = anticlockwise ? startAngle - endAngle : endAngle - startAngle;

    if (this.x1 === null || this.y1 === null) {
      this.append`M${x0},${y0}`;
    } else if (
      Math.abs(this.x1 - x0) > epsilon ||
      Math.abs(this.y1 - y0) > epsilon
    ) {
      this.append`L${x0},${y0}`;
    }

    if (!radius) return;

    if (da < 0) da = (da % tau) + tau;

    if (da > tauEpsilon) {
      this
        .append`A${radius},${radius},0,1,${cw},${x - dx},${y - dy}A${radius},${radius},0,1,${cw},${(this.x1 = x0)},${(this.y1 = y0)}`;
    } else if (da > epsilon) {
      this
        .append`A${radius},${radius},0,${+(da >= pi)},${cw},${(this.x1 = x + radius * Math.cos(endAngle))},${(this.y1 = y + radius * Math.sin(endAngle))}`;
    }
  }

  /**
   * Draw a rectangle with top-left corner (x, y), width w, and height h
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/rect}
   */
  rect(x: number, y: number, w: number, h: number): void {
    this.svgPath = null;
    this
      .append`M${(this.x0 = this.x1 = +x)},${(this.y0 = this.y1 = +y)}h${(w = +w)}v${+h}h${-w}Z`;
  }

  /**
   * Convert the path to a string
   */
  toString(): string {
    return this.path;
  }
  //#endregion

  //#region SVGPathCommander methods
  /**
   * Get the SVGPathCommander instance
   */
  getSVGPath(): SVGPathCommander {
    if (this.svgPath === null) {
      try {
        this.svgPath = new SVGPathCommander(this.toString());
      } catch (e) {
        console.log(this.toString());
        throw e;
      }
    }
    return this.svgPath;
  }

  /**
   * Get the bounding box of the path
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SVGPathElement/getBBox}
   */
  getBBox(): {
    x: number;
    y: number;
    width: number;
    height: number;
    x2: number;
    y2: number;
    cx: number;
    cy: number;
    cz: number;
  } {
    return this.getSVGPath().getBBox();
  }

  /**
   * Get the total length of the path
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SVGPathElement/getTotalLength}
   */
  getTotalLength(): number {
    return this.getSVGPath().getTotalLength();
  }

  /**
   * Get the point at a specific length along the path
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SVGPathElement/getPointAtLength}
   */
  getPointAtLength(length: number): Vector2 {
    const { x, y } = this.getSVGPath().getPointAtLength(length);
    return new Vector2(x, y);
  }

  /**
   * Get the tangent vector at a specific length along the path
   */
  getTangentAtLength(length: number): Vector2 {
    const len = this.getTotalLength();
    const epsilon = len * 1e-5;

    if (length >= len - epsilon) {
      length = len - epsilon;
    }

    const { x, y } = this.getSVGPath().getPointAtLength(length + epsilon);
    const { x: x0, y: y0 } = this.getSVGPath().getPointAtLength(length);
    return new Vector2(x - x0, y - y0).normalize();
  }
  //#endregion

  //#region Extra methods
  /**
   * Converts to a Path2D object
   */
  toPath2D(): Path2D {
    return new Path2D(this.toString());
  }

  /**
   * Converts to a SVGPathElement object
   */
  toSVGPath(): SVGPathElement {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', this.toString());
    return path;
  }
  //#endregion
}
