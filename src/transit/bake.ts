import type {
  TransitMap,
  BakedTransitMap,
  BakedTransitStop,
  TransitRoute,
} from "./types";

export function bakeTransitMap(transitMap: TransitMap): BakedTransitMap {
  const stopLookup: Map<string, BakedTransitStop> = new Map();

  // Populate stopLookup with initial stops
  for (const layer of transitMap.layers) {
    for (const route of layer.routes) {
      for (const stop of route.stops) {
        if (!stopLookup.has(stop.id)) {
          stopLookup.set(stop.id, {
            ...stop,
            connections: stop.connections.map((connection) => ({
              connection,
              route,
            })),
            routes: [] as unknown as [TransitRoute, ...TransitRoute[]],
            allConnections: new Map(),
          });
        }
        const bakedStop = stopLookup.get(stop.id)!;
        bakedStop.routes.push(route);
        if (
          bakedStop.location.x !== stop.location.x ||
          bakedStop.location.y !== stop.location.y
        ) {
          throw new Error(
            `Stop ${stop.id} already exists with different location`
          );
        }
      }
    }
  }

  // Calculate allConnections for each stop
  for (const bakedStop of stopLookup.values()) {
    for (const { route, connection } of bakedStop.connections) {
      const toStop = stopLookup.get(connection.to);
      if (!toStop) {
        throw new Error(`Stop ${connection.to} not found`);
      }
      if (!bakedStop.allConnections.has(connection.to)) {
        bakedStop.allConnections.set(connection.to, {
          connection,
          routes: [] as unknown as [TransitRoute, ...TransitRoute[]],
        });
      }
      const bakedConnection = bakedStop.allConnections.get(connection.to)!;
      bakedConnection.routes.push(route);
    }
  }

  return {
    ...transitMap,
    stopLookup,
  };
}
