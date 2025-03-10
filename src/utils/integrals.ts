/*
 * Hugest of thanks to this dude:
 * https://gist.github.com/stla/3d80bd6ce636831253ac409197165f39
 */
import { EPSILON } from './mathUtils';

function hasMoreThanOneZero(...args: number[]) {
  let count = 0;
  for (const arg of args) {
    if (arg === 0) {
      count++;
    }
    if (count > 1) {
      return true;
    }
  }
  return false;
}

/**
 * Computes the Carlson elliptic integral of the first kind RF(x, y, z).
 *
 * @param x - The first input value.
 * @param y - The second input value.
 * @param z - The third input value.
 * @param err - The error tolerance for the approximation, must be positive.
 * @returns The computed value of the Carlson elliptic integral RF(x, y, z).
 * @throws Will throw an error if `err` is nonpositive or if more than one of `x`, `y`, `z` is zero.
 */
export function CarlsonRF(
  x: number,
  y: number,
  z: number,
  err: number = EPSILON,
) {
  if (err <= 0) {
    throw 'The value of `err` must be nonnegative.';
  }
  if (hasMoreThanOneZero(x, y, z)) {
    throw 'At most one of `x`, `y`, `z` can be 0.';
  }
  let dx = 2 * err;
  let dy = dx;
  let dz = dx;
  let A;
  do {
    const srx = Math.sqrt(x);
    const sry = Math.sqrt(y);
    const srz = Math.sqrt(z);
    const lambda = srx * sry + sry * srz + srz * srx;
    x = (x + lambda) / 4;
    y = (y + lambda) / 4;
    z = (z + lambda) / 4;
    A = (x + y + z) / 3;
    dx = Math.abs((A - x) / A);
    dy = Math.abs((A - y) / A);
    dz = Math.abs((A - z) / A);
  } while (dx > err || dy > err || dz > err);
  const E2 = dx * dy + dy * dz + dz * dx;
  const E3 = dy * dx * dz;
  const h =
    1 -
    E2 / 10 +
    E3 / 14 +
    (E2 * E2) / 24 -
    (3 * E2 * E3) / 44 -
    (5 * E2 * E2 * E2) / 208 +
    (3 * E3 * E3) / 104 +
    (E2 * E2 * E3) / 16;
  return h / Math.sqrt(A);
}

/**
 * Computes the Carlson's symmetric form of the elliptic integral of the second kind, RD(x, y, z).
 *
 * @param x - The first input value.
 * @param y - The second input value.
 * @param z - The third input value.
 * @param err - The error tolerance for the computation. Must be nonnegative.
 * @returns The computed value of the Carlson's RD elliptic integral.
 * @throws Will throw an error if `err` is nonpositive or if more than one of `x`, `y`, `z` is zero.
 */
export function CarlsonRD(
  x: number,
  y: number,
  z: number,
  err: number = EPSILON,
) {
  if (err <= 0) {
    throw 'The value of `err` must be nonnegative.';
  }
  if (hasMoreThanOneZero(x, y, z)) {
    throw 'At most one of `x`, `y`, `z` can be 0.';
  }
  let dx = 2 * err;
  let dy = dx;
  let dz = dx;
  let s = 0;
  let fac = 1;
  let A;
  do {
    const srx = Math.sqrt(x);
    const sry = Math.sqrt(y);
    const srz = Math.sqrt(z);
    const lambda = srx * sry + sry * srz + srz * srx;
    s += fac / (srz * (z + lambda));
    fac /= 4;
    x = (x + lambda) / 4;
    y = (y + lambda) / 4;
    z = (z + lambda) / 4;
    A = (x + y + 3 * z) / 5;
    dx = Math.abs((A - x) / A);
    dy = Math.abs((A - y) / A);
    dz = Math.abs((A - z) / A);
  } while (dx > err || dy > err || dz > err);
  const E2 = dx * dy + 3 * dy * dz + 3 * dz * dz + 3 * dx * dz;
  const E3 =
    dz * dz * dz + 3 * dx * dz * dz + 3 * dx * dy * dz + 3 * dy * dz * dz;
  const E4 = dy * dz * dz * dz + dx * dz * dz * dz + 3 * dx * dy * dz * dz;
  const E5 = dx * dy * dz * dz * dz;
  const h =
    fac *
    (1 -
      (3 * E2) / 14 +
      E3 / 6 +
      (9 * E2 * E2) / 88 -
      (3 * E4) / 22 -
      (9 * E2 * E3) / 52 +
      (3 * E5) / 26 -
      (E2 * E2 * E2) / 16 +
      (3 * E3 * E3) / 40 +
      (3 * E2 * E4) / 20 +
      (45 * E2 * E2 * E3) / 272 -
      (9 * (E3 * E4 + E2 * E5)) / 68);
  return 3 * s + h / (A * Math.sqrt(A));
}

/**
 * Computes the Carlson elliptic integral RJ.
 *
 * @param x - The first variable.
 * @param y - The second variable.
 * @param z - The third variable.
 * @param p - The fourth variable.
 * @param err - The error tolerance, must be nonnegative.
 * @returns The value of the Carlson elliptic integral RJ.
 * @throws Will throw an error if `err` is nonpositive or if more than one of `x`, `y`, `z`, `p` is zero.
 */
