import { ellipticE } from './integrals';
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
 * We're in 2D, so that's what our vertors look like
 */
export type Point = [number, number];

/**
 * Calculates the vector that connects the two points
 */
function deltaXY(from: Point, to: Point): Point {
  return [to[0] - from[0], to[1] - from[1]];
}

/**
 * Calculates the sum of an arbitrary amount of vertors
 */
function vecAdd(...vectors: Point[]): Point {
  return vectors.reduce(
    (acc, curr) => [acc[0] + curr[0], acc[1] + curr[1]],
    [0, 0],
  );
}

/**
 * Given two points a and b, as well as ellipsis radii rX and rY, this
 * function calculates the center-point of the ellipse, so that it
 * is "above" the two points and has them on the circumference
 */
function topLeftOfPointsCenter(
  a: Point,
  b: Point,
  rX: number,
  rY: number,
  factor: number,
): Point {
  const delta = deltaXY(a, b);

  // Sergey's work leads up to a simple system of liner equations.
  // Here, we calculate its general solution for the first of the two angles (t1)
  const A = Math.asin(
    Math.sqrt((delta[0] / (2 * rX)) ** 2 + (delta[1] / (2 * rY)) ** 2),
  );
  const B = Math.atan(((-delta[0] / delta[1]) * rY) / rX);
  const alpha = A + B;

  // This may be the new center, but we don't know to which of the two
  // solutions it belongs, yet
  let newCenter = vecAdd(a, [rX * Math.cos(alpha), rY * Math.sin(alpha)]);

  // Figure out if it is the correct solution, and adjusting if not
  const mean = vecAdd(a, [delta[0] * 0.5, delta[1] * 0.5]);
  const offMean = deltaXY(mean, newCenter);
  newCenter = vecAdd(mean, [offMean[0] * factor, offMean[1] * factor]);

  return newCenter;
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
  return new Vector2(...topLeftOfPointsCenter(a.a, b.a, r.x, r.y, factor));
  // const delta = b.sub(a);

  // // Sergey's work leads up to a simple system of liner equations.
  // // Here, we calculate its general solution for the first of the two angles (t1)
  // const A = Math.asin(
  //   Math.sqrt((delta.x / (2 * r.x)) ** 2 + (delta.y / (2 * r.y)) ** 2),
  // );
  // const B = Math.atan(((-delta.x / delta.y) * r.y) / r.x);
  // const alpha = A + B;

  // // This may be the new center, but we don't know to which of the two
  // // solutions it belongs, yet
  // let newCenter = pointAtAngle(a, r, alpha);

  // // Figure out if it is the correct solution, and adjusting if not
  // const mean = a.avg(b);
  // const offMean = newCenter.sub(mean);
  // newCenter = mean.add(offMean.mult(factor));

  // return newCenter;
}

/**
 * Calculates the parametric angle from the center of the ellipse to a given point.
 *
 * @param center the center of the ellipse
 * @param point the point on the ellipse
 * @param r the radii of the ellipse
 * @returns the parametric angle in radians
 */
export function parametricAngle(
  center: Vector2,
  point: Vector2,
  r: Vector2,
): number {
  const delta = point.sub(center);
  return delta.div(r).angle();
}

/**
 * Returns the point on the ellipse at the given parametric angle.
 *
 * @param center the center of the ellipse
 * @param r the radii of the ellipse
 * @param angle the parametric angle in radians
 * @returns the point on the ellipse
 */
export function pointAtAngle(
  center: Vector2,
  r: Vector2,
  angle: number,
): Vector2 {
  return new Vector2(
    center.x + r.x * Math.cos(angle),
    center.y + r.y * Math.sin(angle),
  );
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
    radii = radii.mult(Math.sqrt(radiiCheck));
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
  if (from.y > to.y) {
    [from, to] = [to, from];
    // idk why this is necessary, but it is
    sweepFlag = 1 - sweepFlag;
  }

  // Ensure radii are large enough
  const xRotRad = (xAxisRotation * Math.PI) / 180;

  radii = radiiOfArc(from, to, radii, xAxisRotation);

  const factor = largeArcFlag === sweepFlag ? 1 : -1;

  if (radii.x === radii.y) {
    // Angle doesn't matter for circles
    // It's faster to calculate the circle center
    // n.b.: I didn't bench this, so I don't know if it makes a difference
    return findCircleCenter(from, to, radii.x, factor);
  }

  from = from.rotateBy(-xRotRad);
  to = to.rotateBy(-xRotRad);

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
  const k = Math.sqrt(1 - radii.y ** 2 / radii.x ** 2);
  const E1 = ellipticE(t1, k * k);
  const E2 = ellipticE(t2, k * k);
  return radii.x * (E2 - E1);
}

function test() {
  const a = new Vector2(4, 9);
  const b = new Vector2(3, 8);
  let r = new Vector2(7, 5);
  const xRot = 0;
  const largeArc = 1;
  const sweep = 1;

  r = radiiOfArc(a, b, r, xRot);
  const center = centerOfArc(a, b, r, xRot, largeArc, sweep);
  console.log(center.M);

  const angle1 = parametricAngle(center, a, r);
  const angle2 = parametricAngle(center, b, r);
  console.log(angle1, angle2);

  const point1 = pointAtAngle(center, r, angle1);
  const point2 = pointAtAngle(center, r, angle2);

  console.log(point1.M, point2.M);
}

// @ts-expect-error - Ignore for testing purposes
if (require.main === module) {
  test();
}
