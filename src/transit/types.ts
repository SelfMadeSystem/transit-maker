import { angleDelta, mod } from '../utils/mathUtils';

export type GeoLocation = {
  x: number;
  y: number;
};

export interface Drawable {
  draw(ctx: CanvasRenderingContext2D): void;
}

export type LocationWithKeys = GeoLocation & {
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
};

export interface Movable {
  getLocation(): GeoLocation;
  moveTo(l: LocationWithKeys): void;
}

export interface Removable {
  remove(map: TransitMap): void;
}

export interface Selectable extends Removable {
  isOver(x: number, y: number): boolean;
  drawSelected(ctx: CanvasRenderingContext2D): void;
}

export interface DoubleClickable {
  doubleClick(map: TransitMap): void;
}

export interface RightClickable {
  rightClick(map: TransitMap): void;
}

const LabelFont = '10px sans-serif';

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
      ctx.fillStyle = 'white';
      const x = this.x + this.stop.location.x;
      const y = this.y + this.stop.location.y;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
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
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      x - 2,
      y - 2,
      dimensions.width + 4,
      dimensions.actualBoundingBoxAscent * 2 + 4,
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

  getLocation(): GeoLocation {
    return {
      x: this.x,
      y: this.y,
    };
  }

  moveTo({ x, y }: GeoLocation) {
    this.x = x;
    this.y = y;
  }

  remove(): void {
    this.stop.labels.delete(this);
  }

  clone(): Label {
    return new Label(this.text, this.x, this.y);
  }
}

