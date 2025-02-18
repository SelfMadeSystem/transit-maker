import { TransitMap } from './transit/TransitMap';
import { ActionableItem } from './transit/types';
import { createContext } from 'react';

export type EditorContextType = {
  map: TransitMap;
  historyUpdate: number;
  selected: ActionableItem | null;
  setSelected: React.Dispatch<React.SetStateAction<ActionableItem | null>>;
};

export const EditorContext = createContext<EditorContextType>({
  map: new TransitMap(),
  historyUpdate: 0,
  selected: null,
  setSelected: () => {},
});
