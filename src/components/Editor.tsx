import { EditorContext } from '../EditorContext';
import { MapComponent } from './MapComponent';
import { SelectedUi } from './SelectedUi';
import { useContext } from 'react';

export function Editor() {
  const ctx = useContext(EditorContext);

  return (
    <>
      <MapComponent props={ctx} />
      <div className="absolute top-0 right-0 w-fit rounded-bl-2xl bg-white/10 p-2 backdrop-blur-md">
        <SelectedUi />
      </div>
    </>
  );
}
