import { EditorContext } from '../EditorContext';
import { TransitStop } from '../transit/TransitStop';
import { useContext } from 'react';

export function SelectedUi() {
  const { selected } = useContext(EditorContext);

  if (selected instanceof TransitStop) {
    return (
      <div className="absolute top-0 right-0 w-fit bg-white/10 p-2">
        <div>UwU</div>
      </div>
    );
  }
}
