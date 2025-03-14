import {
  bezierLength,
  bezierPointAtLength,
  closestPointOnBezier,
  splitBezierAtLength,
} from '../math/bezier';
import {
  EllipseArc,
  ellipseArcProperties,
  findClosestPointOnArc,
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

  abstract getClosestPoint(point: Vector2): Vector2;

  getDistance(point: Vector2): number {
    return this.getClosestPoint(point).dist(point);
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

  reverse(): LCommand {
    return new LCommand(this.to, this.from);
  }

  getClosestPoint(point: Vector2): Vector2 {
    const line = this.to.sub(this.from);
    const pointLine = point.sub(this.from);
    const t = pointLine.dot(line) / line.dot(line);
    if (t < 0) {
      return this.from;
    }
    if (t > 1) {
      return this.to;
    }
    return this.from.lerp(this.to, t);
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

  getClosestPoint(point: Vector2): Vector2 {
    const line = this.to.sub(this.from);
    const pointLine = point.sub(this.from);
    const t = pointLine.dot(line) / line.dot(line);
    if (t < 0) {
      return this.from;
    }
    if (t > 1) {
      return this.to;
    }
    return this.from.lerp(this.to, t);
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

  getClosestPoint(point: Vector2): Vector2 {
    return closestPointOnBezier(
      [this.from, this.control1, this.control2, this.to],
      point,
    );
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

  getClosestPoint(point: Vector2): Vector2 {
    return closestPointOnBezier([this.from, this.control, this.to], point);
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

  getClosestPoint(point: Vector2): Vector2 {
    const { center, radii, startParametric, endParametric } =
      this.getArcProperties();

    return findClosestPointOnArc(
      center,
      radii,
      point,
      startParametric,
      endParametric,
      this.rotation,
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
  public readonly start: Vector2;
  public readonly commands: readonly NormalCommand[];
  private _closed: boolean;
  public get closed(): boolean {
    return this._closed;
  }
  private closingCommand: ZCommand | undefined;

  public getCurrent(): Vector2 {
    return this.commands[this.commands.length - 1]?.to ?? this.start;
  }

  constructor(
    start: Vector2,
    commands: NormalCommand[],
    closed: boolean = false,
  ) {
    this.start = start;
    this.commands = commands;
    this._closed = closed;

    if (this._closed) {
      this.__close();
    }
  }

  /** Internal use only */
  __close() {
    this._closed = true;
    if (
      this.closingCommand ||
      this.commands.length === 0 ||
      this.start.equals(this.getCurrent())
    ) {
      return;
    }
    this.closingCommand = new ZCommand(this.getCurrent(), this.start);
    (this.commands as NormalCommand[]).push(this.closingCommand);
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

  canMerge(path: SubPath, canReverse: boolean = false): boolean {
    return (
      !this.closed &&
      !path.closed &&
      (this.getCurrent().equals(path.start) ||
        this.start.equals(path.getCurrent()) ||
        (canReverse &&
          (this.getCurrent().equals(path.getCurrent()) ||
            this.start.equals(path.start))))
    );
  }

  merge(path: SubPath, canReverse: boolean = false): SubPath {
    if (this.closed || path.closed) {
      throw new Error('Cannot merge closed paths');
    }
    const thisS = this.start;
    const thisC = this.getCurrent();
    const pathS = path.start;
    const pathC = path.getCurrent();
    let newPath: SubPath;

    if (thisS.equals(pathC)) {
      newPath = new SubPath(
        pathS,
        [...path.commands, ...this.commands],
        thisC.equals(pathS),
      );
    } else if (thisC.equals(pathS)) {
      newPath = new SubPath(
        thisS,
        [...this.commands, ...path.commands],
        // thisS.equals(pathC), // guaranteed to be false
      );
    } else if (canReverse) {
      if (thisC.equals(pathC)) {
        newPath = new SubPath(
          thisS,
          [...this.commands, ...path.commands.map(c => c.reverse()).reverse()],
          thisS.equals(pathS),
        );
      } else if (thisS.equals(pathS)) {
        newPath = new SubPath(
          thisC,
          [...path.commands, ...this.commands.map(c => c.reverse()).reverse()],
          // thisC.equals(pathC), // guaranteed to be false
        );
      } else {
        throw new Error('Cannot merge paths');
      }
    } else {
      throw new Error('Cannot merge paths');
    }

    return newPath;
  }

  reverse(): SubPath {
    const reversedCommands = this.commands.map(c => c.reverse()).reverse();
    if (this.closed && this.closingCommand) {
      reversedCommands.shift();
    }
    const newPath = new SubPath(
      this.getCurrent(),
      reversedCommands,
      this.closed,
    );

    return newPath;
  }

  getClosestPoint(point: Vector2): Vector2 {
    let closest = this.start;
    let closestDist = this.start.dist(point);
    for (const command of this.commands) {
      const closestPoint = command.getClosestPoint(point);
      const dist = closestPoint.dist(point);
      if (dist < closestDist) {
        closest = closestPoint;
        closestDist = dist;
      }
    }
    return closest;
  }

  isPointInStroke(point: Vector2, width: number): boolean {
    for (const command of this.commands) {
      const closestPoint = command.getClosestPoint(point);
      const dist = closestPoint.dist(point);
      if (dist <= width / 2) {
        return true;
      }
    }
    return false;
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
  public readonly paths: readonly SubPath[] = [];
  public get currentPath(): SubPath | undefined {
    return this.paths[this.paths.length - 1];
  }
  private currentCommands: NormalCommand[] = [];

  constructor(paths: readonly SubPath[] = []) {
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

  getClosestPoint(point: Vector2): Vector2 {
    let closest = this.paths[0].getClosestPoint(point);
    let closestDist = closest.dist(point);
    for (const path of this.paths) {
      const closestPoint = path.getClosestPoint(point);
      const dist = closestPoint.dist(point);
      if (dist < closestDist) {
        closest = closestPoint;
        closestDist = dist;
      }
    }
    return closest;
  }

  isPointInStroke(point: Vector2, width: number): boolean {
    for (const path of this.paths) {
      if (path.isPointInStroke(point, width)) {
        return true;
      }
    }
    return false;
  }

  getCurrentPoint(): Vector2 {
    return this.currentPath?.getCurrent() ?? new Vector2(0, 0);
  }

  private addSegment(segment: NormalSegment) {
    switch (segment[0]) {
      case 'M':
        (this.paths as SubPath[]).push(
          new SubPath(
            new Vector2(segment[1], segment[2]),
            (this.currentCommands = []),
          ),
        );
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

  private addCommand(command: NormalCommand) {
    this.currentCommands.push(command);
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
      path.__close();
    }
  }

  tryMergePaths(canReverse = false): SvgPath {
    if (this.paths.length < 2) {
      return this;
    }
    const newPaths: Set<SubPath> = new Set(this.paths);

    let merged = true;

    while (merged) {
      merged = false;
      for (const path of newPaths) {
        if (path.closed) {
          continue;
        }
        for (const otherPath of newPaths) {
          if (path === otherPath || otherPath.closed) {
            continue;
          }
          if (path.canMerge(otherPath, canReverse)) {
            newPaths.delete(path);
            newPaths.delete(otherPath);
            newPaths.add(path.merge(otherPath, canReverse));
            merged = true;
            break;
          }
        }
        if (merged) {
          break;
        }
      }
    }

    return new SvgPath([...newPaths]);
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
      if (dash <= EPSILON) {
        dash = dashArray[++i % dashArray.length];
        continue;
      }
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

  toPath2D(): Path2D {
    return new Path2D(this.toString());
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
