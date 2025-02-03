import { useContext } from "react";
import { MapComponent } from "./MapComponent";
import { EditorContext } from "../EditorContext";

export function Editor() {
  const ctx = useContext(EditorContext);

  return <MapComponent props={ctx} />;
}
