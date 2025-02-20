import type { StopColor } from '../transit/TransitStop';
import { Color } from './color/Color';
import ColorInput from './color/ColorInput';
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
          onChange(isRoute ? new Color(0, 0, 0) : 'route');
        }}
      />
      {isRoute ? null : (
        <ColorInput color={stopColor as Color} setColor={e => onChange(e)} />
      )}
    </div>
  );
}
