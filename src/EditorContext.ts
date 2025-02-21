import { TransitMap } from './transit/TransitMap';
import { ActionableItem } from './transit/types';
import { AvailableFont } from './utils/fontUtils';
import { createContext } from 'react';

export type EditorContextType = {
  map: TransitMap;
  historyUpdate: number;
  selected: ActionableItem | null;
  setSelected: React.Dispatch<React.SetStateAction<ActionableItem | null>>;
  fonts: AvailableFont[];
};

export const EditorContext = createContext<EditorContextType>({
  map: new TransitMap(),
  historyUpdate: 0,
  selected: null,
  setSelected: () => {},
  fonts: [],
});
