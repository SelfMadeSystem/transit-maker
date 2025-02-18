import { EditorContext } from './EditorContext';
import { History } from './transit/History';
import { TransitMap } from './transit/TransitMap';
import { TransitRoute } from './transit/TransitRoute';
import { ActionableItem } from './transit/types';
import { Vector2 } from './utils/vec';
import { useState } from 'react';

function createTransitMap(): TransitMap {
  const transitMap = new TransitMap();

  const line1 = new TransitRoute(transitMap, 'Metro 1', '#ff0000');
  const line2 = new TransitRoute(transitMap, 'Metro 2', '#008000');
  const stationA = transitMap.createStop('Station A', new Vector2(50, 50));
  const [stationB] = transitMap.createStop(
    'Station B',
    new Vector2(100, 50),
    line1,
    stationA,
  );
  const [stationC] = transitMap.createStop(
    'Station C',
    new Vector2(75, 100),
    line2,
    stationB,
  );
  const [stationD] = transitMap.createStop(
    'Station D',
    new Vector2(125, 0),
    line2,
    stationB,
  );
  transitMap.createStop('Station E', new Vector2(175, 0), line2, stationD);
  transitMap.createConnection(stationA, stationC, line1);

  return transitMap;
}

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<ActionableItem | null>(null);
  const [map] = useState(createTransitMap);
  const [historyUpdate, setHistoryUpdate] = useState(0);
  const [history] = useState(
    () =>
      new History(() => {
        setHistoryUpdate(prev => prev + 1);
      }),
  );
  return (
    <EditorContext.Provider
      value={{
        map,
        history,
        historyUpdate,
        selected,
        setSelected,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}
