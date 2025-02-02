export type GeoLocation = {
  x: number;
  y: number;
};

export interface Drawable {
  draw(ctx: CanvasRenderingContext2D): void;
}

export interface Movable {
  move({ x, y }: GeoLocation): void;
}

export interface Selectable {
  isOver(x: number, y: number): boolean;
  drawSelected(ctx: CanvasRenderingContext2D): void;
}

export interface DoubleClickable {
  doubleClick(map: TransitMap): void;
}

const LabelFont = "10px sans-serif";

export class Label implements Drawable, Selectable, Movable {
  // TODO: Add support for:
  // - text formatting (e.g. bold for important/transfer stations)
  // - line icon identifier (e.g. blue circle with white "5" for line 5 in Montreal)
  // - connection icon (e.g. airport, intercity rail, etc.)
  // - other icons (e.g. wheelchair accessible, parking, etc.)
  public text: string;
  public x: number;
  public y: number;
  public stop: TransitStop;
  private cachedDimensions: TextMetrics | null = null;
  private cacheKey: string | null = null;

  constructor(text: string, x: number = 0, y: number = -15) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.stop = null as unknown as TransitStop; // should always be set immediately after construction
  }

  draw(ctx: CanvasRenderingContext2D) {
    {
      this.getDimensions(ctx);
      // const dimensions = this.getDimensions(ctx);
      // const x = this.x + this.stop.location.x - dimensions.width / 2;
      // const y =
      //   this.y + this.stop.location.y - dimensions.actualBoundingBoxAscent;
      // ctx.fillStyle = "black";
      // ctx.fillRect(
      //   x - 2,
      //   y - 2,
      //   dimensions.width + 4,
      //   dimensions.actualBoundingBoxAscent * 2 + 4
      // );
    }
    {
      ctx.font = LabelFont;
      ctx.fillStyle = "white";
      const x = this.x + this.stop.location.x;
      const y = this.y + this.stop.location.y;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.text, x, y);
    }
  }

  getDimensions(ctx: CanvasRenderingContext2D) {
    ctx.font = LabelFont;
    if (this.cacheKey !== this.text) {
      this.cacheKey = this.text;
    }
    return (this.cachedDimensions = ctx.measureText(this.cacheKey));
  }

  drawSelected(ctx: CanvasRenderingContext2D) {
    const dimensions = this.getDimensions(ctx);
    const x = this.x + this.stop.location.x - dimensions.width / 2;
    const y =
      this.y + this.stop.location.y - dimensions.actualBoundingBoxAscent;
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      x - 2,
      y - 2,
      dimensions.width + 4,
      dimensions.actualBoundingBoxAscent * 2 + 4
    );
  }

  isOver(x: number, y: number) {
    const dimensions = this.cachedDimensions;
    if (!dimensions) {
      return false;
    }
    const x1 = this.x + this.stop.location.x - dimensions.width / 2;
    const y1 =
      this.y + this.stop.location.y - dimensions.actualBoundingBoxAscent;
    const x2 = x1 + dimensions.width;
    const y2 = y1 + dimensions.actualBoundingBoxAscent * 2;
    return x >= x1 && x <= x2 && y >= y1 && y <= y2;
  }

  move({ x, y }: GeoLocation) {
    this.x += x;
    this.y += y;
  }
}

export class TransitStop implements Drawable, Selectable, Movable {
  // TODO: Add support for:
  // - multiple labels
  // - "long" transfer stations (e.g. Lucien-L'Allier in Montreal is like 3×
  //   the width of a normal station)
  // - connected stations (e.g. Bonaventure is connected to Gare Centrale, but
  //   they're separate stations, same for Henri-Bourassa and Sauvé)
  // - different shapes (e.g. square, circle, etc.)
  //   - shapes that rotate with the line (e.g. the squares on the EXO lines)
  // - different sizes (e.g. transfer stations and final stations are bigger)
  // - different fill colors (e.g. white, black, line color)
  // - different border colors (e.g. white, black, none)
  public labels: Label[];
  public location: GeoLocation;
  public routes: TransitRoute[];
  public connections: TransitConnection[];

  constructor(labels: Label[], location: GeoLocation, routes: TransitRoute[]) {
    this.labels = labels;
    for (const label of this.labels) {
      label.stop = this;
    }
    this.location = location;
    this.routes = routes;
    this.connections = [];
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "black";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.location.x, this.location.y, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  drawSelected(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.location.x, this.location.y, 8, 0, 2 * Math.PI);
    ctx.stroke();
  }

  isOver(x: number, y: number) {
    return (
      Math.sqrt((this.location.x - x) ** 2 + (this.location.y - y) ** 2) < 5
    );
  }

