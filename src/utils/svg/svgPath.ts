import {
  EllipseArc,
  arcLength,
  ellipseArcProperties,
  findEndAngle,
  getEllipseCircumference,
  pointAtAngle,
} from '../ellipseUtils';
import { Vector2 } from '../vec';
import {
  ASegment,
  CSegment,
  CubicCoordinates,
  LSegment,
  NormalSegment,
  PathArray,
  QSegment,
  QuadCoordinates,
  bezierTools,
  cubicTools,
  normalizePath,
  quadTools,
} from 'svg-path-commander';

function getBezierLength(
  ...points: [Vector2, Vector2, Vector2, Vector2] | [Vector2, Vector2, Vector2]
): number {
  const a = points.flatMap(p => p.a) as CubicCoordinates | QuadCoordinates;
  return bezierTools.getBezierLength(a);
}
abstract class BaseMoveCommand {
  abstract readonly type: string;
  abstract readonly from: Vector2;
  abstract readonly to: Vector2;

  abstract get length(): number;
  abstract getPointAtLength(length: number): Vector2;
  // assume (0, 1) for t (exclusive)
  abstract splitAtT(t: number): [NormalCommand, NormalCommand];

  getPointAtT(t: number): Vector2 {
    return this.getPointAtLength(this.length * t);
  }

  splitAtLength(length: number): [NormalCommand, NormalCommand] {
    const t = length / this.length;
    return this.splitAtT(t);
  }

  abstract toString(): string;
}

export class LCommand extends BaseMoveCommand {
  public readonly type = 'L';

  constructor(
    public readonly from: Vector2,
    public readonly to: Vector2,
  ) {
    super();
  }

  get length(): number {
    return this.from.dist(this.to);
  }

  getPointAtLength(length: number): Vector2 {
    return this.from.lerp(this.to, length / this.length);
  }

  splitAtT(t: number): [LCommand, LCommand] {
    const mid = this.from.lerp(this.to, t);
    return [new LCommand(this.from, mid), new LCommand(mid, this.to)];
  }

  toString(): string {
    return this.to.L;
  }
}

export class CCommand extends BaseMoveCommand {
  public readonly type = 'C';

  constructor(
    public readonly from: Vector2,
    public readonly control1: Vector2,
    public readonly control2: Vector2,
    public readonly to: Vector2,
  ) {
    super();
  }

  get length(): number {
    return getBezierLength(this.from, this.control1, this.control2, this.to);
  }

  getPointAtLength(length: number): Vector2 {
    const t = length / this.length;
    return new Vector2(
      cubicTools.getPointAtCubicLength(
        this.from.x,
        this.from.y,
        this.control1.x,
        this.control1.y,
        this.control2.x,
        this.control2.y,
        this.to.x,
        this.to.y,
        t,
      ),
    );
  }

  splitAtT(t: number): [CCommand, CCommand] {
    // cubic bezier
    // See https://pomax.github.io/bezierinfo/#splitting
    const p0 = this.from;
    const p1 = this.control1;
    const p2 = this.control2;
    const p3 = this.to;

    const p01 = p0.lerp(p1, t);
    const p12 = p1.lerp(p2, t);
    const p23 = p2.lerp(p3, t);

    const p012 = p01.lerp(p12, t);
    const p123 = p12.lerp(p23, t);

    const p0123 = p012.lerp(p123, t);

    return [
      new CCommand(p0, p01, p012, p0123),
      new CCommand(p0123, p123, p23, p3),
    ];
  }

  toString(): string {
    return `C${this.control1.s} ${this.control2.s} ${this.to.s}`;
  }
}

export class QCommand extends BaseMoveCommand {
  public readonly type = 'Q';

  constructor(
    public readonly from: Vector2,
    public readonly control: Vector2,
    public readonly to: Vector2,
  ) {
    super();
  }

  get length(): number {
    return getBezierLength(this.from, this.control, this.to);
  }

  getPointAtLength(length: number): Vector2 {
    const t = length / this.length;
    return new Vector2(
      quadTools.getPointAtQuadLength(
        this.from.x,
        this.from.y,
        this.control.x,
        this.control.y,
        this.to.x,
        this.to.y,
        t,
      ),
    );
  }

  splitAtT(t: number): [QCommand, QCommand] {
    // quadratic bezier
    const p0 = this.from;
    const p1 = this.control;
    const p2 = this.to;

    const p01 = p0.lerp(p1, t);
    const p12 = p1.lerp(p2, t);

    const p012 = p01.lerp(p12, t);

    return [new QCommand(p0, p01, p012), new QCommand(p012, p12, p2)];
  }

