import { EditorContext } from '../EditorContext';
import { MapComponent } from './MapComponent';
import { SelectedUi } from './SelectedUi';
import { useContext } from 'react';

export function Editor() {
  const ctx = useContext(EditorContext);

  return (
    <>
      <MapComponent props={ctx} />
      <SelectedUi />
    </>
  );
}
