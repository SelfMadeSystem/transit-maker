import { RouteColor } from '../transit/TransitRoute';
import { Color } from './color/Color';
import ColorInput from './color/ColorInput';
import { useState } from 'react';

export function RouteColorEditor({
  color,
  onChange,
}: {
  color: RouteColor;
  onChange: (color: RouteColor) => void;
}) {
  const [isRoute, setIsRoute] = useState(color === 'route');

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
        <ColorInput color={color as Color} setColor={e => onChange(e)} />
      )}
    </div>
  );
}
