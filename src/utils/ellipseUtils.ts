import { ellipticE } from './integrals';
import { EPSILON } from './mathUtils';
import { Vector2 } from './vec';

/**
 * Given two points a and b, as well as radius r, calculates the center point
 * of the circle, so that it is counter-clockwise from a to b (or clockwise if
 * factor is -1).
 *
 * @param a the first point
 * @param b the second point
 * @param r the radius of the circle
 * @param factor the factor to adjust the center by (1 or -1)
 * @returns the center point of the ellipse
 * @see https://stackoverflow.com/a/36211852/13649974
 * @remarks This function doesn't check if a solution exists.
 */
export function findCircleCenter(
  a: Vector2,
  b: Vector2,
  r: number,
  factor: 1 | -1 = 1,
): Vector2 {
  const radsq = r * r;
  const q = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
  const x3 = (a.x + b.x) / 2;
  const y3 = (a.y + b.y) / 2;

  const centerX =
    x3 - Math.sqrt(radsq - (q / 2) ** 2) * ((a.y - b.y) / q) * factor;
  const centerY =
    y3 - Math.sqrt(radsq - (q / 2) ** 2) * ((b.x - a.x) / q) * factor;

  return new Vector2(centerX, centerY);
}

/**
 * Given two points a and b, as well as ellipsis radii rX and rY, calculates
 * the center-point of the ellipse, so that it is counter-clockwise from a to b
 * (or clockwise if factor is -1).
 *
 * @param a the first point
 * @param b the second point
 * @param r the radii of the ellipse
 * @param factor the factor to adjust the center by (1 or -1)
 * @returns the center point of the ellipse
 * @see https://stackoverflow.com/a/71913472/13649974
 * @remarks This function doesn't check if a solution exists.
 */
export function findEllipseCenter(
  a: Vector2,
  b: Vector2,
  r: Vector2,
  factor: 1 | -1 = 1,
): Vector2 {
  const delta = b.sub(a);

  // Sergey's work leads up to a simple system of liner equations.
  // Here, we calculate its general solution for the first of the two angles (t1)
  const A = Math.asin(
    Math.sqrt((delta.x / (2 * r.x)) ** 2 + (delta.y / (2 * r.y)) ** 2),
  );
  const B = Math.atan(((-delta.x / delta.y) * r.y) / r.x);
  const alpha = A + B;

  if (isNaN(A)) {
    console.error(
      `centerOfArc: A is NaN ; ${delta.x} ; ${delta.y} ; ${r.x} ; ${r.y}`,
    );
  }
  if (isNaN(B)) {
    console.error('centerOfArc: B is NaN');
  }

  // This may be the new center, but we don't know to which of the two
  // solutions it belongs, yet
  let newCenter = pointAtAngle(a, r, alpha);
  if (isNaN(newCenter.x)) {
    console.error('centerOfArc: newCenter is NaN');
  }

  // Figure out if it is the correct solution, and adjusting if not
  const mean = a.avg(b);
  const offMean = newCenter.sub(mean);
  newCenter = mean.add(offMean.mult(factor));

  return newCenter;
}

/**
 * Calculates the parametric angle from the center of the ellipse to a given point.
 *
 * @param center the center of the ellipse
 * @param point the point on the ellipse
 * @param r the radii of the ellipse
 * @param xAxisRotation the x-axis rotation of the ellipse
 * @returns the parametric angle in radians
 */
export function parametricAngle(
  center: Vector2,
  point: Vector2,
  r: Vector2,
  xAxisRotation = 0,
): number {
  const xRotRad = (xAxisRotation * Math.PI) / 180;
  const transformedPoint = point.sub(center).rotateBy(-xRotRad);
  return Math.atan2(transformedPoint.y / r.y, transformedPoint.x / r.x);
}

/**
 * Returns the point on the ellipse at the given parametric angle.
 *
 * @param center the center of the ellipse
 * @param r the radii of the ellipse
 * @param angle the parametric angle in radians
 * @param xAxisRotation the x-axis rotation of the ellipse
 * @returns the point on the ellipse
 */
export function pointAtAngle(
  center: Vector2,
  r: Vector2,
  angle: number,
  xAxisRotation = 0,
): Vector2 {
  const xRotRad = (xAxisRotation * Math.PI) / 180;
  const point = new Vector2(r.x * Math.cos(angle), r.y * Math.sin(angle));
  return point.rotateBy(xRotRad).add(center);
}

/**
 * Gets the radii of an ellipse arc from the start and end points of the arc,
 * as well as the x-axis rotation.
 *
 * @param from the start point of the ellipse arc
 * @param to the end point of the ellipse arc
 * @param radii the radii of the ellipse
 * @param xAxisRotation the x-axis rotation of the ellipse
 * @returns the radii of the ellipse
 */
