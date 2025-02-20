import { EditorContext } from './EditorContext';
import { Color } from './components/color/Color';
import { TransitMap } from './transit/TransitMap';
import { TransitRoute } from './transit/TransitRoute';
import { ActionableItem } from './transit/types';
import { useState } from 'react';

function createTransitMap(cb: () => void): TransitMap {
  const map = new TransitMap();

  new TransitRoute(map, 'Metro 1', new Color(0, 0, 255));
  new TransitRoute(map, 'Metro 2', new Color(0, 255, 0));

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
  return (
    <EditorContext.Provider
      value={{
        map,
        historyUpdate,
        selected,
        setSelected,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}
