import { Color } from '../components/color/Color';
import { Path2Dpp } from '../utils/Path2Dpp';
import { id } from '../utils/id';
import { Vector2 } from '../utils/vec';
import { Action, connectStopsAction } from './Action';
import { Label } from './Label';
import { SnapInfo, SnapLine } from './Snapping';
import { TransitConnection } from './TransitConnection';
import { TransitMap } from './TransitMap';
import { RouteColor, TransitRoute } from './TransitRoute';
import { Actionable, ClickInfo, Movable, PosWithKeys } from './types';
import { getPointAtLength, getPropertiesAtPoint } from 'svg-path-commander';

export type StopStyle = {
  fillColor: RouteColor;
  strokeColor: RouteColor;
  /**
   * 0: circle :)
   * 1-2: not supported
   * 3+: polygon with `edges` edges and `radius` radius
   */
  edges: number;
  /**
   * Two orientations for even-numbered edges and three for odd-numbered edges.
   */
  edgeOrientation: number;
  edgeFollowsRoute: boolean;
  radius: number;
  strokeWidth: number;
  margin: number;
  clearFill: boolean;
  clearStroke: boolean;
};

export type SavedStopStyle = {
  style: StopStyle;
  name: string;
  id: string;
  removable: boolean;
};

export const DEFAULT_STOP_STYLE: StopStyle = {
  fillColor: Color.BLACK,
  strokeColor: 'route',
  edges: 0,
  edgeOrientation: 0,
  edgeFollowsRoute: false,
  radius: 5,
  strokeWidth: 2,
  margin: 2,
  clearFill: false,
  clearStroke: false,
};

export type RoundingCalculation = {
  ogPos: Vector2;
  centerOffset: Vector2;
  center: Vector2;
  stopOffset: Vector2;
  stop: Vector2;
  radius: number;
  edgeDist: number;
  angle: number;
} | null;

export class TransitStop implements Actionable, Movable {
  public id: number = id();
  // TODO: Add support for:
  // - "long" transfer stations (e.g. Lucien-L'Allier in Montreal is like 3×
  //   the width of a normal station)
  public map: TransitMap;
  public labels: Set<Label>;
  public pos: Vector2;
  public linked: {
    // FIXME: It still stays linked if the connection is removed
    // Either remove this stop with the connection or remove the link when the
    // connection is removed
    connection: TransitConnection;
  } | null = null;
  public connections: Set<TransitConnection>;
  public hidden: boolean = false;
  public roundRadius: number | undefined;
  public style?: SavedStopStyle;

  constructor(map: TransitMap, labels: Label[], pos: Vector2) {
    this.map = map;
    this.labels = new Set(labels);
    this.pos = pos;
    this.connections = new Set();
    this.reAdd(true);
  }

  reAdd(first = false): void {
    this.map.stops.add(this);
    for (const label of this.labels) {
      label.stop = this;
    }
    if (first) return;
    for (const connection of this.connections) {
      connection.reAdd();
    }
    for (const label of this.labels) {
      label.stop = this;
      label.reAdd();
    }
  }

  remove(): void {
    if (!this.map.stops.has(this)) {
      return;
    }
    this.map.stops.delete(this);
    for (const connection of this.connections) {
      const otherStop = connection.getOtherStop(this);
      otherStop.removeConnection(connection);
      this.map.connections.delete(connection);
    }
    for (const label of this.labels) {
      label.stop = null;
      label.remove();
    }
  }

  addConnection(connection: TransitConnection) {
    if (this.connections.has(connection)) {
      return; // don't unnecessarily update lateral connections
    }
    this.connections.add(connection);
    this.updateLateralConnections(connection.getOtherStop(this));
  }

  removeConnection(connection: TransitConnection) {
    if (!this.connections.has(connection)) {
      return;
    }
    this.connections.delete(connection);
    this.updateLateralConnections(connection.getOtherStop(this));
  }

  getLateralOffset() {
    const firstConnection = Array.from(this.connections)[0];
    if (!firstConnection) {
      return 0;
    }
    return firstConnection.route.style.lateralOffset;
  }

  updateLateralConnections(otherStop: TransitStop) {
    const connections = Array.from(this.connections).filter(
      c => c.getOtherStop(this) === otherStop,
    );
    if (connections.length > 0) {
      connections.forEach(
        (c, i) =>
          (c.lateralOffset =
            (i - (connections.length - 1) / 2) * (c.to === this ? -1 : 1)),
      );
    }
  }

  normalizeConnections() {
    for (const connection of this.connections) {
      connection.setFrom(this);
    }
  }

