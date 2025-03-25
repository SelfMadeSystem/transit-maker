import { SvgPath } from './svg/svgPath';
import { Vector2 } from './vec';

const pi = Math.PI,
  tau = 2 * pi,
  epsilon = 1e-6,
  tauEpsilon = tau - epsilon;

type Vector2OrNumber = Vector2 | unknown;

type ExtractedTuple<T extends Vector2OrNumber[]> = {
  [K in keyof T]: T[K] extends Vector2 ? [number, number] : T[K];
};

type Flatten<T extends (Vector2OrNumber | unknown)[]> = T extends [
  infer First,
  ...infer Rest,
]
  ? First extends Vector2OrNumber[]
    ? [...First, ...Flatten<Rest>]
    : [First, ...Flatten<Rest>]
  : [];

function extractArgs<T extends Vector2OrNumber[]>(
  args: T,
): Flatten<ExtractedTuple<T>> {
  const flatten = (arr: Vector2OrNumber[]) =>
    arr.reduce<unknown[]>((acc, val) => {
      if (val instanceof Vector2) {
        acc.push(val.x, val.y);
      } else {
        acc.push(val);
      }
      return acc;
    }, []);

  return flatten(args) as Flatten<ExtractedTuple<T>>;
}

export class Path2Dpp {
  public x0: number | null = null;
  public y0: number | null = null;
  public x1: number | null = null;
  public y1: number | null = null;
  private path: string = '';
  private svgPath: SvgPath | null = null;

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

  //#region Custom path methods
  /**
   * Svg-style arc method
   */
  arcSvg(
    radii: Vector2,
    rotation: number,
    largeArcFlag: boolean,
    sweepFlag: boolean,
    end: Vector2,
  ): void {
    this
      .append`A${radii.x},${radii.y},${rotation},${+largeArcFlag},${+sweepFlag},${(this.x1 = end.x)},${(this.y1 = end.y)}`;
  }
  //#endregion

