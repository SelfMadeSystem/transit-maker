import { EditorContext } from './EditorContext';
import { Color } from './components/color/Color';
import { connectStopsAction, createStopAction } from './transit/Action';
import { TransitMap } from './transit/TransitMap';
import { TransitRoute } from './transit/TransitRoute';
import { ActionableItem } from './transit/types';
import { useFonts } from './utils/fontUtils';
import { Vector2 } from './utils/vec';
import { useState } from 'react';

function createTransitMap(cb: () => void): TransitMap {
  const map = new TransitMap();

  const route = new TransitRoute(map, 'Metro', new Color(0, 0, 255));

  const stop1 = createStopAction(map, 'A', new Vector2(50, 50)).data;
  const stop2 = createStopAction(map, '', new Vector2(100, 100)).data;
  connectStopsAction(map, stop1, stop2).data.route = route;
  const stop3 = createStopAction(map, 'B', new Vector2(100, 100)).data;
  connectStopsAction(map, stop3, stop2).data.route = route;
  stop3.setPos(new Vector2(100, 150));

  map.history.changeCb = cb;

  return map;
}

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<ActionableItem | null>(null);
  const [historyUpdate, setHistoryUpdate] = useState(0);
  const [map] = useState(() =>
    createTransitMap(() => {
      setHistoryUpdate(prev => prev + 1);
    }),
  );
  const { fonts, uploadFont } = useFonts();
  return (
    <EditorContext.Provider
      value={{
        map,
        historyUpdate,
        selected,
        setSelected,
        fonts,
        uploadFont,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}