  hasRoute(connection: TransitConnection): boolean {
    for (const otherConnection of this.connections) {
      if (otherConnection.route === connection.route) {
        return true;
      }
    }
    return false;
  }

  getRoutes(): Set<TransitRoute> {
    const routes = new Set<TransitRoute>();
    for (const connection of this.connections) {
      routes.add(connection.route);
    }
    if (this.linked) {
      routes.add(this.linked.connection.route);
    }
    return routes;
  }

  getStyle(): StopStyle {
    if (this.hidden) {
      return {
        fillColor: Color.BLACK,
        strokeColor: Color.BLACK,
        edges: 0,
        edgeOrientation: 0,
        edgeFollowsRoute: false,
        radius: 5,
        strokeWidth: 0,
        margin: 0,
        clearFill: false,
        clearStroke: false,
      };
    }
    if (this.style) {
      return this.style.style;
    }
    const key = this.connections.size === 1 ? 'terminusStyle' : 'stopStyle';
    const routes = this.getRoutes();
    if (routes.size === 1) {
      return routes.values().next().value!.style[key];
    }
    return this.map.defaultRoute.style[key];
  }

  getRoute(): TransitRoute {
    const routes = this.getRoutes();
    if (routes.size === 1) {
      return routes.values().next().value!;
    }
    return this.map.defaultRoute;
  }

  connectionsByStop(): Map<TransitStop, TransitConnection[]> {
    const connections: Map<TransitStop, TransitConnection[]> = new Map();
    for (const connection of this.connections) {
      const stop = connection.getOtherStop(this);
      if (!connections.has(stop)) {
        connections.set(stop, []);
      }
      connections.get(stop)!.push(connection);
    }
    return connections;
  }

  setLabels(labels: Label[]) {
    this.labels = new Set(labels);
    for (const label of this.labels) {
      label.stop = this;
    }
  }

  addLabel(label: Label) {
    this.labels.add(label);
    label.stop = this;
  }

  getStopColor(c: RouteColor): Color {
    if (c === 'route') {
      const routes = this.getRoutes();
      if (routes.size === 1) {
        return routes.values().next().value!.style.color;
      } else {
        return this.map.defaultRoute.style.color;
      }
    }
    return c;
  }

  getDrawPos() {
    return this.calculateRoundingStuff()?.stop ?? this.pos;
  }

  calculateRoundingStuff(): RoundingCalculation {
    // FIXME: Incorrect when connection has lateral offset
    const connectionsByStop = this.connectionsByStop();
    // if (this.roundingStuffCache !== undefined) {
    //   return this.roundingStuffCache;
    // }
    if (connectionsByStop.size !== 2) {
      return null;
    }
    const route = this.getRoute();

    let radius = this.roundRadius ?? route.style.roundRadius;
    if (radius <= 0) {
      return null;
    }

    let [[connection1], [connection2]] = Array.from(connectionsByStop.values());

    const epsilon = 1e-6;
    if (
      connection1.getLineLength() < epsilon ||
      connection2.getLineLength() < epsilon
    ) {
      return null;
    }
    if (connection1.isParallelTo(connection2)) {
      return null;
    }

    const otherPoint1 = connection1.getOtherDrawPos(this, false);
    const otherPoint2 = connection2.getOtherDrawPos(this, false);

    const vector1 = otherPoint1.sub(this.pos);
    const vector2 = otherPoint2.sub(this.pos);

    const checkAngle = vector1.angleTo(vector2);

    if (checkAngle < Math.PI / 2) {
      [connection1, connection2] = [connection2, connection1];
    }

    const dirThis = connection2.getDirectionVector(this);
    const dirOther = connection1.getDirectionVector(this);
    const angle = dirThis.angleBetween(dirOther) / 2;

    if (route.style.roundDistInstead && angle < Math.PI / 4) {
      radius = radius * Math.tan(angle);
    }

    const minDist = Math.min(vector1.length(), vector2.length());
    if (radius / Math.tan(angle) > minDist) {
      radius = minDist * Math.tan(angle);
    }

    const avgDir = dirThis.add(dirOther).normalize();
    const dist = radius / Math.sin(angle);
    const centerOffset = avgDir.mult(dist);
    const center = this.pos.add(centerOffset);
    const stopOffset = avgDir.mult(dist - radius);
    const stop = this.pos.add(stopOffset);
    const edgeDist = radius / Math.tan(angle);

    return {
      ogPos: this.pos,
      centerOffset,
      center,
      stopOffset,
      stop,
      radius,
      edgeDist,
      angle,
    };
  }