  //#region Path methods
  /**
   * Move to a new point (x, y)
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/moveTo}
   */
  moveTo(vec: Vector2): void;
  moveTo(x: number, y: number): void;
  moveTo(...args: [Vector2] | [number, number]): void {
    const [x, y] = extractArgs(args);

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
  lineTo(vec: Vector2): void;
  lineTo(x: number, y: number): void;
  lineTo(...args: [Vector2] | [number, number]): void {
    const [x, y] = extractArgs(args);

    this.append`L${(this.x1 = +x)},${(this.y1 = +y)}`;
  }

  /**
   * Draw a quadratic curve to a new point (x, y) with control point (cpx, cpy)
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/quadraticCurveTo}
   */
  quadraticCurveTo(cp: Vector2, x: Vector2): void;
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
  quadraticCurveTo(
    ...args: [Vector2, Vector2] | [number, number, number, number]
  ): void {
    const [cpx, cpy, x, y] = extractArgs(args);

    this.append`Q${+cpx},${+cpy},${(this.x1 = +x)},${(this.y1 = +y)}`;
  }

  /**
   * Draw a bezier curve to a new point (x, y) with control points (cpx1, cpy1) and (cpx2, cpy2)
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/bezierCurveTo}
   */
  bezierCurveTo(cp1: Vector2, cp2: Vector2, x: Vector2): void;
  bezierCurveTo(
    cpx1: number,
    cpy1: number,
    cpx2: number,
    cpy2: number,
    x: number,
    y: number,
  ): void;
  bezierCurveTo(
    ...args:
      | [Vector2, Vector2, Vector2]
      | [number, number, number, number, number, number]
  ): void {
    const [cpx1, cpy1, cpx2, cpy2, x, y] = extractArgs(args);

    this
      .append`C${+cpx1},${+cpy1},${+cpx2},${+cpy2},${(this.x1 = +x)},${(this.y1 = +y)}`;
  }

  /**
   * Draw an arc to a new point (x2, y2) with radius
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/arcTo}
   */
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void;
  arcTo(p1: Vector2, p2: Vector2, radius: number): void;
  arcTo(
    ...args:
      | [Vector2, Vector2, number]
      | [number, number, number, number, number]
  ): void {
    const [x1, y1, x2, y2, radius] = extractArgs(args);

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
  //@ts-expect-error - TypeScript is stupid; the signatures *should* match
  arc(
    center: Vector2,
    radius: number,
    startAngle: number,
    endAngle: number,
    anticlockwise?: boolean,
  ): void;
  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    anticlockwise?: boolean,
  ): void;
  arc(
    ...args:
      | [Vector2, number, number, number, boolean | undefined]
      | [number, number, number, number, number, boolean | undefined]
  ): void {
    const res = extractArgs(args);
    const [x, y, radius, startAngle, endAngle] = res;
    const anticlockwise = !!res[5];

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
  rect(corner: Vector2, size: Vector2): void;
  rect(x: number, y: number, w: number, h: number): void;
  rect(...args: [Vector2, Vector2] | [number, number, number, number]): void {
    const [x, y, w, h] = extractArgs(args);

    this
      .append`M${(this.x0 = this.x1 = +x)},${(this.y0 = this.y1 = +y)}h${+w}v${+h}h${-+w}Z`;
  }

  /**
   * Convert the path to a string
   */
  toString(): string {
    return this.path;
  }
  //#endregion

  //#region SvgPath methods
  /**
   * Get the SvgPath instance
   */
  getSvgPath(): SvgPath {
    if (this.svgPath === null) {
      try {
        this.svgPath = SvgPath.fromString(this.toString());
      } catch (e) {
        console.log(this.toString());
        throw e;
      }
    }
    return this.svgPath;
  }

  // /**
  //  * Get the bounding box of the path
  //  * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SVGPathElement/getBBox}
  //  */
  // getBBox(): {
  //   x: number;
  //   y: number;
  //   width: number;
  //   height: number;
  //   x2: number;
  //   y2: number;
  //   cx: number;
  //   cy: number;
  //   cz: number;
  // } {
  //   return this.getSVGPath().getBBox();
  // }

  /**
   * Get the total length of the path
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SVGPathElement/getTotalLength}
   */
  getTotalLength(): number {
    return this.getSvgPath().getLength();
  }

  /**
   * Get the point at a specific length along the path
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SVGPathElement/getPointAtLength}
   */
  getPointAtLength(length: number): Vector2 {
    const { x, y } = this.getSvgPath().getPointAtLength(length);
    return new Vector2(x, y);
  }

  /**
   * Gets the closest point on the path to a given point
   */
  getClosestPoint(point: Vector2): Vector2 {
    return this.getSvgPath().getClosestPoint(point);
  }

  /**
   * Gets the length of the path up to the closest point on the path to a given point
   */
  getLengthAtPoint(point: Vector2): number {
    return this.getSvgPath().getLengthAtPoint(point);
  }

  /**
   * Determines if a point is close to the path
   */
  isPointClose(point: Vector2, threshold: number): boolean {
    return (
      this.getSvgPath().getClosestPoint(point).dist(point) <= threshold / 2
    );
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

    const { x, y } = this.getSvgPath().getPointAtLength(length + epsilon);
    const { x: x0, y: y0 } = this.getSvgPath().getPointAtLength(length);
    return new Vector2(x - x0, y - y0).normalize();
  }

  /**
   * Gets the normal vector at a specific length along the path
   */
  getNormalAtLength(length: number): Vector2 {
    return this.getTangentAtLength(length).cw90();
  }
  //#endregion

  //#region Extra methods
  /**
   * Strokes this path on a canvas context
   */
  stroke(ctx: CanvasRenderingContext2D): void {
    ctx.stroke(this.toPath2D());
  }

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

  //#region Static methods
  /**
   * Helper function to calculate the necessary values for an arcTo operation
   * without drawing the arc.
   */
  static calculateArcTo(
    a: Vector2,
    b: Vector2,
    c: Vector2,
    radius: number,
    maxDist: number = 0,
  ): {
    start: Vector2;
    end: Vector2;
    center: Vector2;
    radius: number;
    largeArcFlag: boolean;
    sweepFlag: boolean;
  } | null {
    const x0 = a.x,
      y0 = a.y,
      x1 = b.x,
      y1 = b.y,
      x2 = c.x,
      y2 = c.y;
    const x21 = x2 - x1,
      y21 = y2 - y1,
      x01 = x0 - x1,
      y01 = y0 - y1,
      l01_2 = x01 * x01 + y01 * y01;

    if (!(l01_2 > epsilon)) {
      // No arc needed
      return null;
    }

    if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !radius) {
      // Straight line
      return null;
    }

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
        );
    let t01 = l / l01,
      t21 = l / l21;

    let recalRadius = false;

    if (maxDist > 0) {
      // should be the same for both t01 and t21
      const dist = Math.sqrt(t01 * x01 * t01 * x01 + t01 * y01 * t01 * y01);
      if (dist > maxDist) {
        t01 = maxDist / l01;
        t21 = maxDist / l21;

        // Recalculate the radius
        recalRadius = true;
      }
    }

    const startX = x1 + t01 * x01;
    const startY = y1 + t01 * y01;
    const endX = x1 + t21 * x21;
    const endY = y1 + t21 * y21;

    // The center of the circle
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    if (recalRadius) {
      // Normal vector for a->b at start
      const normalStartX = -y01 / l01;
      const normalStartY = x01 / l01;

      // Normal vector for b->c at end
      const normalEndX = -y21 / l21;
      const normalEndY = x21 / l21;

      // Parametric equations for the lines
      // Line 1: (startX, startY) + t1 * (normalStartX, normalStartY)
      // Line 2: (endX, endY) + t2 * (normalEndX, normalEndY)

      const det = normalStartX * normalEndY - normalStartY * normalEndX;

      if (Math.abs(det) > epsilon) {
        // Solve for t1 and t2 to find the intersection
        const t1 =
          ((endX - startX) * normalEndY - (endY - startY) * normalEndX) / det;

        // Intersection point (new center)
        const centerX = startX + t1 * normalStartX;
        const centerY = startY + t1 * normalStartY;

        // Recalculate the radius
        radius = Math.sqrt(
          (centerX - startX) * (centerX - startX) +
            (centerY - startY) * (centerY - startY),
        );
      } else {
        // If the lines are parallel, fallback to the midpoint as the center
        radius = Math.sqrt(
          (midX - startX) * (midX - startX) + (midY - startY) * (midY - startY),
        );
      }
    }

    const directionX = -(endY - startY); // Perpendicular direction
    const directionY = endX - startX;

    const dirLength = Math.sqrt(
      directionX * directionX + directionY * directionY,
    );

    // Normalize the direction vector
    let unitDirX = directionX / dirLength;
    let unitDirY = directionY / dirLength;

    // Ensure the direction points away from [x1, y1]
    const dotProduct = unitDirX * (midX - x1) + unitDirY * (midY - y1);
    if (dotProduct < 0) {
      unitDirX = -unitDirX;
      unitDirY = -unitDirY;
    }

    // Distance from the midpoint to the center
    const halfChordLength = Math.sqrt(radius * radius - (dirLength / 2) ** 2);

    const centerX = midX + unitDirX * halfChordLength;
    const centerY = midY + unitDirY * halfChordLength;

    const sweepFlag = y01 * x20 > x01 * y20;

    return {
      start: new Vector2(startX, startY),
      end: new Vector2(endX, endY),
      center: new Vector2(centerX, centerY),
      radius,
      largeArcFlag: false,
      sweepFlag,
    };
  }

  /**
   * Create a new path from a string
   */
  static fromString(path: string): Path2Dpp {
    const p = new Path2Dpp();
    p.path = path;
    return p;
  }

  /**
   * Create a new circle path
   */
  static circle(center: Vector2, radius: number): Path2Dpp {
    const p = new Path2Dpp();
    p.arc(center, radius, 0, tau);
    return p;
  }

  /**
   * Create a new circle path with an x in the center
   */
  static circleX(center: Vector2, radius: number): Path2Dpp {
    const p = new Path2Dpp();
    const sqrt2r = (radius * Math.SQRT2) / 2;
    p.moveTo(center.x - sqrt2r, center.y - sqrt2r);
    p.lineTo(center.x + sqrt2r, center.y + sqrt2r);
    p.moveTo(center.x + sqrt2r, center.y - sqrt2r);
    p.lineTo(center.x - sqrt2r, center.y + sqrt2r);
    p.moveTo(center.x + radius, center.y);
    p.arc(center, radius, 0, tau);
    return p;
  }

  static line(start: Vector2, end: Vector2): Path2Dpp {
    const p = new Path2Dpp();
    p.moveTo(start);
    p.lineTo(end);
    return p;
  }
  //#endregion
}
