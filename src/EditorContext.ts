import { TransitMap } from './transit/TransitMap';
import { SelectableItem } from './transit/types';
import { createContext } from 'react';

export type EditorContextType = {
  map: TransitMap;
  selected: SelectableItem | null;
  setSelected: React.Dispatch<React.SetStateAction<SelectableItem | null>>;
};

export const EditorContext = createContext<EditorContextType>({
  map: new TransitMap(),
  selected: null,
  setSelected: () => {},
});