export function CarlsonRJ(
  x: number,
  y: number,
  z: number,
  p: number,
  err: number = EPSILON,
) {
  if (err <= 0) {
    throw 'The value of `err` must be nonnegative.';
  }
  if (hasMoreThanOneZero(x, y, z, p)) {
    throw 'At most one of `x`, `y`, `z`, `p` can be 0.';
  }
  const A0 = (x + y + z + 2 * p) / 5;
  let A = A0;
  const delta = (p - x) * (p - y) * (p - z);
  const M = Math.max(Math.abs(A - x), Math.abs(A - y), Math.abs(A - z));
  let Q = Math.pow(4 / err, 1 / 6) * M;
  const d = [];
  const e = [];
  let f = 1;
  let fac = 1;
  while (Math.abs(A) <= Q) {
    const srx = Math.sqrt(x);
    const sry = Math.sqrt(y);
    const srz = Math.sqrt(z);
    const srp = Math.sqrt(p);
    const dnew = (srp + srx) * (srp + sry) * (srp + srz);
    d.push(f * dnew);
    e.push((fac * delta) / (dnew * dnew));
    f *= 4;
    fac /= 64;
    const lambda = srx * sry + sry * srz + srz * srx;
    x = (x + lambda) / 4;
    y = (y + lambda) / 4;
    z = (z + lambda) / 4;
    p = (p + lambda) / 4;
    A = (A + lambda) / 4;
    Q /= 4;
  }
  const fA = f * A;
  const X = (A0 - x) / fA;
  const Y = (A0 - y) / fA;
  const Z = (A0 - z) / fA;
  const P = -(X + Y + Z) / 2;
  const P2 = P * P;
  const E2 = X * Y + Y * Z + Z * X - 3 * P2;
  const E3 = X * Y * Z + 2 * E2 * P + 4 * P2 * P;
  const E4 = P * (2 * X * Y * Z + P * (E2 + 3 * P2));
  const E5 = X * Y * Z * P2;
  const h =
    (1 -
      (3 * E2) / 14 +
      E3 / 6 +
      (9 * E2 * E2) / 88 -
      (3 * E4) / 22 -
      (9 * E2 * E3) / 52 +
      (3 * E5) / 26) /
    f;
  let s = 0;
  const one = 1;
  const n = e.length;
  for (let i = 0; i < n; i++) {
    const srei = Math.sqrt(e[i]);
    const a = srei === 0 ? one : Math.atan(srei) / srei;
    s += a / d[i];
  }
  return h / (A * Math.sqrt(A)) + 6 * s;
}

/**
 * Computes the incomplete elliptic integral of the second kind, E(phi | m).
 *
 * @param phi - The amplitude of the elliptic integral, in radians.
 * @param m - The parameter of the elliptic integral.
 * @param err - The error tolerance for the Carlson elliptic integrals.
 * @returns The value of the incomplete elliptic integral of the second kind.
 *
 * The function handles special cases where phi is 0, phi is within the range
 * [-π/2, π/2], and m is 0 or 1. For other values of phi, it reduces the problem
 * using the periodicity of the elliptic integral.
 *
 * The function uses the Carlson elliptic integrals RF and RD for the computation.
 *
 * @see {@link https://en.wikipedia.org/wiki/Elliptic_integral Elliptic integral on Wikipedia}
 */
export function ellipticE(
  phi: number,
  m: number,
  err: number = EPSILON,
): number {
  let out: number;
  const PI = Math.PI;
  const PI_2 = PI / 2;
  if (phi === 0) {
    out = 0;
  } else if (phi >= -PI_2 && phi <= PI_2) {
    if (m === 0) {
      out = phi;
    } else if (m === 1) {
      out = Math.sin(phi);
    } else {
      const sine = Math.sin(phi);
      const sine2 = sine * sine;
      const cosine2 = 1 - sine2;
      const oneminusmsine2 = 1 - m * sine2;
      out =
        sine *
        (CarlsonRF(cosine2, oneminusmsine2, 1, err) -
          (m * sine2 * CarlsonRD(cosine2, oneminusmsine2, 1, err)) / 3);
    }
  } else {
    const k =
      phi > PI_2 ? Math.ceil(phi / PI - 0.5) : -Math.floor(0.5 - phi / PI);
    phi = phi - k * PI;
    out = 2 * k * ellipticE(PI_2, m, err) + ellipticE(phi, m, err);
  }
  return out;
}

/**
 * Computes the incomplete elliptic integral of the first kind F(φ|m).
 *
 * @param phi - The amplitude of the elliptic integral, in radians.
 * @param m - The parameter (or modulus) of the elliptic integral.
 * @param err - The error tolerance for the computation.
 * @returns The value of the incomplete elliptic integral of the first kind.
 *
 * @remarks
 * - If `phi` is 0 or `m` is not finite, the function returns 0.
 * - If `phi` is ±π/2 and `m` is 1, the function returns NaN.
 * - If `phi` is within the range [-π/2, π/2]:
 *   - If `m` is 1 and `|phi|` < π/2, the function returns `asinh(tan(phi))`.
 *   - If `m` is 0, the function returns `phi`.
 *   - Otherwise, the function uses the Carlson RF function for the computation.
 * - If `phi` is outside the range [-π/2, π/2], the function adjusts `phi` and recursively computes the result.
 */