export class TransitStop
  implements Drawable, Selectable, Movable, RightClickable, DoubleClickable
{
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
  public labels: Set<Label>;
  public location: GeoLocation;
  public routes: Set<TransitRoute>;
  public connections: Set<TransitConnection>;
  public hidden: boolean = false;

  constructor(
    labels: Label[],
    location: GeoLocation,
    routes: Iterable<TransitRoute>,
  ) {
    this.labels = new Set(labels);
    for (const label of this.labels) {
      label.stop = this;
    }
    this.location = location;
    this.routes = new Set(routes);
    this.connections = new Set();
  }

  setLabels(labels: Label[]) {
    this.labels = new Set(labels);
    for (const label of this.labels) {
      label.stop = this;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.hidden) {
      return;
    }
    if (this.routes.size === 1) {
      ctx.strokeStyle = this.routes.values().next().value!.color;
    } else {
      ctx.strokeStyle = 'white';
    }
    ctx.fillStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.location.x, this.location.y, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  drawSelected(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'white';
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

  getLocation(): GeoLocation {
    return {
      x: this.location.x,
      y: this.location.y,
    };
  }

  moveTo(l: LocationWithKeys) {
    const { shiftKey, ctrlKey } = l;
    let { x, y } = l;

    if (shiftKey) {
      const ANGLE_STEP = Math.PI / 18;
      let closestStop: TransitStop | null = null;
      let closestDistance = 0;
      let closestAngle = 0;
      let actualDistance = 0;
      console.log('snap');
      // Snap angle to closest stop
      outer: for (const connection of this.connections) {
        const otherStop = connection.getOtherStop(this);
        const angle = Math.atan2(
          otherStop.location.y - y,
          otherStop.location.x - x,
        );

        for (const connection2 of otherStop.connections) {
          const otherStop2 = connection2.getOtherStop(otherStop);
          if (otherStop2 === this) {
            continue;
          }
          const angle2 = Math.atan2(
            otherStop2.location.y - otherStop.location.y,
            otherStop2.location.x - otherStop.location.x,
          );
          const diff = angleDelta(angle, angle2);
          if (Math.abs(diff) < ANGLE_STEP) {
            // They're close to parallel
            const distance = Math.hypot(
              otherStop.location.x - x,
              otherStop.location.y - y,
            );
            x = otherStop.location.x - distance * Math.cos(angle2);
            y = otherStop.location.y - distance * Math.sin(angle2);
            closestStop = otherStop;
            closestDistance = Math.hypot(
              otherStop2.location.x - otherStop.location.x,
              otherStop2.location.y - otherStop.location.y,
            );
            closestAngle = angle2;
            actualDistance = distance;
            break outer;
          }
          if (Math.abs(mod(diff - Math.PI / 2, Math.PI)) < ANGLE_STEP) {
            // They're close to perpendicular
            const distance = Math.hypot(
              otherStop.location.x - x,
              otherStop.location.y - y,
            );
            // Must find which side to snap to
            let orthAngle = angle2 + Math.PI / 2;
            const testX1 =
              otherStop.location.x - distance * Math.cos(orthAngle);
            const testY1 =
              otherStop.location.y - distance * Math.sin(orthAngle);
            const testX2 =
              otherStop.location.x + distance * Math.cos(orthAngle);
            const testY2 =
              otherStop.location.y + distance * Math.sin(orthAngle);

            // Determine which side is closer
            const dist1 = Math.hypot(testX1 - x, testY1 - y);
            const dist2 = Math.hypot(testX2 - x, testY2 - y);

            if (dist2 < dist1) {
              orthAngle = angle2 - Math.PI / 2;
            }

            x = otherStop.location.x - distance * Math.cos(orthAngle);
            y = otherStop.location.y - distance * Math.sin(orthAngle);
            closestStop = otherStop;
            closestDistance = Math.hypot(
              otherStop2.location.x - otherStop.location.x,
              otherStop2.location.y - otherStop.location.y,
            );
            closestAngle = orthAngle;
            actualDistance = distance;
            break outer;
          }
        }
      }

      if (!closestAngle) {
        // Can't be parallel or perpendicular to any other stops
        // Try to find one that can make a horizontal or vertical line
        for (const connection of this.connections) {
          const otherStop = connection.getOtherStop(this);
          const angle = Math.abs(
            Math.atan2(otherStop.location.y - y, otherStop.location.x - x),
          );

          if (angle < ANGLE_STEP || angle > Math.PI - ANGLE_STEP) {
            // Horizontal
            const distance = Math.hypot(
              otherStop.location.x - x,
              otherStop.location.y - y,
            );
            const sign = Math.sign(otherStop.location.x - x);
            x = otherStop.location.x - sign * distance;
            y = otherStop.location.y;
            const nextStop = otherStop.connections
              .values()
              .next()
              .value!.getOtherStop(otherStop);
            closestStop = otherStop;
            closestDistance = Math.hypot(
              nextStop.location.x - otherStop.location.x,
              nextStop.location.y - otherStop.location.y,
            );
            closestAngle = sign > 0 ? 0 : Math.PI;
            actualDistance = distance;
            break;
          }

          if (
            angle > Math.PI / 2 - ANGLE_STEP &&
            angle < Math.PI / 2 + ANGLE_STEP
          ) {
            // Vertical
            const distance = Math.hypot(
              otherStop.location.x - x,
              otherStop.location.y - y,
            );
            const sign = Math.sign(otherStop.location.y - y);
            x = otherStop.location.x;
            y = otherStop.location.y - sign * distance;
            const nextStop = otherStop.connections
              .values()
              .next()
              .value!.getOtherStop(otherStop);
            closestStop = otherStop;
            closestDistance = Math.hypot(
              nextStop.location.x - otherStop.location.x,
              nextStop.location.y - otherStop.location.y,
            );
            closestAngle = sign > 0 ? Math.PI / 2 : (Math.PI * 3) / 2;
            actualDistance = distance;
            break;
          }
        }
      }

      if (ctrlKey && closestStop) {
        // Snap to multiples of distance
        const multipliers = [1 / 4, 1 / 3, 1 / 2, 3 / 4, 1, 3 / 2, 2, 3, 4];
        let closestMultiplier = multipliers[0];
        let minDifference = Math.abs(
          actualDistance / closestDistance - closestMultiplier,
        );

        for (const multiplier of multipliers) {
          const difference = Math.abs(
            actualDistance / closestDistance - multiplier,
          );
          if (difference < minDifference) {
            minDifference = difference;
            closestMultiplier = multiplier;
          }
        }

        const newDistance = closestMultiplier * closestDistance;
        x = closestStop.location.x - newDistance * Math.cos(closestAngle);
        y = closestStop.location.y - newDistance * Math.sin(closestAngle);
      }
    }

    this.location.x = x;
    this.location.y = y;
  }

  rightClick(_: TransitMap): void {
    this.hidden = !this.hidden;
  }

  remove(map: TransitMap): void {
    map.removeStop(this);
  }

  doubleClick(map: TransitMap): void {
    map.createStop(
      'Unnamed Stop',
      {
        x: this.location.x + 10,
        y: this.location.y + 10,
      },
      this.routes.values().next().value!,
      this,
    );
  }

  clone(): TransitStop {
    const labels = Array.from(this.labels).map(label => label.clone());
    return new TransitStop(labels, this.location, Array.from(this.routes));
  }
}

export class TransitConnection
  implements Drawable, Selectable, DoubleClickable, RightClickable
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
  public dotted: boolean = false;

  constructor(from: TransitStop, to: TransitStop, route: TransitRoute) {
    this.from = from;
    this.to = to;
    this.route = route;
  }

  getOtherStop(stop: TransitStop) {
    return stop === this.from ? this.to : this.from;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = this.route.color;
    ctx.lineWidth = 2;
    ctx.save();
    ctx.lineCap = 'round';
    if (this.dotted) {
      ctx.setLineDash([0, 4]);
    }
    ctx.beginPath();
    ctx.moveTo(this.from.location.x, this.from.location.y);
    ctx.lineTo(this.to.location.x, this.to.location.y);
    ctx.stroke();
    ctx.restore();
  }

  drawSelected(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'white';
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
      (y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1,
    );
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    return distance / length < width;
  }

  remove(map: TransitMap): void {
    map.removeConnection(this);
  }

  doubleClick(map: TransitMap) {
    map.splitConnection(this);
  }

  rightClick(): void {
    this.dotted = !this.dotted;
  }
}

export class TransitRoute {
  // TODO: Add support for:
  // - different styles (as mentioned in `TransitConnection`)
  // - idk what else
  public name: string;
  public color: string;
  public stops: Set<TransitStop>;

  constructor(name: string, color: string) {
    this.name = name;
    this.color = color;
    this.stops = new Set();
  }

  addStop(stop: TransitStop) {
    this.stops.add(stop);
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
  public routes: Set<TransitRoute>;
  public stops: Set<TransitStop>;
  public connections: Set<TransitConnection>;

  constructor() {
    this.routes = new Set();
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
    name: string,
    location: GeoLocation,
    route: TransitRoute,
    from?: TransitStop,
  ) {
    const stop = new TransitStop([new Label(name)], location, [route]);
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

export type SelectableItem = Label | TransitStop | TransitConnection;
