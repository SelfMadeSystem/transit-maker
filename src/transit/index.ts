import { bakeTransitMap } from "./bake";
import { BakedTransitMap } from "./types";

export const transitMap: BakedTransitMap = bakeTransitMap({
  layers: [
    {
      name: "Metro",
      type: "subway",
      routes: [
        {
          id: "M1",
          name: "Red Line",
          color: "#f00",
          stops: [
            {
              id: "M1M2S1",
              name: "Central Station",
              location: { x: 50, y: 50 },
              connections: [{ to: "M1S2" }],
            },
            {
              id: "M1S2",
              name: "Downtown",
              location: { x: 50, y: 100 },
              connections: [{ to: "M1S3" }],
            },
            {
              id: "M1S3",
              name: "Uptown",
              location: { x: 50, y: 150 },
              connections: [{ to: "M1M3S4" }],
            },
            {
              id: "M1M3S4",
              name: "North End",
              location: { x: 50, y: 200 },
              connections: [],
            },
          ],
        },
        {
          id: "M2",
          name: "Green Line",
          color: "#008000",
          stops: [
            {
              id: "M1M2S1",
              name: "Central Station",
              location: { x: 50, y: 50 },
              connections: [{ to: "M2S2" }],
            },
            {
              id: "M2S2",
              name: "City Park",
              location: { x: 100, y: 50 },
              connections: [{ to: "M2S3" }],
            },
            {
              id: "M2S3",
              name: "Museum",
              location: { x: 150, y: 50 },
              connections: [{ to: "M2S4" }],
            },
            {
              id: "M2S4",
              name: "University",
              location: { x: 200, y: 50 },
              connections: [{ to: "M2M3S5" }],
            },
          ],
        },
        {
          id: "M3",
          name: "Blue Line",
          color: "#00f",
          stops: [
            {
              id: "M1M3S4",
              name: "North End",
              location: { x: 50, y: 200 },
              connections: [{ to: "M3S2" }],
            },
            {
              id: "M3S2",
              name: "Harbor",
              location: { x: 50, y: 250 },
              connections: [{ to: "M3S3" }],
            },
            {
              id: "M3S3",
              name: "Aquarium",
              location: { x: 100, y: 250 },
              connections: [{ to: "M3S4" }],
            },
            {
              id: "M3S4",
              name: "Seaside",
              location: { x: 150, y: 250 },
              connections: [{ to: "M3S5" }],
            },
            {
              id: "M3S5",
              name: "Lighthouse",
              location: { x: 200, y: 250 },
              connections: [{ to: "M2M3S5" }],
            },
          ],
        },
        {
          id: "M4",
          name: "Connector Line",
          color: "#ffa500",
          stops: [
            {
              id: "M2M3S5",
              name: "University-Lighthouse Connector",
              location: { x: 200, y: 150 },
              connections: [{ to: "M2S4" }, { to: "M3S5" }],
            },
          ],
        },
      ],
    },
  ],
});