  toString(): string {
    return `Q${this.control.s} ${this.to.s}`;
  }
}

export class ACommand extends BaseMoveCommand {
  public readonly type = 'A';
  private arcProperties: EllipseArc | undefined;

  constructor(
    public readonly from: Vector2,
    public readonly radii: Vector2,
    public readonly rotation: number,
    public readonly large: boolean,
    public readonly sweep: boolean,
    public readonly to: Vector2,
  ) {
    super();
  }

  private getArcProperties(): EllipseArc {
    if (!this.arcProperties) {
      this.arcProperties = ellipseArcProperties(
        this.from,
        this.to,
        this.radii,
        this.rotation,
        this.large,
        this.sweep,
      );
    }
    return this.arcProperties;
  }

  get length(): number {
    return this.getArcProperties().length;
  }

  getPointAtLength(length: number): Vector2 {
    const { center, startParametric, radii, xAxisRotation } =
      this.getArcProperties();
    const angle = findEndAngle(radii, startParametric, length);
    return pointAtAngle(center, radii, angle, xAxisRotation);
  }

  splitAtT(t: number): [ACommand, ACommand] {
    const { startParametric, endParametric, radii } = this.getArcProperties();

    const totalLength = getEllipseCircumference(...radii.a);
    const arcLen = arcLength(radii, startParametric, endParametric);
    const mid = new Vector2(this.getPointAtLength(arcLen * t));

    let largeArcFlag1 = false;
    let largeArcFlag2 = false;

    if (this.large) {
      const length1 = arcLen * t;
      const length2 = arcLen * (1 - t);
      const halfLength = totalLength / 2;

      if (length1 > halfLength) {
        largeArcFlag1 = true;
      }

      if (length2 > halfLength) {
        largeArcFlag2 = true;
      }
    }

    return [
      new ACommand(
        this.from,
        radii,
        this.rotation,
        largeArcFlag1,
        this.sweep,
        mid,
      ),
      new ACommand(
        mid,
        radii,
        this.rotation,
        largeArcFlag2,
        this.sweep,
        this.to,
      ),
    ];
  }

  toString(): string {
    return `A${this.radii.s} ${this.rotation} ${
      this.large ? 1 : 0
    } ${this.sweep ? 1 : 0} ${this.to.s}`;
  }
}

export type NormalCommand = LCommand | CCommand | QCommand | ACommand;

export class SubPath {
  public start: Vector2;
  public commands: NormalCommand[];
  public closed: boolean;

  constructor(start: Vector2, commands: NormalCommand[] = []) {
    this.start = start;
    this.commands = commands;
    this.closed = false;
  }

  getLength(): number {
    return this.commands.reduce((sum, command) => sum + command.length, 0);
  }

  getCommandAtLength(length: number): {
    command: NormalCommand;
    index: number;
    at: number;
    remaining: number;
  } {
    // TODO: Handle closed paths
    let remaining = length;
    let at = 0;
    for (let i = 0; i < this.commands.length - 1; i++) {
      const command = this.commands[i];
      if (remaining < command.length) {
        return {
          command,
          index: i,
          at,
          remaining,
        };
      }
      at += command.length;
      remaining -= command.length;
    }

    return {
      command: this.commands[this.commands.length - 1],
      index: this.commands.length - 1,
      at,
      remaining,
    };
  }

  getPointAtLength(length: number): Vector2 {
    const { command, remaining } = this.getCommandAtLength(length);
    return command.getPointAtLength(remaining);
  }

  splitAtLength(length: number): [SubPath, SubPath] {
    const { command, index, remaining } = this.getCommandAtLength(length);
    const [first, second] = command.splitAtLength(remaining);
    const firstCommands = this.commands.slice(0, index);
    const secondCommands = this.commands.slice(index + 1);
    return [
      new SubPath(this.start, [...firstCommands, first]),
      new SubPath(second.from, [second, ...secondCommands]),
    ];
  }

  toString(): string {
    let str = `M${this.start.s}${this.commands.map(c => c.toString()).join('')}`;
    if (this.closed) {
      str += 'Z';
    }
    return str;
  }
}

export class SvgPath {
  public paths: SubPath[] = [];
  public get currentPath(): SubPath | undefined {
    return this.paths[this.paths.length - 1];
  }

  getLength(): number {
    return this.paths.reduce((sum, path) => sum + path.getLength(), 0);
  }

