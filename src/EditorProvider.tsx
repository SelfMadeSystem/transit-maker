import { useState } from "react";
import { EditorContext } from "./EditorContext";
import { SelectableItem, TransitMap, TransitRoute } from "./transit/types";

function createTransitMap(): TransitMap {
  const transitMap = new TransitMap();

  const line1 = new TransitRoute("Metro 1", "red");
  transitMap.addRoute(line1);
  const line2 = new TransitRoute("Metro 2", "green");
  transitMap.addRoute(line2);
  const stationA = transitMap.createStop("Station A", { x: 50, y: 50 }, line1);
  const stationB = transitMap.createStop(
    "Station B",
    { x: 100, y: 50 },
    line1,
    stationA
  );
  const stationC = transitMap.createStop(
    "Station C",
    { x: 75, y: 100 },
    line2,
    stationB
  );
  transitMap.createStop("Station D", { x: 125, y: 0 }, line2, stationB);
  transitMap.createConnection(stationA, stationC, line1);

  return transitMap;
}

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<SelectableItem | null>(null);
  const [map] = useState(createTransitMap);
  return (
    <EditorContext.Provider
      value={{
        map,
        selected,
        setSelected,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}
