import { Color } from '../components/color/Color';
import { TransitMap } from './TransitMap';
import { ContainerApi } from '@tweakpane/core';
import { ListBladeApi, ListBladeParams } from 'tweakpane';

/**
 * Options for creating a route selector
 */
export interface RouteSelectorOptions<Auto extends boolean> {
  /** The label to show for the selector */
  label?: string;
  /** Whether to include an "Auto" option (null value) */
  includeAuto?: Auto;
  /** Custom text for the auto option */
  autoText?: string;
  /** Whether to include the default route */
  includeDefaultRoute?: boolean;
  /** Custom text for the default route option */
  defaultRouteText?: string;
  /** Filter function for which routes to include */
  routeFilter?: (route: Route) => boolean;
  /** Sort function for the routes */
  routeSort?: (a: Route, b: Route) => number;
}

/**
 * Creates a route selector in the given tweakpane folder
 *
 * @param folder The tweakpane folder to add the selector to
 * @param map The transit map containing routes
 * @param currentValue The currently selected route
 * @param onChange Callback when the route selection changes
 * @param options Configuration options
 * @returns The created list blade API
 */
export function createRouteSelector<
  Auto extends boolean,
  Result extends Route | (Auto extends true ? null : never) =
    | Route
    | (Auto extends true ? null : never),
>(
  folder: ContainerApi,
  map: TransitMap,
  currentValue: Result,
  onChange: (route: Result) => void,
  options: RouteSelectorOptions<Auto> = {},
): ListBladeApi<Result> {
  const {
    label = 'Route',
    includeAuto = true,
    autoText = 'Auto',
    includeDefaultRoute = true,
    defaultRouteText = 'Default Route',
    routeFilter = () => true,
    routeSort,
  } = options;

  // Build options array
  const listOptions: Array<{ text: string; value: Route | null }> = [];

  // Add Auto option if requested
  if (includeAuto) {
    listOptions.push({
      text: autoText,
      value: null,
    });
  }

  // Add Default Route if requested
  if (includeDefaultRoute) {
    listOptions.push({
      text: defaultRouteText,
      value: map.defaultRoute,
    });
  }

  // Get filtered routes (excluding default if it was already added)
  let filteredRoutes = map.routes
    .filter(r => (includeDefaultRoute ? r !== map.defaultRoute : true))
    .filter(routeFilter);

  // Sort routes if sort function provided
  if (routeSort) {
    filteredRoutes = [...filteredRoutes].sort(routeSort);
  }

  // Add filtered routes to options
  listOptions.push(
    ...filteredRoutes.map(route => ({
      text: route.name,
      value: route,
    })),
  );

  // Create and return the blade
  const blade = folder.addBlade({
    view: 'list',
    label,
    options: listOptions,
    value: currentValue,
  } satisfies ListBladeParams<Route | null>) as ListBladeApi<Result>;

  blade.on('change', e => {
    onChange(e.value);
  });

  return blade;
}

export class Route {
  public color: Color = Color.WHITE;
  public name: string;
  public readonly index: number;
  constructor(public readonly map: TransitMap) {
    this.index = map.routes.length;
    this.name = `Route ${this.index + 1}`;
    map.routes.push(this);
  }
}
