import { Label } from './Label';
import { TransitConnection } from './TransitConnection';
import { TRANSFER_ROUTE, TransitRoute } from './TransitRoute';
import { TransitStop } from './TransitStop';
import { GeoLocation, SelectableItem } from './types';

export class TransitMap {
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
  public stops: Set<TransitStop>;
  public connections: Set<TransitConnection>;

  constructor() {
    this.routes = new Set([TRANSFER_ROUTE]);
    this.stops = new Set();
    this.connections = new Set();
  }

  addRoute(route: TransitRoute) {
    this.routes.add(route);
  }

  addStop(stop: TransitStop) {
    this.stops.add(stop);
  }

  addConnection(connection: TransitConnection) {
    this.connections.add(connection);
  }

  removeStop(stop: TransitStop) {
    if (!this.stops.has(stop)) {
      return;
    }
    this.stops.delete(stop);
    for (const route of stop.routes) {
      route.stops.delete(stop);
    }
    for (const connection of stop.connections) {
      const otherStop = connection.getOtherStop(stop);
      otherStop.connections.delete(connection);
      this.connections.delete(connection);
    }
  }

  removeConnection(connection: TransitConnection) {
    if (!this.connections.has(connection)) {
      return;
    }
    this.connections.delete(connection);
    connection.from.connections.delete(connection);
    connection.to.connections.delete(connection);
  }

  createStop(
    name: string | null,
    location: GeoLocation,
    route: TransitRoute,
    from?: TransitStop,
  ) {
    const stop = new TransitStop(name ? [new Label(name)] : [], location, [
      route,
    ]);
    this.addStop(stop);
    route.addStop(stop);
    if (from) {
      const connection = new TransitConnection(from, stop, route);
      this.addConnection(connection);
      from.connections.add(connection);
      stop.connections.add(connection);
      from.routes.add(route);
    }
    return stop;
  }

  createConnection(from: TransitStop, to: TransitStop, route: TransitRoute) {
    const connection = new TransitConnection(from, to, route);
    this.addConnection(connection);
    from.connections.add(connection);
    to.connections.add(connection);
    from.routes.add(route);
    to.routes.add(route);
  }

  splitConnection(connection: TransitConnection) {
    if (!this.connections.has(connection)) {
      return;
    }
    this.connections.delete(connection);
    const from = connection.from;
    const to = connection.to;

    from.connections.delete(connection);
    to.connections.delete(connection);

    const route = connection.route;
    const stop = new TransitStop(
      [new Label('Unnamed Stop')],
      {
        x: (from.location.x + to.location.x) / 2,
        y: (from.location.y + to.location.y) / 2,
      },
      [route],
    );

    this.addStop(stop);
    route.addStop(stop);
    const connection1 = new TransitConnection(from, stop, route);
    const connection2 = new TransitConnection(stop, to, route);
    connection1.style = { ...connection.style };
    connection2.style = { ...connection.style };
    this.addConnection(connection1);
    this.addConnection(connection2);
    from.connections.add(connection1);
    stop.connections.add(connection1);
    stop.connections.add(connection2);
    to.connections.add(connection2);
  }

  getSelectable(x: number, y: number): SelectableItem | null {
    for (const stop of this.stops) {
      if (stop.isOver(x, y)) {
        return stop;
      }
      for (const label of stop.labels) {
        if (label.isOver(x, y)) {
          return label;
        }
      }
    }
    for (const connection of this.connections) {
      if (connection.isOver(x, y)) {
        return connection;
      }
    }
    return null;
  }

  remove(selectable: SelectableItem) {
    selectable.remove(this);
  }

  draw(ctx: CanvasRenderingContext2D, selected: SelectableItem | null) {
    for (const connection of this.connections) {
      if (selected === connection) {
        connection.drawSelected(ctx);
      }
      connection.draw(ctx);
    }
    for (const stop of this.stops) {
      if (selected === stop) {
        stop.drawSelected(ctx);
      }
      stop.draw(ctx);
      for (const label of stop.labels) {
        if (selected === label) {
          label.drawSelected(ctx);
        }
        label.draw(ctx);
      }
    }
  }
}
