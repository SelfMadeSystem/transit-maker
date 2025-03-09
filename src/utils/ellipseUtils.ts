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
 * @param rX the x-radius of the ellipse
 * @param rY the y-radius of the ellipse
 * @param factor the factor to adjust the center by (1 or -1)
 * @returns the center point of the ellipse
 * @see https://stackoverflow.com/a/71913472/13649974
 * @remarks This function doesn't check if a solution exists.
 */
export function findEllipseCenter(
  a: Vector2,
  b: Vector2,
  rX: number,
  rY: number,
  factor: 1 | -1 = 1,
): Vector2 {
  const delta = b.sub(a);

  // Sergey's work leads up to a simple system of liner equations.
  // Here, we calculate its general solution for the first of the two angles (t1)
  const A = Math.asin(
    Math.sqrt((delta.x / (2 * rX)) ** 2 + (delta.y / (2 * rY)) ** 2),
  );
  const B = Math.atan(((-delta.x / delta.y) * rY) / rX);
  const alpha = A + B;

  // This may be the new center, but we don't know to which of the two
  // solutions it belongs, yet
  let newCenter = new Vector2(
    a.x + rX * Math.cos(alpha),
    a.y + rY * Math.sin(alpha),
  );

  // Figure out if it is the correct solution, and adjusting if not
  const mean = a.avg(b);
  const offMean = newCenter.sub(mean);
  newCenter = mean.add(offMean.mult(factor));

  return newCenter;
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

  const midPoint = from.add(to).div(2);
  const transformedPoint = from
    .sub(midPoint)
    .rotateBy(xRotRad)
    .div(...radii.a);

  const radiiCheck = transformedPoint.lenSq();

  if (radiiCheck > 1) {
    radii = radii.mult(Math.sqrt(radiiCheck));
  }

  const factor = largeArcFlag === sweepFlag ? 1 : -1;

  if (radii.x === radii.y) {
    // Angle doesn't matter for circles
    // It's faster to calculate the circle center
    // n.b.: I didn't bench this, so I don't know if it makes a difference
    return findCircleCenter(from, to, radii.x, factor);
  }

  return findEllipseCenter(from, to, radii.x, radii.y, factor);
}
