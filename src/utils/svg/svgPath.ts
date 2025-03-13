import {
  bezierLength,
  bezierPointAtLength,
  splitBezierAtLength,
} from '../math/bezier';
import {
  EllipseArc,
  ellipseArcProperties,
  findEndAngle,
  pointAtAngle,
} from '../math/ellipseUtils';
import { EPSILON } from '../mathUtils';
import { Vector2 } from '../vec';
import {
  ASegment,
  CSegment,
  LSegment,
  NormalSegment,
  PathArray,
  QSegment,
  normalizePath,
} from 'svg-path-commander';

abstract class BaseMoveCommand {
  abstract readonly type: string;
  abstract readonly from: Vector2;
  abstract readonly to: Vector2;

  abstract get length(): number;

  getPointAtT(t: number): Vector2 {
    return this.getPointAtLength(this.length * t);
  }
  getPointAtLength(length: number): Vector2 {
    return this.getPointAtT(length / this.length);
  }

  splitAtT(t: number): [NormalCommand, NormalCommand] {
    return this.splitAtLength(this.length * t);
  }
  splitAtLength(length: number): [NormalCommand, NormalCommand] {
    return this.splitAtT(length / this.length);
  }

  abstract reverse(): NormalCommand;

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

  reverse(): LCommand {
    return new LCommand(this.to, this.from);
  }

  toString(): string {
    return this.to.L;
  }
}

// functionally identical to LCommand
export class ZCommand extends BaseMoveCommand {
  public readonly type = 'Z';

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

  reverse(): LCommand {
    return new LCommand(this.to, this.from);
  }

  toString(): string {
    return 'Z';
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
    return bezierLength([this.from, this.control1, this.control2, this.to]);
  }

  getPointAtLength(length: number): Vector2 {
    return bezierPointAtLength(
      [this.from, this.control1, this.control2, this.to],
      length,
    );
  }

  splitAtLength(length: number): [NormalCommand, NormalCommand] {
    const [first, second] = splitBezierAtLength(
      [this.from, this.control1, this.control2, this.to],
      length,
    );
    return [
      new CCommand(first[0], first[1], first[2], first[3]),
      new CCommand(second[0], second[1], second[2], second[3]),
    ];
  }

  reverse(): CCommand {
    return new CCommand(this.to, this.control2, this.control1, this.from);
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
    return bezierLength([this.from, this.control, this.to]);
  }

  getPointAtLength(length: number): Vector2 {
    return bezierPointAtLength([this.from, this.control, this.to], length);
  }

  splitAtLength(length: number): [NormalCommand, NormalCommand] {
    const [first, second] = splitBezierAtLength(
      [this.from, this.control, this.to],
      length,
    );
    return [
      new QCommand(first[0], first[1], first[2]),
      new QCommand(second[0], second[1], second[2]),
    ];
  }