export function radiiOfArc(
  from: Vector2,
  to: Vector2,
  radii: Vector2,
  xAxisRotation: number,
): Vector2 {
  const xRotRad = (xAxisRotation * Math.PI) / 180;
  const transformedPoint = from
    .sub(to)
    .div(2)
    .rotateBy(-xRotRad)
    .div(...radii.a);

  const radiiCheck = transformedPoint.lenSq();
  if (radiiCheck > 1) {
    radii = radii.mult(Math.sqrt(radiiCheck) + EPSILON);
    // EPSILON is added to ensure the radii are large enough. Otherwise, we'll
    // end up with NaNs in the center calculation (specifically in the A value)
  }

  return radii;
}

/**
 * Given the start and end points of an ellipse arc, as well as the ellipse's
 * radii, the x-axis rotation, the large arc flag, the sweep flag, returns the
 * center point of the ellipse arc.
 *
 * @param from the start point of the ellipse arc
 * @param to the end point of the ellipse arc
 * @param radii the radii of the ellipse
 * @param xAxisRotation the x-axis rotation of the ellipse
 * @param largeArcFlag the large arc flag of the ellipse
 * @param sweepFlag the sweep flag of the ellipse
 * @returns the center point of the ellipse arc
 */
export function centerOfArc(
  from: Vector2,
  to: Vector2,
  radii: Vector2,
  xAxisRotation: number,
  largeArcFlag: number,
  sweepFlag: number,
): Vector2 {
  // Ensure radii are large enough
  const xRotRad = (xAxisRotation * Math.PI) / 180;

  radii = radiiOfArc(from, to, radii, xAxisRotation);

  let factor: 1 | -1 = largeArcFlag === sweepFlag ? 1 : -1;

  if (radii.x === radii.y) {
    // Angle doesn't matter for circles
    // It's faster to calculate the circle center
    // n.b.: I didn't bench this, so I don't know if it makes a difference
    return findCircleCenter(from, to, radii.x, factor);
  }

  from = from.rotateBy(-xRotRad);
  to = to.rotateBy(-xRotRad);

  if (from.y > to.y) {
    [from, to] = [to, from];
    // idk why this is necessary, but it is
    sweepFlag = 1 - sweepFlag;
    factor = -factor as 1 | -1;
  }

  const result = findEllipseCenter(from, to, radii, factor);

  return result.rotateBy(xRotRad);
}

/**
 * Computes the length of an elliptical arc.
 *
 * @param radii the radii of the ellipse
 * @param t1 the start angle of the arc
 * @param t2 the end angle of the arc
 * @returns the length of the elliptical arc
 */
export function arcLength(radii: Vector2, t1: number, t2: number): number {
  // ellipticE(phi, m) is the complete elliptic integral of the second kind
  const m = 1 - radii.y ** 2 / radii.x ** 2;
  const E1 = ellipticE(t1, m);
  const E2 = ellipticE(t2, m);
  return radii.x * (E2 - E1);
}

/**
 * Computes the inverse of the incomplete elliptic integral of the second kind.
 *
 * This function uses Newton's method to iteratively find the value `result` such that
 * `ellipticE(result, m) = x`. The iteration stops when the change `delta` is smaller
 * than a predefined epsilon value or after a maximum of 1000 iterations.
 *
 * @param x - The value of the incomplete elliptic integral of the second kind.
 * @param m - The parameter of the elliptic integral.
 * @param err - The maximum error allowed in the result.
 * @returns The inverse value `result` such that `ellipticE(result, m) = x`.
 *
 * @throws Will log an error if the maximum number of iterations (1000) is reached.
 */
function ellipticEinv(x: number, m: number, err: number = EPSILON): number {
  let result: number = x;

  let delta: number;

  let i = 0;
  do {
    const E = ellipticE(result, m);
    const dE = 1 / Math.sqrt(1 - m * Math.sin(result) ** 2); // Derivative of ellipticE
    delta = E - x;
    result -= delta / dE;
    i++;
  } while (Math.abs(delta) > err && i < 1000);

  if (i === 1000) {
    console.error('ellipticEinv: max iterations reached');
  }

  return result;
}

function findEndAngle(radii: Vector2, t: number, len: number): number {
  if (len === 0) {
    return t;
  }
  len = Math.abs(len);
  if (radii.x === radii.y) {
    return t + len / radii.x;
  }
  let swapped = false;
  if (radii.x < radii.y) {
    radii = radii.swap();
    t += Math.PI / 2;
    swapped = true;
  }
  const m = 1 - radii.y ** 2 / radii.x ** 2;
  const E1 = ellipticE(t, m);
  // len = radii.x * (ellipticE(result, m) - E1);
  // how to solve for result?
  // len / radii.x = ellipticE(result, m) - E1;
  // len / radii.x + E1 = ellipticE(result, m);
  // ellipticE(result, m) = len / radii.x + E1;
  // result = ellipticEinv(len / radii.x + E1, m);
  const result = ellipticEinv(len / radii.x + E1, m);
  if (swapped) {
    return result - Math.PI / 2;
  }
  return result;
}

function tempTest() {
  const radii = new Vector2(1, 2);
  const t1 = 0.2;
  const t2 = 1.5;
  const len = arcLength(radii, t1, t2);
  console.log(len);
  const t = findEndAngle(radii, t1, len);
  const error = Math.abs(t - t2);
  console.log(len, t, t2, error);
}
