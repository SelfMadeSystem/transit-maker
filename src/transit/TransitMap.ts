import { Color } from '../components/color/Color';
import { OrderedSet } from '../utils/OrderedSet';
import { id } from '../utils/id';
import { DecorationImage } from './DecorationImage';
import { History } from './History';
import { Label } from './Label';
import { ConnectionStyle, TransitConnection } from './TransitConnection';
import { TransitRoute, createDefaultRoute } from './TransitRoute';
import { StopStyle, TransitStop } from './TransitStop';
import { ActionableItem } from './types';

export type SavedStyle<Style> = {
  style: Style;
  name: string;
  id: string;
  removable: boolean;
};

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
  public routes: OrderedSet<TransitRoute> = new OrderedSet();
  public labels: Set<Label> = new Set();
  public stops: Set<TransitStop> = new Set();
  public connections: Set<TransitConnection> = new Set();
  public images: Set<DecorationImage> = new Set();
  public defaultRoute: TransitRoute;
  public history: History = new History(() => {});
  public savedStopStyles: Map<string, SavedStyle<StopStyle>> = new Map();
  public savedConnectionStyles: Map<string, SavedStyle<ConnectionStyle>> =
    new Map();

  constructor() {
    this.defaultRoute = createDefaultRoute(this);
    this.defaultRoute.style.roundRadius = 0;
    this.defaultRoute.style.zIndex = 1;
    this.defaultRoute.style.stopStyle.strokeColor = Color.WHITE;
    this.defaultRoute.style.terminusStyle.strokeColor = new Color(
      255,
      255,
      255,
    );
  }

  getRoutesStopStyles(): Map<string, SavedStyle<StopStyle>> {
    const styles = new Map<string, SavedStyle<StopStyle>>();
    for (const route of this.routes) {
      styles.set(route.name, {
        name: route.name,
        id: '__route__' + route.name,
        style: route.style.stopStyle,
        removable: false,
      });
      styles.set(route.name + ' terminus', {
        name: route.name + ' terminus',
        id: '__route__' + route.name + ' terminus',
        style: route.style.terminusStyle,
        removable: false,
      });
    }
    return styles;
  }

  getAllStopStyles(): SavedStyle<StopStyle>[] {
    return [
      ...this.savedStopStyles.values(),
      ...this.getRoutesStopStyles().values(),
    ];
  }

  addSavedStopStyle(style: SavedStyle<StopStyle>) {
    this.savedStopStyles.set(style.id, style);
  }

  removeSavedStopStyle(id: string) {
    this.savedStopStyles.delete(id);
  }

  getRoutesConnectionStyles(): Map<string, SavedStyle<ConnectionStyle>> {
    const styles = new Map<string, SavedStyle<ConnectionStyle>>();
    for (const route of this.routes) {
      styles.set(route.name, {
        name: route.name,
        id: '__route__' + route.name,
        style: route.style.connectionStyle,
        removable: false,
      });
    }
    return styles;
  }

  getAllConnectionStyles(): SavedStyle<ConnectionStyle>[] {
    return [
      ...this.savedConnectionStyles.values(),
      ...this.getRoutesConnectionStyles().values(),
    ];
  }

  addSavedConnectionStyle(style: SavedStyle<ConnectionStyle>) {
    this.savedConnectionStyles.set(style.id, style);
  }

  removeSavedConnectionStyle(id: string) {
    this.savedConnectionStyles.delete(id);
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

  connectionsByZIndex(): TransitConnection[][] {
    const connections: Map<number, TransitConnection[]> = new Map();
    const routeLen = this.routes.size;
    for (const connection of this.connections) {
      const routeIndex = this.routes.indexOf(connection.route);
      const routeZ = connection.route.style.zIndex;
      const connectionZ = connection.specificStyle.zIndex;
      const zIndex = routeZ + connectionZ + routeIndex / routeLen;
      if (!connections.has(zIndex)) {
        connections.set(zIndex, []);
      }
      connections.get(zIndex)!.push(connection);
    }

    const connectionsArray = Array.from(connections.entries());
    connectionsArray.sort((a, b) => a[0] - b[0]);
    return connectionsArray.map(c => c[1]);
  }

  draw(
    {
      bgCtx,
      ctx,
      fgCtx,
    }: {
      bgCtx: CanvasRenderingContext2D;
      ctx: CanvasRenderingContext2D;
      fgCtx: CanvasRenderingContext2D;
    },
    selected: ActionableItem | null,
  ) {
    const connectionsByZ = this.connectionsByZIndex();
    for (const image of this.images) {
      if (selected === image) {
        image.drawSelected(fgCtx);
      }
      image.draw(bgCtx);
    }
    for (const connections of connectionsByZ) {
      const iters = new Set<Generator>();
      for (const connection of connections) {
        if (selected === connection) {
          connection.drawSelected(fgCtx);
        }
        iters.add(connection.draw(ctx));
      }
      while (iters.size) {
        for (const iter of iters) {
          if (iter.next().done) {
            iters.delete(iter);
          }
        }
      }
    }
    for (const stop of this.stops) {
      if (selected === stop) {
        stop.drawSelected(fgCtx);
      }
      stop.draw(ctx);
    }
    for (const label of this.labels) {
      if (selected === label) {
        label.drawSelected(fgCtx);
      }
      label.draw(ctx);
    }
  }
}