  reverse(): QCommand {
    return new QCommand(this.to, this.control, this.from);
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

  getArcProperties(): EllipseArc {
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
    const { center, startParametric, radii, xAxisRotation, direction } =
      this.getArcProperties();
    const angle = findEndAngle(radii, startParametric, length * direction);
    return pointAtAngle(center, radii, angle, xAxisRotation);
  }

  splitAtT(t: number): [ACommand, ACommand] {
    const { radii, length, ellipseLength } = this.getArcProperties();

    const mid = new Vector2(this.getPointAtLength(length * t));

    let largeArcFlag1 = false;
    let largeArcFlag2 = false;

    if (this.large) {
      const length1 = length * t;
      const length2 = length * (1 - t);
      const halfLength = ellipseLength / 2;

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

  reverse(): ACommand {
    return new ACommand(
      this.to,
      this.radii,
      this.rotation,
      this.large,
      !this.sweep,
      this.from,
    );
  }

  toString(): string {
    return `A${this.radii.s} ${this.rotation} ${
      this.large ? 1 : 0
    } ${this.sweep ? 1 : 0} ${this.to.s}`;
  }
}

export type NormalCommand =
  | LCommand
  | ZCommand
  | CCommand
  | QCommand
  | ACommand;

export class SubPath {
  public start: Vector2;
  public commands: NormalCommand[];
  public closed: boolean;
  private closingCommand: ZCommand | undefined;

  public getCurrent(): Vector2 {
    return this.commands[this.commands.length - 1]?.to ?? this.start;
  }

  constructor(start: Vector2, commands: NormalCommand[] = []) {
    this.start = start;
    this.commands = commands;
    this.closed = false;
  }

  public close() {
    this.closed = true;
    if (
      this.closingCommand ||
      this.commands.length === 0 ||
      this.start.equals(this.getCurrent())
    ) {
      return;
    }
    this.closingCommand = new ZCommand(this.getCurrent(), this.start);
    this.commands.push(this.closingCommand);
  }

  addCommand(command: NormalCommand) {
    this.commands.push(command);
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

  splitAtLength(length: number): [SubPath] | [SubPath, SubPath] {
    if (length <= 0 || length >= this.getLength()) {
      return [this];
    }
    const { command, index, remaining } = this.getCommandAtLength(length);
    const [first, second] = command.splitAtLength(remaining);
    const firstCommands = this.commands.slice(0, index);
    const secondCommands = this.commands.slice(index + 1);
    const firstPath = new SubPath(this.start, [...firstCommands, first]);
    const secondPath = new SubPath(second.from, [second, ...secondCommands]);
    return [firstPath, secondPath];
  }

  canMerge(path: SubPath): boolean {
    return (
      !this.closed &&
      !path.closed &&
      (this.getCurrent().equals(path.start) ||
        this.start.equals(path.getCurrent()))
    );
  }

  merge(path: SubPath): SubPath {
    if (this.closed || path.closed) {
      throw new Error('Cannot merge closed paths');
    }
    if (path.getCurrent().equals(this.start)) {
      return path.merge(this);
    }
    if (!this.getCurrent().equals(path.start)) {
      throw new Error('Paths must be contiguous to merge');
    }
    return new SubPath(this.start, [...this.commands, ...path.commands]);
  }

  reverse(): SubPath {
    const reversedCommands = this.commands.map(c => c.reverse()).reverse();
    const newPath = new SubPath(this.getCurrent(), reversedCommands);
    if (this.closed) {
      if (this.closingCommand) {
        reversedCommands.shift();
      }
      newPath.close();
    }

    return newPath;
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

  constructor(paths: SubPath[] = []) {
    this.paths = paths;
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

  public addCommand(command: NormalCommand) {
    const path = this.currentPath;
    if (path) {
      path.addCommand(command);
    }
  }

  public getCurrentPoint(): Vector2 {
    return this.currentPath?.getCurrent() ?? new Vector2(0, 0);
  }

  private addLine(segment: LSegment) {
    this.addCommand(
      new LCommand(this.getCurrentPoint(), new Vector2(segment[1], segment[2])),
    );
  }

  private addCubic(segment: CSegment) {
    this.addCommand(
      new CCommand(
        this.getCurrentPoint(),
        new Vector2(segment[1], segment[2]),
        new Vector2(segment[3], segment[4]),
        new Vector2(segment[5], segment[6]),
      ),
    );
  }

  private addQuadratic(segment: QSegment) {
    this.addCommand(
      new QCommand(
        this.getCurrentPoint(),
        new Vector2(segment[1], segment[2]),
        new Vector2(segment[3], segment[4]),
      ),
    );
  }

  private addArc(segment: ASegment) {
    this.addCommand(
      new ACommand(
        this.getCurrentPoint(),
        new Vector2(segment[1], segment[2]),
        segment[3],
        Boolean(segment[4]),
        Boolean(segment[5]),
        new Vector2(segment[6], segment[7]),
      ),
    );
  }

  private closePath() {
    const path = this.currentPath;
    if (path) {
      path.close();
    }
  }

  reverse(): SvgPath {
    return new SvgPath(this.paths.map(p => p.reverse()).reverse());
  }

  dashPath(dashArray: number[]): SvgPath {
    let path = this.paths[0];
    let pathIndex = 0;
    let remainingLength = this.getLength();
    let dash = dashArray[0];

    const dashedPath: SubPath[] = [];

    let i = 0;
    while (remainingLength > 0) {
      const [first, second] = path.splitAtLength(dash);
      if (i % 2 === 0) {
        dashedPath.push(first);
      }
      if (second) {
        path = second;
      } else {
        if (pathIndex === this.paths.length - 1) {
          break;
        }

        if (
          dashedPath.length > 2 &&
          dashedPath[0].start.equals(
            dashedPath[dashedPath.length - 1].getCurrent(),
          )
        ) {
          dashedPath[0] = dashedPath[0].merge(
            dashedPath[dashedPath.length - 1],
          );
          dashedPath.pop();
        }

        path = this.paths[++pathIndex];
        dash = 0; // on browsers, it resets when going to the next path
        i = -1;
      }
      const length = first.getLength();
      dash -= length;
      if (dash <= EPSILON) {
        dash = dashArray[++i % dashArray.length];
      }
      remainingLength -= length;
    }

    if (
      dashedPath.length > 2 &&
      dashedPath[0].start.equals(dashedPath[dashedPath.length - 1].getCurrent())
    ) {
      dashedPath[0] = dashedPath[0].merge(dashedPath[dashedPath.length - 1]);
      dashedPath.pop();
    }

    return new SvgPath(dashedPath);
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
