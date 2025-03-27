import { Vector2 } from '../../utils/vec';

export type ContextMenu = {
  pos: Vector2;
  items: ContextMenuItem[];
  onClose?: () => void;
};

export type ContextMenuItem = {
  label: string;
  children?: ContextMenuItem[];
  onClick: () => void;
};

let setContextMenu: (menu: ContextMenu | null) => void = () => {};

export const setContextMenuSetter = (
  setter: (menu: ContextMenu | null) => void,
) => {
  setContextMenu = setter;
};

export const showContextMenu = (menu: ContextMenu) => {
  setContextMenu(menu);
};

export const hideContextMenu = () => {
  setContextMenu(null);
};

export const waitForInput = <T extends string>(
  items: T[],
  pos: Vector2,
): Promise<T | undefined> => {
  return new Promise(resolve => {
    const onClick = (label: T) => {
      hideContextMenu();
      resolve(label);
    };
    showContextMenu({
      pos,
      items: items.map(item => ({
        label: item,
        onClick: () => onClick(item),
      })),
      onClose: () => {
        resolve(undefined);
      },
    });
  });
};
