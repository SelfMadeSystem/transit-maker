import { History } from './transit/History';
import { TransitMap } from './transit/TransitMap';
import { ActionableItem } from './transit/types';
import { createContext } from 'react';

export type EditorContextType = {
  map: TransitMap;
  history: History;
  selected: ActionableItem | null;
  setSelected: React.Dispatch<React.SetStateAction<ActionableItem | null>>;
};

export const EditorContext = createContext<EditorContextType>({
  history: new History(),
  map: new TransitMap(),
  selected: null,
  setSelected: () => {},
});
