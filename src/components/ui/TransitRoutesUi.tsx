import { TransitMap } from '../../transit/TransitMap';
import { TransitRoute, createDefaultRoute } from '../../transit/TransitRoute';
import { RouteUi } from './RouteUi';
import { useState } from 'react';

//#region Route UI
export function TransitRoutesUi({
  routes: _routes,
  map,
}: {
  routes: Set<TransitRoute>;
  map: TransitMap;
}) {
  const [routes, setRoutes] = useState(_routes);
  const [route, setRoute] = useState<TransitRoute | null>(null);

  function addRoute() {
    const name = prompt('Enter route name');
    if (name) {
      const route = createDefaultRoute(map);
      route.name = name;
      routes.add(route);
      setRoute(route);
      setRoutes(new Set(routes));
    }
  }

  return (
    <>
      <div className="text-white">Modify routes</div>
      <div className="flex items-center gap-2">
        <div className="text-white">Select route:</div>
        <select
          value={route?.name}
          onChange={e => {
            const name = e.target.value;
            setRoute(Array.from(routes).find(r => r.name === name) ?? null);
          }}
          className="bg-gray-900 text-white"
        >
          <option value="">None</option>
          {Array.from(routes).map(r => (
            <option key={r.name} value={r.name}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      {route ? (
        <RouteUi key={route.id} route={route} />
      ) : (
        <button onClick={addRoute}>Add route</button>
      )}
    </>
  );
}