  getPointAtLength(length: number): Vector2 {
    let remaining = length;
    for (const path of this.paths) {
      if (remaining < path.getLength()) {
        return path.getPointAtLength(remaining);
      }
      remaining -= path.getLength();
    }
    return this.paths[this.paths.length - 1]?.start ?? new Vector2(0, 0);
  }

  public addSegment(segment: NormalSegment) {
    switch (segment[0]) {
      case 'M':
        this.paths.push(new SubPath(new Vector2(segment[1], segment[2])));
        break;
      case 'L':
        this.addLine(segment);
        break;
      case 'C':
        this.addCubic(segment);
        break;
      case 'Q':
        this.addQuadratic(segment);
        break;
      case 'A':
        this.addArc(segment);
        break;
      case 'Z':
        this.closePath();
        break;
    }
  }

  private addLine(segment: LSegment) {
    const path = this.currentPath;
    if (path) {
      path.commands.push(
        new LCommand(path.start, new Vector2(segment[1], segment[2])),
      );
    }
  }

  private addCubic(segment: CSegment) {
    const path = this.currentPath;
    if (path) {
      path.commands.push(
        new CCommand(
          path.start,
          new Vector2(segment[1], segment[2]),
          new Vector2(segment[3], segment[4]),
          new Vector2(segment[5], segment[6]),
        ),
      );
    }
  }

  private addQuadratic(segment: QSegment) {
    const path = this.currentPath;
    if (path) {
      path.commands.push(
        new QCommand(
          path.start,
          new Vector2(segment[1], segment[2]),
          new Vector2(segment[3], segment[4]),
        ),
      );
    }
  }

  private addArc(segment: ASegment) {
    const path = this.currentPath;
    if (path) {
      path.commands.push(
        new ACommand(
          path.start,
          new Vector2(segment[1], segment[2]),
          segment[3],
          Boolean(segment[4]),
          Boolean(segment[5]),
          new Vector2(segment[6], segment[7]),
        ),
      );
    }
  }

  private closePath() {
    const path = this.currentPath;
    if (path) {
      path.closed = true;
    }
  }

  toString(): string {
    return this.paths.map(p => p.toString()).join('');
  }

  static fromPathArray(path: PathArray): SvgPath {
    const svgPath = new SvgPath();
    const normalized = normalizePath(path);
    for (const segment of normalized) {
      svgPath.addSegment(segment);
    }
    return svgPath;
  }

  static fromString(path: string): SvgPath {
    return SvgPath.fromPathArray(normalizePath(path));
  }
}

/**
 * Create a dashed path from a path
 * @param pathStr the path to dash
 * @param dashArray the dash array
 * @returns the dashed path
 */
export function dashPath(pathStr: string, dashArray: number[]): string {
  // TODO: Support multiple subpaths
  let path = SvgPath.fromString(pathStr).currentPath!;
  let remainingLength = path.getLength();

  const dashedPath: SubPath[] = [];

  let i = 0;
  while (remainingLength > 0) {
    const dashIndex = i % dashArray.length;
    const dash = dashArray[dashIndex];
    const [first, second] = path.splitAtLength(dash);
    if (i % 2 === 0) {
      dashedPath.push(first);
    }
    if (!second) {
      break;
    }
    remainingLength -= dash;
    path = second;
    i++;
  }

  return dashedPath.map(p => p.toString()).join('');
}

/**
 * Generates an array of points on an SVG path based on a dash pattern.
 *
 * @param pathStr - The SVG path string.
 * @param dashArray - An array of numbers representing the dash pattern.
 * @returns An array of `Vector2` points on the path.
 */
export function getDashPointsOnPath(
  pathStr: string,
  dashArray: number[],
): Vector2[] {
  const path = SvgPath.fromString(pathStr);
  const totalLength = path.getLength();

  const points: Vector2[] = [];

  let i = 0;
  let currentLength = 0;
  while (currentLength < totalLength) {
    const dashIndex = i % dashArray.length;
    const dash = dashArray[dashIndex];
    const point = new Vector2(path.getPointAtLength(currentLength));
    points.push(point);
    currentLength += dash;
    i++;
  }

  return points;
}

const path = 'M 1 8 A 2 1 25 0 0 20 0';
const dashArray = [5, 2];

console.log(dashPath(path, dashArray));
console.log();
console.log(
  getDashPointsOnPath(path, dashArray)
    .map(p => `M ${p.x} ${p.y}`)
    .join(' '),
);
