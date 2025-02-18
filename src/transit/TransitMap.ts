import { id } from '../utils/id';
import { Vector2 } from '../utils/vec';
import { History } from './History';
import { Label } from './Label';
import { TransitConnection } from './TransitConnection';
import { TransitRoute, createDefaultRoute } from './TransitRoute';
import { TransitStop } from './TransitStop';
import { ActionableItem } from './types';

export class TransitMap {
  public id: number = id();
  // TODO: Add support for:
  // - multiple layers (e.g. metro, bus, train)
  //   - I'd want e.g. bus to only show when zoomed in enough
  // - distance between stops (e.g. 100m, 200m, 500m)
  // - time between stops (e.g. 1m, 2m, 5m)
  // - scenery (especially rivers and boundaries)
  // - global labels (e.g. "Zone A"/B/C/D, "Montreal", "Laval", etc.)
  // - legend of all routes, icons, etc.
  // - compass rose
  // - extra text (e.g. copyright, title, etc.)
  public routes: Set<TransitRoute>;
  public labels: Set<Label>;
  public stops: Set<TransitStop>;
  public connections: Set<TransitConnection>;
  public defaultRoute: TransitRoute;
  public history: History;

  constructor() {
    this.history = new History(() => {});
    this.routes = new Set();
    this.labels = new Set();
    this.stops = new Set();
    this.connections = new Set();
    this.defaultRoute = createDefaultRoute(this);
  }

  createStop(name: string | null, pos: Vector2): TransitStop;
  createStop(
    name: string | null,
    pos: Vector2,
    route: TransitRoute,
    from: TransitStop,
  ): [TransitStop, TransitConnection];
  createStop(
    name: string | null,
    pos: Vector2,
    route?: TransitRoute,
    from?: TransitStop,
  ) {
    const stop = new TransitStop(
      this,
      name ? [new Label(this, name)] : [],
      pos,
    );
    if (from) {
      if (!route) {
        throw new Error('Must provide route when creating stop with from');
      }
      const connection = new TransitConnection(this, from, stop, route);
      return [stop, connection];
    }
    return stop;
  }

  createLabel(text: string, pos: Vector2) {
    return new Label(this, text, pos);
  }

  createConnection(from: TransitStop, to: TransitStop, route: TransitRoute) {
    return new TransitConnection(this, from, to, route);
  }

  splitConnection(connection: TransitConnection) {
    if (!this.connections.has(connection)) {
      return;
    }
    connection.remove();
    const from = connection.from;
    const to = connection.to;

    const route = connection.route;
    const stop = new TransitStop(
      this,
      [new Label(this, 'Unnamed Stop')],
      new Vector2((from.pos.x + to.pos.x) / 2, (from.pos.y + to.pos.y) / 2),
    );

    const connection1 = new TransitConnection(this, from, stop, route);
    const connection2 = new TransitConnection(this, stop, to, route);
    connection1.style = { ...connection.style };
    connection2.style = { ...connection.style };
  }

  getSelectable(
    x: number,
    y: number,
    ctx: CanvasRenderingContext2D,
  ): ActionableItem | null {
    for (const label of this.labels) {
      if (label.isOver(x, y)) {
        return label;
      }
    }
    for (const stop of this.stops) {
      if (stop.isOver(x, y)) {
        return stop;
      }
    }
    for (const connection of this.connections) {
      if (connection.isOver(x, y, ctx)) {
        return connection;
      }
    }
    return null;
  }

  remove(selectable: ActionableItem) {
    selectable.remove();
  }

  connectionsByRoute(): Map<TransitRoute, TransitConnection[]> {
    const connections: Map<TransitRoute, TransitConnection[]> = new Map();
    for (const connection of this.connections) {
      if (!connections.has(connection.route)) {
        connections.set(connection.route, []);
      }
      connections.get(connection.route)!.push(connection);
    }
    return connections;
  }

  draw(ctx: CanvasRenderingContext2D, selected: ActionableItem | null) {
    const connectionsByRoute = this.connectionsByRoute().values();
    for (const connections of connectionsByRoute) {
      for (const connection of connections) {
        if (selected === connection) {
          connection.drawSelected(ctx);
        }
        connection.preDraw(ctx);
      }
      connections.forEach(c => c.draw(ctx));
      connections.forEach(c => c.postDraw(ctx));
    }
    for (const stop of this.stops) {
      if (selected === stop) {
        stop.drawSelected(ctx);
      }
      stop.draw(ctx);
    }
    for (const label of this.labels) {
      if (selected === label) {
        label.drawSelected(ctx);
      }
      label.draw(ctx);
    }
  }
}
