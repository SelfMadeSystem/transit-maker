import { Vector2 } from '../utils/vec';
import { Label } from './Label';
import { SnapInfo, SnapLine } from './Snapping';
import { TransitConnection } from './TransitConnection';
import { TransitMap } from './TransitMap';
import { TRANSFER_ROUTE, TransitRoute } from './TransitRoute';
import {
  ClickInfo,
  DoubleClickable,
  Movable,
  PosWithKeys,
  RightClickable,
  Selectable,
} from './types';

export type StopColor = string | 'route';

export type StopStyle = {
  fillColor: StopColor;
  strokeColor: StopColor;
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
};

export const DEFAULT_STOP_STYLE: StopStyle = {
  fillColor: '#000',
  strokeColor: 'route',
  edges: 0,
  edgeOrientation: 0,
  edgeFollowsRoute: false,
  radius: 5,
  strokeWidth: 2,
};

export class TransitStop
  implements Selectable, Movable, RightClickable, DoubleClickable
{
  // TODO: Add support for:
  // - "long" transfer stations (e.g. Lucien-L'Allier in Montreal is like 3×
  //   the width of a normal station)
  public labels: Set<Label>;
  public pos: Vector2;
  public connections: Set<TransitConnection>;
  public hidden: boolean = false;
  public style?: StopStyle;

  constructor(labels: Label[], pos: Vector2) {
    this.labels = new Set(labels);
    for (const label of this.labels) {
      label.stop = this;
    }
    this.pos = pos;
    this.connections = new Set();
  }

  getRoutes(): Set<TransitRoute> {
    const routes = new Set<TransitRoute>();
    for (const connection of this.connections) {
      routes.add(connection.route);
    }
    return routes;
  }

  getStyle(): StopStyle {
    if (this.style) {
      return this.style;
    }
    const routes = this.getRoutes();
    if (routes.size === 1) {
      return routes.values().next().value!.style.stopStyle;
    }
    return DEFAULT_STOP_STYLE;
  }

  getRoute(): TransitRoute {
    const routes = this.getRoutes();
    if (routes.size === 1) {
      return routes.values().next().value!;
    }
    return TRANSFER_ROUTE;
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

  getStopColor(c: StopColor): string {
    if (c === 'route') {
      const routes = this.getRoutes();
      if (routes.size === 1) {
        return routes.values().next().value!.style.color;
      } else {
        return TRANSFER_ROUTE.style.color;
      }
    }
    if (c) {
      return c;
    }
    return '#000';
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.hidden) {
      return;
    }
    const style = this.getStyle();
    ctx.strokeStyle = this.getStopColor(style.strokeColor);
    ctx.fillStyle = this.getStopColor(style.fillColor);
    ctx.lineWidth = style.strokeWidth;
    ctx.beginPath();
    if (style.edges === 0) {
      ctx.arc(this.pos.x, this.pos.y, style.radius, 0, 2 * Math.PI);
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
      ctx.save();
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(polyAngle);
      ctx.moveTo(style.radius * Math.cos(0), style.radius * Math.sin(0));
      for (let i = 1; i <= style.edges; i++) {
        ctx.lineTo(
          style.radius * Math.cos(angleStep * i),
          style.radius * Math.sin(angleStep * i),
        );
      }
      ctx.closePath();
      ctx.restore();
    }
    ctx.fill();
    if (style.strokeWidth > 0) {
      ctx.stroke();
    }
  }

  drawSelected(ctx: CanvasRenderingContext2D) {
    const style = this.getStyle();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(
      this.pos.x,
      this.pos.y,
      style.radius + style.strokeWidth / 2 + 2,
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
    return Math.sqrt((this.pos.x - x) ** 2 + (this.pos.y - y) ** 2) < 5;
  }

  getPos(): Vector2 {
    return this.pos;
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
    const { shiftKey, ctrlKey } = l;

    if (shiftKey) {
      const snapLines = this.getSnapLines();

      const snapInfo = new SnapInfo(l.pos, ctrlKey).addSnapLines(snapLines);
      snapInfo.calculateStuff();

      if (snapInfo.snapped) {
        this.pos = snapInfo.snapped;
        return;
      }
    }

    this.pos = l.pos;
  }

  rightClick({ map, selected }: ClickInfo): void {
    if (selected instanceof TransitStop && selected !== this) {
      map.createConnection(selected, this, selected.getRoute());
    }
  }

  remove(map: TransitMap): void {
    map.removeStop(this);
  }

  doubleClick({ map }: ClickInfo): void {
    const routes = this.getRoutes();
    const route = this.getRoute();
    map.createStop(
      routes.size === 1 ? 'Unnamed Stop' : null,
      new Vector2(this.pos.x + 10, this.pos.y + 10),
      route,
      this,
    );
  }
}
