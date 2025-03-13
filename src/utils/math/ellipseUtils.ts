import { EPSILON } from '../mathUtils';
import { Vector2 } from '../vec';
import { ellipticE, ellipticEinv } from './integrals';

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
  largeArcFlag: number | boolean,
  sweepFlag: number | boolean,
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
    sweepFlag = !sweepFlag;
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
  const m = 1 - (radii.y / radii.x) ** 2;
  const E1 = ellipticE(t1 - 0.5 * Math.PI, m);
  const E2 = ellipticE(t2 - 0.5 * Math.PI, m);
  return radii.x * (E2 - E1);
}

/**
 * Computer the circumference of an ellipse.
 *
 * @param a the major axis of the ellipse
 * @param b the minor axis of the ellipse
 */
export function getEllipseCircumference(a: number, b: number): number {
  const m = 1 - (b / a) ** 2;

  return 4 * a * ellipticE(Math.PI / 2, m);
}

/**
 * Properties of an ellipse arc.
 */
export interface EllipseArc {
  center: Vector2;
  radii: Vector2;
  xAxisRotation: number;
  radRot: number;
  /**
   * Start angle from the center of the ellipse.
   */
  startAngle: number;
  /**
   * End angle from the center of the ellipse.
   */
  endAngle: number;
  /**
   * The start parametric angle of the ellipse arc.
   *
   * Range: [0, 2π)
   */
  startParametric: number;
  /**
   * The end parametric angle of the ellipse arc.
   *
   * Range: startParametric ± [0, 2π)
   */
  endParametric: number;
  direction: number;
  length: number;
  ellipseLength: number;
  from: Vector2;
  to: Vector2;
  largeArcFlag: boolean;
  sweepFlag: boolean;
}

/**
 * Given the start and end points of an ellipse arc, as well as the ellipse's
 * radii, the x-axis rotation, the large arc flag, the sweep flag, returns the
 * properties of the ellipse arc.
 *
 * @param from the start point of the ellipse arc
 * @param to the end point of the ellipse arc
 * @param radii the radii of the ellipse
 * @param xAxisRotation the x-axis rotation of the ellipse
 * @param largeArcFlag the large arc flag of the ellipse
 * @param sweepFlag the sweep flag of the ellipse
 * @returns the properties of the ellipse arc
 */
export function ellipseArcProperties(
  from: Vector2,
  to: Vector2,
  radii: Vector2,
  xAxisRotation: number,
  largeArcFlag: number | boolean,
  sweepFlag: number | boolean,
): EllipseArc {
  radii = radiiOfArc(from, to, radii, xAxisRotation);
  const center = centerOfArc(
    from,
    to,
    radii,
    xAxisRotation,
    largeArcFlag,
    sweepFlag,
  );

  let startParametric = parametricAngle(center, from, radii, xAxisRotation);
  let endParametric = parametricAngle(center, to, radii, xAxisRotation);

  let startAngle = center.angleTo(from) - xAxisRotation;
  let endAngle = center.angleTo(to) - xAxisRotation;

  // Ensure the start angle is positive
  if (startParametric < 0) {
    startParametric += Math.PI * 2;
    endParametric += Math.PI * 2;
    startAngle += Math.PI * 2;
    endAngle += Math.PI * 2;
  }

  const paramDelta = endParametric - startParametric;

  // Ensure the end angle is within the range of the start angle
  if (sweepFlag) {
    if (paramDelta < 0) {
      endParametric += Math.PI * 2;
      endAngle += Math.PI * 2;
    }
  } else {
    if (paramDelta > 0) {
      endParametric -= Math.PI * 2;
      endAngle -= Math.PI * 2;
    }
  }

  const direction = Math.sign(endParametric - startParametric);

  const length = Math.abs(arcLength(radii, startParametric, endParametric));
  const ellipseLength = getEllipseCircumference(radii.x, radii.y);

  return {
    center,
    radii,
    xAxisRotation,
    radRot: xAxisRotation * (Math.PI / 180),
    startAngle,
    endAngle,
    startParametric,
    endParametric,
    direction,
    length,
    ellipseLength,
    from,
    to,
    largeArcFlag: !!largeArcFlag,
    sweepFlag: !!sweepFlag,
  };
}

/**
 * Calculates the end angle of an arc on an ellipse given the radii,
 * starting angle, arc length, and xAxisRotation.
 *
 * @param radii - The radii of the ellipse as a Vector2 object.
 * @param t - The starting angle in radians.
 * @param len - The length of the arc. If 0, the end angle is the same as the
 * starting angle. If negative, the end angle goes clockwise from the starting
 * angle.
 * @returns The end angle in radians.
 */
