import getPointAtLength from '../getPointAtLength';
import { Vector2 } from '../vec';
import {
  ASegment,
  MSegment,
  NormalArray,
  NormalSegment,
  PathArray,
  arcTools,
  getPropertiesAtLength,
  getTotalLength,
  normalizePath,
  pathToString,
} from 'svg-path-commander';

const { getPointAtArcLength, getArcLength } = arcTools;

type NormalCommand = NormalSegment[0];

type SplitResult<S extends NormalSegment = NormalSegment> = [
  first: S,
  midpoint: Vector2,
  second: S,
];

type SplitFunction<T extends NormalCommand> = (
  from: Vector2,
  segment: NormalSegment & [T, ...number[]],
  t: number,
) => SplitResult;

type NumArray<N extends number, R extends number[] = []> = R['length'] extends N
  ? R
  : NumArray<N, [number, ...R]>;

const splitFunctions: {
  [K in Exclude<NormalCommand, 'Z' | 'M'>]: SplitFunction<K>;
} = {
  L(from, segment, t) {
    const to = new Vector2(segment[1], segment[2]);
    const mid = from.lerp(to, t);
    return [['L', ...mid.a], mid, ['L', ...to.a]];
  },
  C(from, segment, t) {
    // cubic bezier
    // See https://pomax.github.io/bezierinfo/#splitting
    const [x1, y1, x2, y2, x, y] = segment.slice(1) as NumArray<6>;
    const p0 = from;
    const p1 = new Vector2(x1, y1);
    const p2 = new Vector2(x2, y2);
    const p3 = new Vector2(x, y);

    const p01 = p0.lerp(p1, t);
    const p12 = p1.lerp(p2, t);
    const p23 = p2.lerp(p3, t);

    const p012 = p01.lerp(p12, t);
    const p123 = p12.lerp(p23, t);

    const p0123 = p012.lerp(p123, t);

    return [
      ['C', ...p01.a, ...p012.a, ...p0123.a],
      p0123,
      ['C', ...p123.a, ...p23.a, ...p3.a],
    ];
  },
  Q(from, segment, t) {
    // quadratic bezier
    const [x1, y1, x, y] = segment.slice(1) as NumArray<4>;
    const p0 = from;
    const p1 = new Vector2(x1, y1);
    const p2 = new Vector2(x, y);

    const p01 = p0.lerp(p1, t);
    const p12 = p1.lerp(p2, t);

    const p012 = p01.lerp(p12, t);

    return [['Q', ...p01.a, ...p012.a], p012, ['Q', ...p12.a, ...p2.a]];
  },
  A(from, segment, t) {
    const [rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y] =
      segment.slice(1) as NumArray<7>;
    return splitArc(
      from,
      new Vector2(x, y),
      new Vector2(rx, ry),
      xAxisRotation,
      largeArcFlag,
      sweepFlag,
      t,
    );
  },
};

function getEllipseCircumference(rx: number, ry: number): number {
  // Ramanujan approximation
  const h = Math.pow(rx - ry, 2) / Math.pow(rx + ry, 2);
  return Math.PI * (rx + ry) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
}

function splitArc(
  from: Vector2,
  to: Vector2,
  radii: Vector2,
  xAxisRotation: number,
  largeArcFlag: number,
  sweepFlag: number,
  t: number,
): SplitResult<ASegment> {
  // A: rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y

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

  const stuffs = [
    ...from.a,
    ...radii.a,
    xAxisRotation,
    largeArcFlag,
    sweepFlag,
    ...to.a,
  ] as const;
  const totalLength = getEllipseCircumference(...radii.a);
  const arcLength = getArcLength(...stuffs);
  const mid = new Vector2(getPointAtArcLength(...stuffs, arcLength * t));

  let largeArcFlag1 = 0;
  let largeArcFlag2 = 0;

  if (largeArcFlag === 1) {
    const length1 = arcLength * t;
    const length2 = arcLength * (1 - t);
    const halfLength = totalLength / 2;

    if (length1 > halfLength) {
      largeArcFlag1 = 1;
    }

    if (length2 > halfLength) {
      largeArcFlag2 = 1;
    }
  }

  return [
    ['A', radii.x, radii.y, xAxisRotation, largeArcFlag1, sweepFlag, ...mid.a],
    mid,
    ['A', radii.x, radii.y, xAxisRotation, largeArcFlag2, sweepFlag, ...to.a],
  ];
}

function splitSegment(
  from: Vector2,
  segment: NormalSegment,
  t: number,
): [NormalSegment, Vector2, NormalSegment] {
  switch (segment[0]) {
    case 'M':
    case 'Z':
      throw new Error('Cannot split M or Z commands');
    default:
      // @ts-expect-error - we know this is safe
      return splitFunctions[segment[0]](from, segment, t);
  }
}

/**
 * Split a path at a given length
 * @param path the path to split
 * @param length the length to split at
 * @returns the split paths
 */
export function splitPathAtLength(
  path: string | PathArray,
  length: number,
): [NormalArray, NormalArray] | [NormalArray] {
  const normalPath: NormalArray = normalizePath(path);
  const {
    index,
    lengthAtSegment,
    segment,
    length: segLen,
  } = getPropertiesAtLength(normalPath, length);
  const from = new Vector2(getPointAtLength(normalPath, lengthAtSegment));

  const lengthAlongSegment = length - lengthAtSegment;
  const t = lengthAlongSegment / segLen;
  if (t > 1) {
    return [normalPath];
  }
  const [first, mid, second] = splitSegment(from, segment as NormalSegment, t);

  const firstPath: NormalArray = [
    ...(normalPath.slice(0, index) as NormalArray),
    first,
  ];
  const midSegment: MSegment = ['M', ...mid.a];
  const secondPath: NormalArray = [
    midSegment,
    second,
    ...normalPath.slice(index + 1),
  ];

  return [firstPath, secondPath];
}

/**
 * Create a dashed path from a path
 * @param path the path to dash
 * @param dashArray the dash array
 * @returns the dashed path
 */
export function dashPath(path: string, dashArray: number[]): string {
  let currentPath: NormalArray = normalizePath(path);
  let remainingLength = getTotalLength(currentPath);

  const dashedPath: NormalArray[] = [];

  let i = 0;
  while (remainingLength > 0) {
    const dashIndex = i % dashArray.length;
    const dash = dashArray[dashIndex];
    const [first, second] = splitPathAtLength(currentPath, dash);
    if (i % 2 === 0) {
      dashedPath.push(first);
    }
    if (!second) {
      break;
    }
    remainingLength -= dash;
    currentPath = second;
    i++;
  }

  return dashedPath.map(s => pathToString(s, 'off')).join('');
}

function getDashPointsOnPath(path: string, dashArray: number[]): Vector2[] {
  const normalPath = normalizePath(path);
  const totalLength = getTotalLength(normalPath);

  const points: Vector2[] = [];

  let i = 0;
  let currentLength = 0;
  while (currentLength < totalLength) {
    const dashIndex = i % dashArray.length;
    const dash = dashArray[dashIndex];
    const point = new Vector2(getPointAtLength(normalPath, currentLength));
    points.push(point);
    currentLength += dash;
    i++;
  }

  return points;
}

const path = 'M 1 8 C 15 11 13 1 1 1';
const dashArray = [5, 2];

console.log(dashPath(path, dashArray));
console.log();
console.log(
  getDashPointsOnPath(path, dashArray)
    .map(p => `M ${p.x} ${p.y}`)
    .join(' '),
);
