import { angleDelta, mod } from '../utils/mathUtils';
import { Label } from './Label';
import { TransitConnection } from './TransitConnection';
import { TransitMap } from './TransitMap';
import { TransitRoute } from './TransitRoute';
import {
  DoubleClickable,
  Drawable,
  GeoLocation,
  LocationWithKeys,
  Movable,
  RightClickable,
  Selectable,
} from './types';

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
