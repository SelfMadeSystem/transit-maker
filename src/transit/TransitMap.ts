import { id } from '../utils/id';
import { Vector2 } from '../utils/vec';
import { Label, SerializedLabel } from './Label';
import { SerializedConnection, TransitConnection } from './TransitConnection';
import {
  SerializedRoute,
  TransitRoute,
  createDefaultRoute,
} from './TransitRoute';
import { SerializedStop, TransitStop } from './TransitStop';
import { SelectableItem } from './types';
import { z } from 'zod';

export const SerializedMap = z.object({
  id: z.number(),
  routes: z.array(SerializedRoute),
  labels: z.array(SerializedLabel),
  stops: z.array(SerializedStop),
  connections: z.array(SerializedConnection),
  defaultRoute: z.number(),
});
export type SerializedMap = z.infer<typeof SerializedMap>;

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

  constructor() {
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
  ): TransitStop;
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
      new TransitConnection(this, from, stop, route);
    }
    return stop;
  }

  createConnection(from: TransitStop, to: TransitStop, route: TransitRoute) {
    new TransitConnection(this, from, to, route);
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

    route.addStop(stop);
    const connection1 = new TransitConnection(this, from, stop, route);
    const connection2 = new TransitConnection(this, stop, to, route);
    connection1.style = { ...connection.style };
    connection2.style = { ...connection.style };
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

  draw(ctx: CanvasRenderingContext2D, selected: SelectableItem | null) {
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

  serialize(): SerializedMap {
    return {
      id: this.id,
      routes: [...this.routes].map(route => route.serialize()),
      labels: [...this.labels].map(label => label.serialize()),
      stops: [...this.stops].map(stop => stop.serialize()),
      connections: [...this.connections].map(connection =>
        connection.serialize(),
      ),
      defaultRoute: this.defaultRoute.id,
    };
  }
}

export function deserializeMap(content: unknown): TransitMap {
  const parseResult = SerializedMap.safeParse(content);
  if (!parseResult.success) {
    throw new Error(`Failed to parse map: ${parseResult.error.errors}`);
  }
  const serialized = parseResult.data;
  const map = new TransitMap();
  const routeMap = new Map<number, TransitRoute>();
  const stopMap = new Map<number, TransitStop>();
  const labelMap = new Map<number, Label>();
  for (const serializedRoute of serialized.routes) {
    const route = new TransitRoute(
      map,
      serializedRoute.name,
      serializedRoute.style.color,
    );
    route.id = serializedRoute.id;
    route.style = serializedRoute.style;
    routeMap.set(route.id, route);
  }
  for (const serializedLabel of serialized.labels) {
    const label = new Label(map, serializedLabel.text);
    label.id = serializedLabel.id;
    label.pos = serializedLabel.pos;
    labelMap.set(label.id, label);
  }
  for (const serializedStop of serialized.stops) {
    const stop = new TransitStop(
      map,
      serializedStop.labels.map(label => {
        const l = labelMap.get(label);
        if (!l) {
          throw new Error('Label not found');
        }
        return l;
      }),
      serializedStop.pos,
    );
    stop.id = serializedStop.id;
    stopMap.set(stop.id, stop);
  }
  for (const serializedConnection of serialized.connections) {
    const from = stopMap.get(serializedConnection.from);
    const to = stopMap.get(serializedConnection.to);
    const route = routeMap.get(serializedConnection.route);
    if (!from || !to || !route) {
      throw new Error('Connection missing from/to/route');
    }
    const connection = new TransitConnection(map, from, to, route);
    connection.id = serializedConnection.id;
    connection.style = serializedConnection.style;
  }
  map.defaultRoute = routeMap.get(serialized.defaultRoute)!;
  return map;
}
