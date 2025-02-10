import { TransitMap } from './transit/TransitMap';
import { SelectableItem } from './transit/types';
import { createContext } from 'react';

export type EditorContextType = {
  map: TransitMap;
  setMap: React.Dispatch<React.SetStateAction<TransitMap>>;
  selected: SelectableItem | null;
  setSelected: React.Dispatch<React.SetStateAction<SelectableItem | null>>;
};

export const EditorContext = createContext<EditorContextType>({
  map: new TransitMap(),
  setMap: () => {},
  selected: null,
  setSelected: () => {},
});
