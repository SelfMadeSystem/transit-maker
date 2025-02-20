import { id } from '../utils/id';
import { DecorationImage } from './DecorationImage';
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
  public images: Set<DecorationImage>;
  public defaultRoute: TransitRoute;
  public history: History;

  constructor() {
    this.history = new History(() => {});
    this.routes = new Set();
    this.labels = new Set();
    this.stops = new Set();
    this.connections = new Set();
    this.images = new Set();
    this.defaultRoute = createDefaultRoute(this);
  }

  getSelectable(
    x: number,
    y: number,
    ctx: CanvasRenderingContext2D,
  ): ActionableItem | null {
    const labelsArray = Array.from(this.labels).reverse();
    const stopsArray = Array.from(this.stops).reverse();
    const connectionsArray = Array.from(this.connections).reverse();
    const imagesArray = Array.from(this.images).reverse();

    for (const label of labelsArray) {
      if (label.isOver(x, y)) {
        return label;
      }
    }
    for (const stop of stopsArray) {
      if (stop.isOver(x, y)) {
        return stop;
      }
    }
    for (const connection of connectionsArray) {
      if (connection.isOver(x, y, ctx)) {
        return connection;
      }
    }
    for (const image of imagesArray) {
      if (image.isOver(x, y)) {
        return image;
      }
    }
    return null;
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
    for (const image of this.images) {
      if (selected === image) {
        image.drawSelected(ctx);
      }
      image.draw(ctx);
    }
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