export function ellipticF(
  phi: number,
  m: number,
  err: number = EPSILON,
): number {
  let out: number;
  const PI = Math.PI;
  const PI_2 = PI / 2;
  if (phi === 0 || !isFinite(m)) {
    out = 0;
    // snip second branch which was only for complex numbers
  } else if ((phi === PI_2 || phi === -PI_2) && m === 1) {
    out = NaN;
  } else if (phi >= -PI_2 && phi <= PI_2) {
    if (m === 1 && Math.abs(phi) < PI_2) {
      out = Math.asinh(Math.tan(phi));
    } else if (m === 0) {
      out = phi;
    } else {
      const sine = Math.sin(phi);
      const sine2 = sine * sine;
      const cosine2 = 1 - sine2;
      const oneminusmsine2 = 1 - m * sine2;
      out = sine * CarlsonRF(cosine2, oneminusmsine2, 1, err);
    }
  } else {
    const k =
      phi > PI_2 ? Math.ceil(phi / PI - 0.5) : -Math.floor(0.5 - phi / PI);
    phi = phi - k * PI;
    out = 2 * k * ellipticF(PI_2, m, err) + ellipticF(phi, m, err);
  }
  return out;
}

/**
 * Computes the Jacobi Zeta function, denoted as Z(φ|m), which is related to the elliptic integrals.
 *
 * @param phi - The amplitude angle in radians.
 * @param m - The parameter (also known as the elliptic modulus or eccentricity squared).
 * @param err - The error tolerance for the computation.
 * @returns The value of the Jacobi Zeta function Z(φ|m).
 */
export function ellipticZ(
  phi: number,
  m: number,
  err: number = EPSILON,
): number {
  let out: number;
  const PI = Math.PI;
  const PI_2 = PI / 2;
  if (!isFinite(m)) {
    out = NaN;
  } else if (m === 1) {
    if (Math.abs(phi) <= PI_2) {
      out = Math.sin(phi);
    } else {
      const k =
        phi > PI_2 ? Math.ceil(phi / PI - 0.5) : -Math.floor(0.5 - phi / PI);
      phi = phi - k * PI;
      out = Math.sin(phi);
    }
  } else {
    out =
      ellipticE(phi, m, err) -
      (ellipticE(PI_2, m, err) / ellipticF(PI_2, m, err)) *
        ellipticF(phi, m, err);
  }
  return out;
}

/**
 * Computes the incomplete elliptic integral of the third kind Π(φ, n, m).
 *
 * @param phi - The amplitude of the elliptic integral, in radians.
 * @param n - The characteristic of the elliptic integral.
 * @param m - The parameter of the elliptic integral.
 * @param err - The error tolerance for the computation.
 * @returns The value of the incomplete elliptic integral of the third kind.
 *
 * @remarks
 * The function handles special cases where φ is 0, n or m are not finite, or φ is ±π/2.
 * It also handles complete elliptic integrals when φ is π/2.
 * For general cases, it uses the Carlson symmetric forms RF and RJ to compute the result.
 *
 * @throws {RangeError} If the input values are out of the expected range.
 */
export function ellipticPI(
  phi: number,
  n: number,
  m: number,
  err: number = EPSILON,
): number {
  let out: number;
  const PI = Math.PI;
  const PI_2 = PI / 2;
  const complete = phi === PI_2;
  if (phi === 0 || !isFinite(n) || !isFinite(m)) {
    out = 0;
  } else if (complete && m === 1 && n !== 1) {
    out = n > 1.0 ? -Infinity : Infinity;
  } else if (complete && n === 1) {
    out = NaN;
  } else if (complete && m === 0) {
    out = PI_2 / Math.sqrt(1 - n);
  } else if (complete && n === m) {
    out = ellipticE(PI_2, m, err) / (1 - m);
  } else if (complete && n === 0) {
    out = ellipticF(PI_2, m, err);
  } else if (phi >= -PI_2 && phi <= PI_2) {
    const sine = Math.sin(phi);
    const sine2 = sine * sine;
    const cosine2 = 1 - sine2;
    const oneminusmsine2 = 1 - m * sine2;
    const oneminusnsine2 = 1 - n * sine2;
    out =
      sine *
      (CarlsonRF(cosine2, oneminusmsine2, 1, err) +
        (n *
          sine2 *
          CarlsonRJ(cosine2, oneminusmsine2, 1, oneminusnsine2, err)) /
          3);
  } else {
    const k =
      phi > PI_2 ? Math.ceil(phi / PI - 0.5) : -Math.floor(0.5 - phi / PI);
    phi = phi - k * PI;
    out = 2 * k * ellipticPI(PI_2, n, m, err) + ellipticPI(phi, n, m, err);
  }
  return out;
}
