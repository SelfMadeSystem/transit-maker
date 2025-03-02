import { Color } from '../components/color/Color';
import { OrderedSet } from '../utils/OrderedSet';
import { clone } from '../utils/clone';
import { DrawingContext, SvgDrawingContext } from '../utils/drawingContext';
import { id } from '../utils/id';
import { DecorationImage } from './DecorationImage';
import { History } from './History';
import { Label } from './Label';
import { ConnectionStyle, TransitConnection } from './TransitConnection';
import { TransitRoute, createDefaultRoute } from './TransitRoute';
import { DEFAULT_STOP_STYLE, StopStyle, TransitStop } from './TransitStop';
import { ActionableItem, LayeredDrawableItem } from './types';

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
  public backgroundColor: Color = Color.BLACK; // I like MTL's black background
  public history: History = new History(() => {});
  public savedStopStyles: Map<string, SavedStyle<StopStyle>> = new Map();
  public savedConnectionStyles: Map<string, SavedStyle<ConnectionStyle>> =
    new Map();
  public defaultConnectionStyle: SavedStyle<ConnectionStyle> = {
    style: {
      strokes: [
        {
          id: 0,
          color: Color.TRANSPARENT,
          width: 4,
          clear: true,
          strokeType: 'solid',
          lineCap: 'butt',
        },
        {
          id: 1,
          color: 'route',
          width: 2,
          clear: false,
          strokeType: 'solid',
          lineCap: 'round',
        },
      ],
    },
    id: '__default_connection_style__',
    name: 'Default Connection Style',
    removable: false,
  };
  public defaultStopStyle: SavedStyle<StopStyle> = {
    style: clone(DEFAULT_STOP_STYLE),
    id: '__default_stop_style__',
    name: 'Default Stop Style',
    removable: false,
  };

  constructor() {
    this.defaultRoute = createDefaultRoute(this);
    this.defaultRoute.style.roundRadius = 0;
    this.defaultRoute.style.zIndex = 1;
  }

  getAllStopStyles(): SavedStyle<StopStyle>[] {
    return [...this.savedStopStyles.values(), this.defaultStopStyle];
  }

  addSavedStopStyle(style: SavedStyle<StopStyle>) {
    this.savedStopStyles.set(style.id, style);
  }

  removeSavedStopStyle(id: string) {
    this.savedStopStyles.delete(id);
  }

  getAllConnectionStyles(): SavedStyle<ConnectionStyle>[] {
    return [
      ...this.savedConnectionStyles.values(),
      this.defaultConnectionStyle,
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

  stuffByZIndex(): LayeredDrawableItem[][] {
    const connections: Map<number, LayeredDrawableItem[]> = new Map();
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

    for (const stop of this.stops) {
      const route = stop.getRoute();
      const routeIndex = this.routes.indexOf(route);
      const routeZ = route.style.zIndex;
      const stopZ = stop.zIndex;
      const connectionZ = route.style.stopZIndex;
      const zIndex = routeZ + connectionZ + stopZ + routeIndex / routeLen;
      if (!connections.has(zIndex)) {
        connections.set(zIndex, []);
      }
      connections.get(zIndex)!.push(stop);
    }

    const connectionsArray = Array.from(connections.entries());
    connectionsArray.sort((a, b) => a[0] - b[0]);
    return connectionsArray.map(c => c[1]);
  }

  draw(
    {
      ctx,
      fgCtx,
    }: {
      ctx: DrawingContext;
      fgCtx?: CanvasRenderingContext2D;
    },
    selected: ActionableItem | null,
  ) {
    const connectionsByZ = this.stuffByZIndex();
    for (const image of this.images) {
      if (fgCtx && selected === image) {
        image.drawSelected(fgCtx);
      }
      image.draw(ctx);
    }
    for (const connections of connectionsByZ) {
      const iters = new Set<Generator>();
      for (const connection of connections) {
        if (fgCtx && selected === connection) {
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
    for (const label of this.labels) {
      if (fgCtx && selected === label) {
        label.drawSelected(fgCtx);
      }
      label.draw(ctx);
    }
  }

  exportAsSvg(): string {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 1000 1000');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    const ctx = new SvgDrawingContext(svg);

    ctx.setBackground(this.backgroundColor);

    this.draw({ ctx }, null);

    return ctx.export();
  }
}
