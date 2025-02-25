import { RouteColor } from '../transit/TransitRoute';
import { Color } from './color/Color';
import ColorInput from './color/ColorInput';
import { useState } from 'react';

export function StopColorEditor({
  stopColor,
  onChange,
}: {
  stopColor: RouteColor;
  onChange: (color: RouteColor) => void;
}) {
  const [isRoute, setIsRoute] = useState(stopColor === 'route');

  return (
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        checked={isRoute}
        onChange={() => {
          setIsRoute(!isRoute);
          onChange(isRoute ? Color.BLACK : 'route');
        }}
      />
      {isRoute ? null : (
        <ColorInput color={stopColor as Color} setColor={e => onChange(e)} />
      )}
    </div>
  );
}
