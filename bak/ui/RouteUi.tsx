import { TransitRoute } from '../../transit/TransitRoute';
import { RouteStyleUi } from './RouteStyleUi';
import { useState } from 'react';

export function RouteUi({ route }: { route: TransitRoute }) {
  const [name, setName] = useState(route.name);

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2">
        <div className="text-white">Name:</div>
        <input
          type="text"
          value={name}
          onChange={e => setName((route.name = e.target.value))}
          className="bg-gray-900 text-white"
        />
      </label>
      <RouteStyleUi style={route.style} />
    </div>
  );
}
