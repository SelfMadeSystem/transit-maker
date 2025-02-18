import { EditorContext } from './EditorContext';
import { TransitMap } from './transit/TransitMap';
import { ActionableItem } from './transit/types';
import { useState } from 'react';

function createTransitMap(cb: () => void): TransitMap {
  const map = new TransitMap();

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
