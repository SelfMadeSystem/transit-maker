export type GeoPosition = {
  x: number;
  y: number;
};
export type StopId = string;
export type RouteId = string;
export type TransitType = "bus" | "tram" | "train" | "subway" | "ferry";
export type TransitConnection = {
  to: StopId;
  points?: GeoPosition[];
};
export type TransitStop = {
  id: StopId;
  name: string;
  // If we say a->b, b is in connections of a, but not vice versa
  connections: TransitConnection[];
  location: GeoPosition;
};
export type BakedTransitStop = {
  id: StopId;
  name: string;
  // If we say a->b, b is in connections of a, but not vice versa
  connections: {
    connection: TransitConnection;
    route: TransitRoute; // only one route for calculation
  }[];
  location: GeoPosition;
  routes: [TransitRoute, ...TransitRoute[]];
  // All connection includes all connections to this stop, so if a->b, then
  // a.allConnections includes { connection: b, distance: 10 } and
  // b.allConnections includes { connection: a, distance: 10 }
  allConnections: Map<StopId, {
    connection: TransitConnection;
    routes: [TransitRoute, ...TransitRoute[]];
  }>;
};
export type TransitRoute = {
  id: RouteId;
  name: string;
  color: string;
  stops: TransitStop[];
};
export type TransitLayer = {
  type: TransitType;
  name: string;
  routes: TransitRoute[];
};
export type TransitMap = {
  layers: TransitLayer[];
};
export type BakedTransitMap = TransitMap & {
  stopLookup: Map<string, BakedTransitStop>;
};
