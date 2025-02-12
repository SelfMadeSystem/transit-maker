import { ContextMenu } from './ContextMenu';

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
  x: number,
  y: number,
): Promise<T | undefined> => {
  return new Promise(resolve => {
    const onClick = (label: T) => {
      hideContextMenu();
      resolve(label);
    };
    showContextMenu({
      x,
      y,
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