  getPath(): Path2Dpp {
    const path = new Path2Dpp();
    const style = this.getStyle();
    if (style.edges === 0) {
      path.arc(this.pos.x, this.pos.y, style.radius, 0, 2 * Math.PI);
    } else {
      const { edgeOrientation, edges, edgeFollowsRoute } = style;
      const angleStep = (2 * Math.PI) / edges;
      let polyAngle = 0;
      if (this.connections.size > 0 && edgeFollowsRoute) {
        polyAngle =
          Array.from(this.connections)
            .map(connection => connection.getAngle(this))
            .reduce((sum, angle) => sum + angle, 0) / this.connections.size;
      }

      if (edgeOrientation === 1 || edgeOrientation === 3) {
        polyAngle += (Math.PI / edges) * (edges % 2 === 0 ? 1 : 0.5);
        if (edgeOrientation === 3) {
          polyAngle += Math.PI;
        }
      } else if (edgeOrientation === 2) {
        polyAngle += Math.PI;
      }
      path.moveTo(
        this.pos.x + style.radius * Math.cos(polyAngle),
        this.pos.y + style.radius * Math.sin(polyAngle),
      );
      for (let i = 1; i <= style.edges; i++) {
        path.lineTo(
          this.pos.x + style.radius * Math.cos(angleStep * i + polyAngle),
          this.pos.y + style.radius * Math.sin(angleStep * i + polyAngle),
        );
      }
      path.closePath();
    }
    return path;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.hidden) {
      return;
    }
    ctx.save();
    const roundingStuff = this.calculateRoundingStuff();
    if (roundingStuff) {
      ctx.translate(roundingStuff.stopOffset.x, roundingStuff.stopOffset.y);
    }
    const style = this.getStyle();
    const strokeColor = this.getStopColor(style.strokeColor);
    const fillColor = this.getStopColor(style.fillColor);
    ctx.strokeStyle = strokeColor.hex();
    ctx.fillStyle = fillColor.hex();
    ctx.lineWidth = style.strokeWidth;
    const path = this.getPath().toPath2D();
    if (style.margin > 0 || style.clearFill || style.clearStroke) {
      ctx.save();
      ctx.strokeStyle = 'black';
      ctx.fillStyle = 'black';
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = style.strokeWidth + style.margin;
      if (style.margin > 0 || style.clearStroke) ctx.stroke(path);
      if (style.clearFill) ctx.fill(path);
      ctx.restore();
    }
    ctx.fill(path);
    if (style.strokeWidth > 0) {
      ctx.stroke(path);
    }
    ctx.restore();
  }

  drawSelected(ctx: CanvasRenderingContext2D) {
    const style = this.getStyle();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const pos = this.getDrawPos();
    ctx.arc(
      pos.x,
      pos.y,
      style.radius + style.strokeWidth / 2 + style.margin + 2,
      0,
      2 * Math.PI,
    );
    ctx.stroke();

    // const snapLines = this.getSnapLines();
    // for (const snapLine of snapLines) {
    //   snapLine.debugDraw(ctx);
    // }

    // const snapInfo = new SnapInfo(this.pos, true).addSnapLines(snapLines);
    // snapInfo.calculateStuff();

    // snapInfo.debugDraw(ctx);
  }

  isOver(x: number, y: number) {
    const pos = this.getDrawPos();
    const style = this.getStyle();

    return (
      pos.distSq(new Vector2(x, y)) <=
      (style.radius + style.strokeWidth / 2 + style.margin) ** 2
    );
  }

  getPos(): Vector2 {
    return this.pos;
  }

  setPos(pos: Vector2): void {
    this.pos = pos;
  }

  getSnapLines(): SnapLine[] {
    const snapLines = [];

    for (const connection of this.connections) {
      snapLines.push(...connection.getSnapLines(this));
    }

    return snapLines;
  }

  getConnectingStops(): TransitStop[] {
    return Array.from(this.connections).map(connection =>
      connection.getOtherStop(this),
    );
  }

  moveTo(l: PosWithKeys) {
    const { shiftKey, ctrlKey, pos } = l;
    if (this.linked) {
      const { connection } = this.linked;
      const { pathpp, length } = connection.getPath();
      if (shiftKey) {
        const snapDists = [1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4];
        const poses = snapDists.map(d =>
          getPointAtLength(pathpp.getSVGPath().segments, length * d),
        );

        let minPos = poses[0];
        let minDist = Math.hypot(minPos.x - pos.x, minPos.y - pos.y);
        for (let i = 1; i < poses.length; i++) {
          const dist = Math.hypot(poses[i].x - pos.x, poses[i].y - pos.y);
          if (dist < minDist) {
            minDist = dist;
            minPos = poses[i];
          }
        }

        this.pos = new Vector2(minPos);
      } else {
        const props = getPropertiesAtPoint(pathpp.getSVGPath().segments, pos);

        this.pos = new Vector2(props.closest);
      }
      return;
    }

    if (shiftKey) {
      const snapLines = this.getSnapLines();

      const snapInfo = new SnapInfo(pos, ctrlKey).addSnapLines(snapLines);
      snapInfo.calculateStuff();

      if (snapInfo.snapped) {
        this.pos = snapInfo.snapped;
        return;
      }
    }

    this.pos = pos;
  }

  inheritStyle(stop: TransitStop) {
    if (stop.style) this.style = { ...stop.style };
    this.hidden = stop.hidden;
  }

  rightClick({ selected }: ClickInfo): void {
    if (selected instanceof TransitStop && selected !== this) {
      connectStopsAction(this.map, this, selected);
    }
  }

  doubleClick(a: ClickInfo): void {
    if (a.shiftKey) {
      this.createSplitConnections();
    } else {
      this.createConnection();
    }
  }

  getDiffIfOneConnectionElse(v: Vector2): Vector2 {
    const connectionsByStop = this.connectionsByStop();
    if (connectionsByStop.size === 1) {
      const [connection] = Array.from(connectionsByStop.values())[0];
      const p1 = connection.getDrawPos(this);
      const p2 = connection.getOtherDrawPos(this);
      const diff = p1.sub(p2);
      if (diff.length() < 1) {
        return v;
      }
      return diff;
    }
    return v;
  }

  createConnection() {
    const connectionsByStop = this.connectionsByStop();
    const vals = Array.from(connectionsByStop.values());

    const diff = this.getDiffIfOneConnectionElse(new Vector2(20, 20));
    const stop = new TransitStop(this.map, [], this.pos.add(diff));
    // FIXME: setting stop.style to this.style makes them share the same style
    // object.
    // TODO: I like this idea, but not the unintentional implementation. (I
    // didn't mean to; I wanted to do = { ...this.style }). I think having a
    // 'global' shared list of styles would be a good idea.
    stop.style = this.style ? { ...this.style } : this.style;
    if (this.labels.size > 0) {
      const label = Array.from(this.labels)[0];
      const newLabel = new Label(this.map, label.text, label.pos);
      newLabel.inheritStyle(label);
      stop.addLabel(newLabel);
    }

    if (vals.length === 1 && vals[0].length > 1) {
      this.normalizeConnections();
      [...this.connections]
        .sort((a, b) => b.lateralOffset - a.lateralOffset)
        .forEach(connection => {
          const c = new TransitConnection(
            this.map,
            this,
            stop,
            connection.route,
          );
          c.inheritStyle(connection);
        });
      this.updateLateralConnections(stop);
    } else if (vals.length === 1) {
      const onlyConnection = vals[0][0];
      const connection = new TransitConnection(
        this.map,
        this,
        stop,
        this.getRoute(),
      );
      connection.inheritStyle(onlyConnection);
    } else {
      new TransitConnection(this.map, this, stop, this.getRoute());
    }

    const action = {
      label: 'Create Connection',
      undo: () => {
        stop.remove();
      },
      redo: () => {
        stop.reAdd();
      },
      data: stop,
    } satisfies Action;

    this.map.history.add(action);
    return action;
  }

  createSplitConnections() {
    const connectionsByStop = this.connectionsByStop();
    const vals = Array.from(connectionsByStop.values());

    if (vals.some(connections => connections.length > 1)) {
      for (const connections of vals) {
        if (connections.length > 1) {
          const diff = this.pos.sub(connections[0].getOtherStop(this).pos);
          const orth = diff.normalize().cw90();
          const offset = this.getLateralOffset();

          const newStops: TransitStop[] = [];
          for (let i = 0; i < connections.length; i++) {
            const connection = connections[i];
            const lateralOffset = connection.lateralOffset;
            const sign = connection.to === this ? 1 : -1;
            const lateralVector = orth.mult(lateralOffset * offset * sign);
            const newPos = this.pos.add(diff).add(lateralVector);
            const newStop = new TransitStop(this.map, [], newPos);
            newStop.inheritStyle(this);
            newStops.push(newStop);
            const newC = new TransitConnection(
              this.map,
              this,
              newStop,
              connection.route,
            );
            newC.inheritStyle(connection);
            newC.setWhichConnection(this, connection);
          }

          const action = {
            label: 'Split Connections',
            undo: () => {
              newStops.forEach(stop => stop.remove());
            },
            redo: () => {
              newStops.forEach(stop => stop.reAdd());
            },
            data: newStops,
          } satisfies Action;

          this.map.history.add(action);
          return action;
        }
      }
      return null;
    } else {
      return this.createConnection();
    }
  }
}
