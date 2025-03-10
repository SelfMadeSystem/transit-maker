import {
  arcLength,
  centerOfArc,
  findCircleCenter,
  findEllipseCenter,
  findEndAngle,
  parametricAngle,
  pointAtAngle,
  radiiOfArc,
} from './ellipseUtils';
import { Vector2 } from './vec';
import { describe, expect, it } from 'vitest';

function randFloat() {
  return Math.random() * 100 - 50;
}

function randPositive(zero = true) {
  if (zero && Math.random() < 0.25) {
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

function randPositiveVec(zero = true) {
  if (Math.random() < 0.25) {
    const l = randPositive(zero);
    return new Vector2(l, l);
  }
  return new Vector2(randPositive(zero), randPositive(zero));
}

describe('findCircleCenter', () => {
  it('should find the correct center of a circle', () => {
    const a = new Vector2(0, 0);
    const b = new Vector2(4, 0);
    const r = 2;
    const center = findCircleCenter(a, b, r);
    expect(center.x).toBeCloseTo(2);
    expect(center.y).toBeCloseTo(0);
  });
});

describe('findEllipseCenter', () => {
  it('should find the correct center of an ellipse', () => {
    const a = new Vector2(0, 0);
    const b = new Vector2(4, 0);
    const r = new Vector2(2, 3);
    const center = findEllipseCenter(a, b, r);
    expect(center.x).toBeCloseTo(2);
    expect(center.y).toBeCloseTo(0);
  });
});

describe('parametricAngle', () => {
  it('should calculate the correct parametric angle', () => {
    const center = new Vector2(0, 0);
    const point = new Vector2(1, 1);
    const r = new Vector2(1, 1);
    const angle = parametricAngle(center, point, r);
    expect(angle).toBeCloseTo(Math.PI / 4);
  });
});

describe('pointAtAngle', () => {
  it('should return the correct point at a given angle', () => {
    const center = new Vector2(0, 0);
    const r = new Vector2(1, 1);
    const angle = Math.PI / 4;
    const point = pointAtAngle(center, r, angle);
    expect(point.x).toBeCloseTo(Math.sqrt(2) / 2);
    expect(point.y).toBeCloseTo(Math.sqrt(2) / 2);
  });
});

describe('radiiOfArc', () => {
  it('should get the correct radii of an ellipse arc', () => {
    const from = new Vector2(0, 0);
    const to = new Vector2(4, 0);
    const radii = new Vector2(3, 2);
    const xAxisRotation = 0;
    const result = radiiOfArc(from, to, radii, xAxisRotation);
    expect(result.x).toBeCloseTo(3);
    expect(result.y).toBeCloseTo(2);
  });
});

describe('centerOfArc', () => {
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
});

describe('arcLength', () => {
  it('should compute the correct length of an elliptical arc', () => {
    const radii = new Vector2(3, 2);
    const t1 = 0;
    const t2 = Math.PI / 2;
    const length = arcLength(radii, t1, t2);
    expect(length).toBeCloseTo(3.966359897322647);
  });
});

describe('findEndAngle', () => {
  it('should return the same angle if length is zero', () => {
    const radii = new Vector2(3, 2);
    const t = 1;
    const len = 0;
    const endAngle = findEndAngle(radii, t, len);
    expect(endAngle).toBeCloseTo(t);
  });

  it('should handle the case where radii.x equals radii.y', () => {
    const radii = new Vector2(2, 2);
    const t = 1;
    const len = 3;
    const endAngle = findEndAngle(radii, t, len);
    expect(endAngle).toBeCloseTo(t + len / radii.x);
  });

  it('should handle the case where radii.x is less than radii.y', () => {
    const radii = new Vector2(2, 3);
    const t = Math.PI / 2;
    const len = 3.966359897322647;
    const endAngle = findEndAngle(radii, t, len);
    expect(endAngle).toBeCloseTo(Math.PI, 5);
  });

  it('should handle the case where radii.x is greater than radii.y', () => {
    const radii = new Vector2(3, 2);
    const t = Math.PI / 2;
    const len = 3.966359897322647;
    const endAngle = findEndAngle(radii, t, len);
    expect(endAngle).toBeCloseTo(Math.PI, 5);
  });
});

describe('Fuzz tests', () => {
  it('[centerOfArc/parametricAngle/pointAtAngle] should handle random test case where a === point1 and b === point2', () => {
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

  it('[arcLength/findEndAngle] should handle random test case where t2 === result of findEndAngle', () => {
    const failingCases = [];

    for (let i = 0; i < 100; i++) {
      const radii = randPositiveVec(false).round();
      const m = Math.max(radii.y / radii.x, radii.x / radii.y);

      const t1 = Math.random() * (2 * Math.PI - 0.1);
      const t2 = t1 + Math.random() * (Math.PI * 2 - t1 - 0.1) + 0.1;
      const len = arcLength(radii, t1, t2);
      const endAngle = findEndAngle(radii, t1, len);

      // const message = `i: ${i} m: ${m} radii: ${radii}, t1: ${t1}, t2: ${t2}, len: ${len}, endAngle: ${endAngle}`;

      const delta = Math.abs(endAngle - t2);
      // FIXME: very lenient for large m. I would like for this to be more accurate
      // I'm not sure if it's arcLength or findEndAngle that's the problem, but it's
      // probably findEndAngle
      const maxEpsilon = m < 5 ? 1e-5 : m < 15 ? 1e-3 : 5e-2;
      if (Math.abs(delta) > maxEpsilon) {
        failingCases.push(
          `m: ${m} radii: ${radii} delta: ${delta} len: ${len} maxEpsilon: ${maxEpsilon}`,
        );
      }
    }

    if (failingCases.length > 0) {
      console.error('Failing cases:', failingCases);
    }

    expect(failingCases.length).toBe(0);
  });
});
