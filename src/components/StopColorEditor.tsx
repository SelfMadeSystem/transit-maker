import type { StopColor } from '../transit/TransitStop';
import { ColorEditor } from './ColorEditor';
import { useState } from 'react';

export function StopColorEditor({
  stopColor,
  onChange,
}: {
  stopColor: StopColor;
  onChange: (color: StopColor) => void;
}) {
  const [isRoute, setIsRoute] = useState(stopColor === 'route');

  return (
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        checked={isRoute}
        onChange={() => {
          setIsRoute(!isRoute);
          onChange(isRoute ? 'black' : 'route');
        }}
      />
      {isRoute ? null : (
        <ColorEditor color={stopColor} onChange={e => onChange(e)} />
      )}
    </div>
  );
}
