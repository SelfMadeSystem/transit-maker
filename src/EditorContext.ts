import { createContext } from "react";
import { SelectableItem, TransitMap } from "./transit/types";

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

