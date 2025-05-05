import { Color } from '../components/color/Color';
import { TransitMap } from './TransitMap';
import { ContainerApi, FolderApi } from '@tweakpane/core';
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
}

/**
 * Gets the routes for the route selector
 *
 * @param map The transit map containing routes
 * @param options Configuration options
 * @returns The list of routes for the selector
 */
export function getRouteSelectorOptions<
  Auto extends boolean,
  Result extends Route | (Auto extends true ? null : never) =
    | Route
    | (Auto extends true ? null : never),
>(
  map: TransitMap,
  options: RouteSelectorOptions<Auto>,
): Array<{ text: string; value: Result }> {
  const {
    includeAuto = true,
    autoText = 'Auto',
    includeDefaultRoute = true,
    defaultRouteText = 'Default Route',
  } = options;

  // Build options array
  const listOptions: Array<{ text: string; value: Result }> = [];

  // Add Auto option if requested
  if (includeAuto) {
    listOptions.push({
      text: autoText,
      value: null as Result,
    });
  }

  // Add Default Route if requested
  if (includeDefaultRoute) {
    listOptions.push({
      text: defaultRouteText,
      value: map.defaultRoute as Result,
    });
  }

  // Get filtered routes (excluding default if it was already added)
  const filteredRoutes = map.routes.filter(r =>
    includeDefaultRoute ? r !== map.defaultRoute : true,
  );

  // Add filtered routes to options
  listOptions.push(
    ...filteredRoutes.map(route => ({
      text: route.name,
      value: route as Result,
    })),
  );

  return listOptions;
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
): ListBladeApi<Result> & {
  refresh: () => void;
} {
  const { label } = options;

  // Get the route selector options
  const listOptions = getRouteSelectorOptions(map, options);

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

  // Refresh function to update the options
  (
    blade as ListBladeApi<Result> & {
      refresh: () => void;
    }
  ).refresh = () => {
    const newOptions = getRouteSelectorOptions(map, options);
    blade.options = newOptions as Array<{ text: string; value: Result }>;
  };

  return blade as ListBladeApi<Result> & {
    refresh: () => void;
  };
}

export class Route {
  public color: Color = Color.WHITE;
  public name: string;
  public index: number;
  constructor(public readonly map: TransitMap) {
    this.index = map.routes.length;
    this.name = `Route ${this.index + 1}`;
    map.routes.push(this);
  }

  tweakpaneFolder(folder: FolderApi): void {
    folder
      .addBinding(this, 'name', {
        label: 'Name',
        view: 'input',
        input: 'text',
      })
      .on('change', () => {
        this.map.routeSelector?.refresh();
      });
    folder
      .addBinding({ color: this.color.clone() }, 'color', {
        view: 'color',
        label: 'Color',
        color: {
          r: this.color.r,
          g: this.color.g,
          b: this.color.b,
          a: this.color.a,
        },
      })
      .on('change', e => {
        this.color = e.value;
      });
    folder
      .addButton({
        title: 'Move Up',
        disabled: this.index === 0,
      })
      .on('click', () => {
        const other = this.map.routes[this.index - 1];
        this.map.routes[this.index - 1] = this;
        this.map.routes[this.index] = other;
        this.index--;
        other.index++;
        this.map.routeSelector?.refresh();
      });
    folder
      .addButton({
        title: 'Move Down',
        disabled: this.index === this.map.routes.length - 1,
      })
      .on('click', () => {
        const other = this.map.routes[this.index + 1];
        this.map.routes[this.index + 1] = this;
        this.map.routes[this.index] = other;
        this.index++;
        other.index--;
        this.map.routeSelector?.refresh();
      });
    if (this === this.map.defaultRoute) {
      return;
    }
    const deleteBtn = folder
      .addButton({
        title: 'Delete',
      })
      .on('click', () => {
        this.map.routes.splice(this.index, 1);
        this.map.routeSelector?.refresh();
        folder.children.forEach(child => child.dispose());
      });
    (
      deleteBtn.element.querySelector('.tp-btnv_b') as HTMLButtonElement
    ).style.backgroundColor = '#e33636';
  }
}
