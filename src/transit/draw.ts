import type { GeoPosition, BakedTransitMap, BakedTransitStop } from "./types";

export function drawTransitMap(
  ctx: CanvasRenderingContext2D,
  transitMap: BakedTransitMap
) {
  // Draw each layer
  transitMap.layers.forEach((layer) => {
    layer.routes.forEach((route) => {
      // Set the color for the route
      ctx.strokeStyle = route.color;
      ctx.lineWidth = 2;

      // Draw connections first
      route.stops.forEach((stop) => {
        stop.connections.forEach((connection) => {
          const toStop = transitMap.stopLookup.get(connection.to);
          if (toStop) {
            drawConnection(ctx, stop.location, toStop.location);
          }
        });
      });
    });
  });

  // Draw stops on top of connections
  transitMap.stopLookup.forEach((stop) => {
    drawStop(ctx, stop);
  });
}
function drawStop(ctx: CanvasRenderingContext2D, stop: BakedTransitStop) {
  const { location, name, routes } = stop;
  const numRoutes = routes.length;
  const anglePerRoute = (2 * Math.PI) / numRoutes;
  const radius = 10; // Adjust the radius as needed

  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(location.x, location.y, radius, 0, 2 * Math.PI);
  ctx.fill();

  routes.forEach((route, index) => {
    const startAngle = index * anglePerRoute;
    const endAngle = startAngle + anglePerRoute;

    ctx.beginPath();
    ctx.arc(location.x, location.y, radius, startAngle, endAngle);
    ctx.strokeStyle = route.color; // Assuming each route has a color property
    ctx.stroke();
  });

  // Draw the station name above the station
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(name, location.x, location.y - radius - 5); // Adjust the offset as needed
}

function drawConnection(
  ctx: CanvasRenderingContext2D,
  from: GeoPosition,
  to: GeoPosition
) {
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}