export function findEndAngle(radii: Vector2, t: number, len: number): number {
  if (len === 0) {
    return t;
  }
  if (radii.x === radii.y) {
    return t + len / radii.x;
  }

  if (len < 0) {
    const totalLength = getEllipseCircumference(radii.x, radii.y);
    len = totalLength + len;
  }
  let swapped = false;
  if (radii.x < radii.y) {
    radii = radii.swap();
    t += Math.PI / 2;
    swapped = true;
  }
  const m = 1 - (radii.y / radii.x) ** 2;
  const E1 = ellipticE(t - 0.5 * Math.PI, m);
  // len = radii.x * (ellipticE(result - 0.5 * Math.PI, m) - E1);
  // how to solve for result?
  // len / radii.x = ellipticE(result - 0.5 * Math.PI, m) - E1;
  // len / radii.x + E1 = ellipticE(result - 0.5 * Math.PI, m);
  // ellipticE(result - 0.5 * Math.PI, m) = len / radii.x + E1;
  // result - 0.5 * Math.PI = ellipticEinv(len / radii.x + E1, m);
  const result = ellipticEinv(len / radii.x + E1, m) + 0.5 * Math.PI;
  if (swapped) {
    return result - Math.PI / 2;
  }
  return result;
}

/**
 * Determines the position of a point relative to an ellipse.
 *
 * @param radii - The radii of the ellipse.
 * @param point - The point to be checked.
 * @returns -1 if the point is inside the ellipse, 0 if the point is on the
 * ellipse, and 1 if the point is outside the ellipse.
 */
export function pointOnEllipse(radii: Vector2, point: Vector2): -1 | 0 | 1 {
  const normalizedX = point.x / radii.x;
  const normalizedY = point.y / radii.y;
  const distance = Math.sqrt(normalizedX ** 2 + normalizedY ** 2);
  const diff = distance - 1;
  if (Math.abs(diff) < EPSILON) {
    return 0;
  }
  return Math.sign(diff) as -1 | 1;
}

/**
 * Finds the parametric angle on a standard ellipse given the radii and a
 * point. Uses numerical approximation to find the parametric angle and then
 * calculates the closest point.
 *
 * @param radii - The radii of the ellipse as a Vector2 object.
 * @param point - The point to find the closest point to.
 * @returns The parametric angle in radians.
 */
export function findParametricAngle(
  radii: Vector2,
  point: Vector2,
  iterationCallback?: (t: number, i: number) => void,
): number {
  if (radii.x === radii.y) {
    return point.angle();
  }
  // Solve for t:
  //   a*x sin(t) − b*y cos(t) + (0.5 b^2 − 0.5 a^2) sin(2t) = 0
  // Derivative:
  //   a*x cos(t) + b*y sin(t) + (b^2 − a'2) cos(2t) = 0

  const poe = pointOnEllipse(radii, point);
  if (poe === 0) {
    return parametricAngle(new Vector2(0, 0), point, radii);
  }
  if (poe === -1) {
    return findInsideParametricAngle(radii, point, iterationCallback);
  }

  // Initial guess
  let t = point.div(radii).angle();

  let t2 = t;
  let i = 0;
  if (iterationCallback) {
    iterationCallback(t2, i);
  }

  const a = radii.x;
  const b = radii.y;
  const x = point.x;
  const y = point.y;

  // Newton's method
  do {
    t = t2;
    const cos = Math.cos(t);
    const sin = Math.sin(t);
    const cos2 = Math.cos(2 * t);
    const sin2 = Math.sin(2 * t);
    const f = a * x * sin - b * y * cos + 0.5 * (b ** 2 - a ** 2) * sin2;
    const df = a * x * cos + b * y * sin + (b ** 2 - a ** 2) * cos2;
    t2 = t - f / df;

    i++;
    if (iterationCallback) {
      iterationCallback(t2, i);
    }
  } while (Math.abs(t2 - t) > EPSILON && i < 100);

  if (i === 100) {
    console.error('findParametricAngle: max iterations reached');
  }

  return t2;
}

/**
 * Fallback function for finding the parametric angle when the point is inside
 * the ellipse. Uses a naïve numerical approximation to find the parametric
 * angle.
 *
 * @param radii - The radii of the ellipse as a Vector2 object.
 * @param point - The point to find the closest point to.
 * @returns The parametric angle in radians.
 */
function findInsideParametricAngle(
  radii: Vector2,
  point: Vector2,
  iterationCallback?: (t: number, i: number) => void,
): number {
  const a = radii.x;
  const b = radii.y;
  const x = point.x;
  const y = point.y;

  // TODO: Find better initial guess
  let t1 = 0;
  let t2 = 2 * Math.PI;
  let t = (t1 + t2) / 2;
  let i = 0;

  while (Math.abs(t2 - t1) > EPSILON && i < 100) {
    t = (t1 + t2) / 2;
    const cos = Math.cos(t);
    const sin = Math.sin(t);
    const f =
      a * x * sin - b * y * cos + 0.5 * (b ** 2 - a ** 2) * Math.sin(2 * t);

    if (f > 0) {
      t2 = t;
    } else {
      t1 = t;
    }

    i++;
    if (iterationCallback) {
      iterationCallback(t, i);
    }
  }

  if (i === 100) {
    console.error('findInsideParametricAngle: max iterations reached');
  }

  return t;
}