  move(l: GeoLocation) {
    const { x, y } = l;
    this.location.x += x;
    this.location.y += y;
  }
}

export class TransitConnection
  implements Drawable, Selectable, DoubleClickable
{
  // TODO: Add support for:
  // - split routes (e.g. REM connection between Bois-Franc, Marie-Curie,
  //   Des Sources, and Sunnybrooke; yes, that's a single connection)
  // - multiple connections between the same two stops (e.g. line 11, 12, and 14
  //   between Montréal-Ouest and Lucien-L'Allier)
  // - rounded corners
  // - go behind other lines when there's no stop in between (e.g. line 15 with
  //   lines 11, 12, 14, the text of "De la Savane", and line 2)
  // TODO: Different styles (todo in conjunction with `TransitRoute` since it'll
  // likely house the style information):
  // - Thick line
  // - Thin line
  // - Split (?) line (e.g. REM)
  // - Dotted line (continuation of a line beyond the map)
  // - Dashed line (future line)
  public from: TransitStop;
  public to: TransitStop;
  public route: TransitRoute;

  constructor(from: TransitStop, to: TransitStop, route: TransitRoute) {
    this.from = from;
    this.to = to;
    this.route = route;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = this.route.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.from.location.x, this.from.location.y);
    ctx.lineTo(this.to.location.x, this.to.location.y);
    ctx.stroke();
  }

  drawSelected(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.from.location.x, this.from.location.y);
    ctx.lineTo(this.to.location.x, this.to.location.y);
    ctx.stroke();
  }

  isOver(x: number, y: number) {
    const width = 5;
    const x1 = this.from.location.x;
    const y1 = this.from.location.y;
    const x2 = this.to.location.x;
    const y2 = this.to.location.y;

    const withinBoundingBox =
      Math.min(x1, x2) <= x + width &&
      x <= Math.max(x1, x2) + width &&
      Math.min(y1, y2) <= y + width &&
      y <= Math.max(y1, y2) + width;

    if (!withinBoundingBox) {
      return false;
    }

    const distance = Math.abs(
      (y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1
    );
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    return distance / length < width;
  }

  doubleClick(map: TransitMap) {
    map.splitConnection(this);
  }
}

export class TransitRoute {
  // TODO: Add support for:
  // - different styles (as mentioned in `TransitConnection`)
  // - idk what else
  public name: string;
  public color: string;
  public stops: TransitStop[];

  constructor(name: string, color: string) {
    this.name = name;
    this.color = color;
    this.stops = [];
  }

  addStop(stop: TransitStop) {
    this.stops.push(stop);
  }
}

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
  public routes: TransitRoute[];
  public stops: TransitStop[];
  public connections: TransitConnection[];

  constructor() {
    this.routes = [];
    this.stops = [];
    this.connections = [];
  }

  addRoute(route: TransitRoute) {
    this.routes.push(route);
  }

  addStop(stop: TransitStop) {
    this.stops.push(stop);
  }

  addConnection(connection: TransitConnection) {
    this.connections.push(connection);
  }

  createStop(
    name: string,
    location: GeoLocation,
    route: TransitRoute,
    from?: TransitStop
  ) {
    const stop = new TransitStop([new Label(name)], location, [route]);
    this.addStop(stop);
    route.addStop(stop);
    if (from) {
      const connection = new TransitConnection(from, stop, route);
      this.addConnection(connection);
      from.connections.push(connection);
      stop.connections.push(connection);
    }
    return stop;
  }

  createConnection(from: TransitStop, to: TransitStop, route: TransitRoute) {
    const connection = new TransitConnection(from, to, route);
    this.addConnection(connection);
    from.connections.push(connection);
    to.connections.push(connection);
  }

  splitConnection(connection: TransitConnection) {
    const index = this.connections.indexOf(connection);
    if (index === -1) {
      return;
    }
    this.connections.splice(index, 1);
    const from = connection.from;
    const to = connection.to;
    const route = connection.route;
    const stop = new TransitStop(
      [new Label("Unnamed Stop")],
      {
        x: (from.location.x + to.location.x) / 2,
        y: (from.location.y + to.location.y) / 2,
      },
      [route]
    );
    this.addStop(stop);
    route.addStop(stop);
    const connection1 = new TransitConnection(from, stop, route);
    const connection2 = new TransitConnection(stop, to, route);
    this.addConnection(connection1);
    this.addConnection(connection2);
    from.connections.push(connection1);
    from.connections.push(connection2);
    stop.connections.push(connection1);
    stop.connections.push(connection2);
    to.connections.push(connection1);
    to.connections.push(connection2);
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

export type SelectableItem = Label | TransitStop | TransitConnection;
