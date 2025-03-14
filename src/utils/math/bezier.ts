import { Vector2 } from '../vec';

export type Bezier = Vector2[];

const SEGMENTS = 1000;

function binomial(n: number, k: number): number {
  let coeff = 1;
  for (let i = n - k + 1; i <= n; i++) coeff *= i;
  for (let i = 1; i <= k; i++) coeff /= i;
  return coeff;
}

/**
 * Calculates a point on a Bezier curve at a given parameter t.
 *
 * @param controlPoints - An array of control points defining the Bezier curve.
 * @param t - The parameter at which to evaluate the curve, typically in the range [0, 1].
 * @returns A Vector2 representing the point on the Bezier curve at the given parameter t.
 */
export function bezierPoint(controlPoints: Bezier, t: number): Vector2 {
  const n = controlPoints.length - 1;
  let point = new Vector2(0, 0);

  for (let i = 0; i <= n; i++) {
    const binomialCoeff = binomial(n, i);
    const powT = Math.pow(t, i);
    const powOneMinusT = Math.pow(1 - t, n - i);
    const term = controlPoints[i].mult(binomialCoeff * powT * powOneMinusT);
    point = point.add(term);
  }

  return point;
}

/**
 * Calculates the derivative of a Bezier curve at a given parameter t.
 *
 * @param controlPoints - An array of control points defining the Bezier curve.
 * @param t - The parameter at which to evaluate the derivative, typically in the range [0, 1].
 * @returns The derivative of the Bezier curve at the given parameter t.
 */
export function bezierDerivative(controlPoints: Bezier, t: number): Vector2 {
  const n = controlPoints.length - 1;
  let point = new Vector2(0, 0);

  for (let i = 0; i < n; i++) {
    const binomialCoeff = binomial(n - 1, i);
    const powT = Math.pow(t, i);
    const powOneMinusT = Math.pow(1 - t, n - 1 - i);
    const term = controlPoints[i + 1]
      .sub(controlPoints[i])
      .mult(binomialCoeff * powT * powOneMinusT);
    point = point.add(term);
  }

  return point;
}

/**
 * Splits a Bezier curve at a given parameter t.
 *
 * @param controlPoints - An array of control points defining the Bezier curve.
 * @param t - The parameter at which to split the curve, typically in the range [0, 1].
 * @returns An array of two Bezier curves, each defined by a subset of the original control points.
 */
export function splitBezier(
  controlPoints: Bezier,
  t: number,
): [Bezier, Bezier] {
  const left: Vector2[] = [];
  const right: Vector2[] = [];

  function drawCurvePoint(points: Vector2[], t: number) {
    if (points.length == 1) {
      left.push(points[0]);
      right.push(points[0]);
    } else {
      const n = points.length - 1;
      const newpoints: Vector2[] = [];
      for (let i = 0; i < n; i++) {
        if (i == 0) left.push(points[i]);
        if (i == n - 1) right.push(points[i + 1]);
        newpoints[i] = points[i].mult(1 - t).add(points[i + 1].mult(t));
      }
      drawCurvePoint(newpoints, t);
    }
  }

  drawCurvePoint(controlPoints, t);

  return [left, right.reverse()];
}

/**
 * Calculates the length of a Bezier curve using numerical integration.
 *
 * @param controlPoints - An array of control points defining the Bezier curve.
 * @returns The length of the Bezier curve.
 */
export function bezierLength(controlPoints: Bezier): number {
  let length = 0;
  let prevPoint = controlPoints[0];

  for (let i = 1; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const point = bezierPoint(controlPoints, t);
    length += point.sub(prevPoint).length();
    prevPoint = point;
  }

  return length;
}

/**
 * Calculates the parameter at which the Bezier curve reaches a given arc length.
 *
 * @param controlPoints - An array of control points defining the Bezier curve.
 * @param length - The arc length at which to find the parameter.
 * @returns The parameter at which the Bezier curve reaches the given arc length.
 */
export function bezierParameter(controlPoints: Bezier, length: number): number {
  let prevPoint = controlPoints[0];
  let prevLength = 0;

  for (let i = 1; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const point = bezierPoint(controlPoints, t);
    const segmentLength = point.sub(prevPoint).length();
    const nextLength = prevLength + segmentLength;

    if (nextLength >= length) {
      const remainingLength = length - prevLength;
      const segmentT = remainingLength / segmentLength;
      return (i - 1 + segmentT) / SEGMENTS;
    }

    prevPoint = point;
    prevLength = nextLength;
  }

  return 1;
}

/**
 * Gets the point on a Bezier curve at a given arc length.
 *
 * @param controlPoints - An array of control points defining the Bezier curve.
 * @param length - The arc length at which to find the point.
 * @returns The point on the Bezier curve at the given arc length.
 */
export function bezierPointAtLength(
  controlPoints: Bezier,
  length: number,
): Vector2 {
  const t = bezierParameter(controlPoints, length);
  return bezierPoint(controlPoints, t);
}

/**
 * Split a Bezier curve at a given arc length.
 *
 * @param controlPoints - An array of control points defining the Bezier curve.
 * @param length - The arc length at which to split the curve.
 * @returns An array of two Bezier curves, each defined by a subset of the original control points.
 */
export function splitBezierAtLength(
  controlPoints: Bezier,
  length: number,
): [Bezier, Bezier] {
  const t = bezierParameter(controlPoints, length);
  return splitBezier(controlPoints, t);
}

/**
 * Gets the closest point on a Bezier curve to a given point.
 *
 * @param controlPoints - An array of control points defining the Bezier curve.
 * @param point - The point to which to find the closest point on the curve.
 * @returns The point on the Bezier curve closest to the given point.
 */
export function closestPointOnBezier(
  controlPoints: Bezier,
  point: Vector2,
): Vector2 {
  let minDistance = Infinity;
  let closestPoint = controlPoints[0];

  for (let i = 1; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const curvePoint = bezierPoint(controlPoints, t);
    const distance = curvePoint.sub(point).length();

    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = curvePoint;
    }
  }

  return closestPoint;
}
