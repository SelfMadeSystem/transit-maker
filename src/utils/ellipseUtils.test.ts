import {
  arcLength,
  centerOfArc,
  findCircleCenter,
  findEllipseCenter,
  parametricAngle,
  pointAtAngle,
  radiiOfArc,
} from './ellipseUtils';
import { Vector2 } from './vec';
import { describe, expect, it } from 'vitest';

function randFloat() {
  return Math.random() * 100 - 50;
}

function randPositive() {
  if (Math.random() < 0.25) {
    return Math.random();
  }
  return Math.random() * 50 + 1;
}

function randVec() {
  if (Math.random() < 0.25) {
    const l = randFloat();
    return new Vector2(l, l);
  }
  return new Vector2(randFloat(), randFloat());
}

function randPositiveVec() {
  if (Math.random() < 0.25) {
    const l = randPositive();
    return new Vector2(l, l);
  }
  return new Vector2(randPositive(), randPositive());
}

describe('ellipseUtils', () => {
  it('should find the correct center of a circle', () => {
    const a = new Vector2(0, 0);
    const b = new Vector2(4, 0);
    const r = 2;
    const center = findCircleCenter(a, b, r);
    expect(center.x).toBeCloseTo(2);
    expect(center.y).toBeCloseTo(0);
  });

  it('should find the correct center of an ellipse', () => {
    const a = new Vector2(0, 0);
    const b = new Vector2(4, 0);
    const r = new Vector2(2, 3);
    const center = findEllipseCenter(a, b, r);
    expect(center.x).toBeCloseTo(2);
    expect(center.y).toBeCloseTo(0);
  });

  it('should calculate the correct parametric angle', () => {
    const center = new Vector2(0, 0);
    const point = new Vector2(1, 1);
    const r = new Vector2(1, 1);
    const angle = parametricAngle(center, point, r);
    expect(angle).toBeCloseTo(Math.PI / 4);
  });

  it('should return the correct point at a given angle', () => {
    const center = new Vector2(0, 0);
    const r = new Vector2(1, 1);
    const angle = Math.PI / 4;
    const point = pointAtAngle(center, r, angle);
    expect(point.x).toBeCloseTo(Math.sqrt(2) / 2);
    expect(point.y).toBeCloseTo(Math.sqrt(2) / 2);
  });

  it('should get the correct radii of an ellipse arc', () => {
    const from = new Vector2(0, 0);
    const to = new Vector2(4, 0);
    const radii = new Vector2(3, 2);
    const xAxisRotation = 0;
    const result = radiiOfArc(from, to, radii, xAxisRotation);
    expect(result.x).toBeCloseTo(3);
    expect(result.y).toBeCloseTo(2);
  });

  it('should find the correct center of an ellipse arc', () => {
    const from = new Vector2(0, 0);
    const to = new Vector2(4, 0);
    const radii = new Vector2(3, 2);
    const xAxisRotation = 0;
    const largeArcFlag = 0;
    const sweepFlag = 0;
    const center = centerOfArc(
      from,
      to,
      radii,
      xAxisRotation,
      largeArcFlag,
      sweepFlag,
    );
    expect(center.x).toBeCloseTo(2);
    expect(center.y).toBeCloseTo(-1.4907119849998598);
  });

  it('should compute the correct length of an elliptical arc', () => {
    const radii = new Vector2(3, 2);
    const t1 = 0;
    const t2 = Math.PI / 2;
    const length = arcLength(radii, t1, t2);
    expect(length).toBeCloseTo(3.966359897322647);
  });

  it('should confirm that point1 and point2 are equal to a and b within a margin of error', () => {
    const str = 'M 14 12 A 7 5 30 0 0 8 17';
    const [aX, aY, rX, rY, xRot, largeArc, sweep, bX, bY] = str
      .match(/(\d+)/g)!
      .map(Number);
    const a = new Vector2(aX, aY);
    const b = new Vector2(bX, bY);
    let r = new Vector2(rX, rY);

    r = radiiOfArc(a, b, r, xRot);
    const center = centerOfArc(a, b, r, xRot, largeArc, sweep);

    const angle1 = parametricAngle(center, a, r, xRot);
    const angle2 = parametricAngle(center, b, r, xRot);

    const point1 = pointAtAngle(center, r, angle1, xRot);
    const point2 = pointAtAngle(center, r, angle2, xRot);

    expect(point1.x).toBeCloseTo(a.x, 5);
    expect(point1.y).toBeCloseTo(a.y, 5);
    expect(point2.x).toBeCloseTo(b.x, 5);
    expect(point2.y).toBeCloseTo(b.y, 5);
  });

  it('should handle random test case where a === point1 and b === point2', () => {
    for (let i = 0; i < 100; i++) {
      const a = randVec();
      const b = randVec();
      if (a.equals(b)) {
        // skip this case for now
        continue;
      }
      const ogR = randPositiveVec();
      let r = ogR;
      const xRot = Math.random() * 360;
      const largeArc = Math.round(Math.random());
      const sweep = Math.round(Math.random());

      const center = centerOfArc(a, b, r, xRot, largeArc, sweep);

      r = radiiOfArc(a, b, r, xRot);

      const angle1 = parametricAngle(center, a, r, xRot);
      const angle2 = parametricAngle(center, b, r, xRot);

      const point1 = pointAtAngle(center, r, angle1, xRot);
      const point2 = pointAtAngle(center, r, angle2, xRot);

      const svgPath = `M ${a.x} ${a.y} A ${ogR.x} ${ogR.y} ${xRot} ${largeArc} ${sweep} ${b.x} ${b.y} M${center.s}\
h10h-20h10v10v-20\
${point1.ML(center)}\
${point2.ML(center)}`;
      const message = `i: ${i} a: ${a}, b: ${b}, r: ${ogR}, xRot: ${xRot}, largeArc: ${largeArc}, sweep: ${sweep}

center: ${center.s}, angle1: ${angle1}, angle2: ${angle2}, point1: ${point1.s}, point2: ${point2.s}

svgPath: ${svgPath}

`;

      expect(point1.x, message).toBeCloseTo(a.x, 5);
      expect(point1.y, message).toBeCloseTo(a.y, 5);
      expect(point2.x, message).toBeCloseTo(b.x, 5);
      expect(point2.y, message).toBeCloseTo(b.y, 5);
    }
  });
});
