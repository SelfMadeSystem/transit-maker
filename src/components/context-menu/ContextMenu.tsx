import { ContextMenu, setContextMenuSetter } from '.';
import { useRef, useState } from 'react';

export const ContextMenuContainer = () => {
  const [menu, _setMenu] = useState<ContextMenu | null>(null);
  const prevMouseDown = useRef<(e: MouseEvent) => void>();
  const parentRef = useRef<HTMLDivElement>(null);

  function setMenu(newMenu: ContextMenu | null) {
    _setMenu(menu => {
      if (menu?.onClose) {
        menu.onClose();
      }
      return newMenu;
    });

    if (prevMouseDown.current) {
      window.removeEventListener('mousedown', prevMouseDown.current, {
        capture: true,
      });
    }

    if (!newMenu) {
      return;
    }

    const onMouseDown = (e: MouseEvent) => {
      if (!parentRef.current?.contains(e.target as Node)) {
        setMenu(null);
        window.removeEventListener('mousedown', onMouseDown, {
          capture: true,
        });
      }
    };
    prevMouseDown.current = onMouseDown;
    window.addEventListener('mousedown', onMouseDown, {
      capture: true,
    });
  }

  setContextMenuSetter(setMenu);

  return (
    <div
      ref={parentRef}
      className="fixed inset-0 z-50"
      style={{
        pointerEvents: 'none',
      }}
      onContextMenu={e => {
        e.preventDefault();
      }}
    >
      {menu && (
        <div
          className="fixed"
          style={{
            left: menu.pos.x,
            top: menu.pos.y,
            pointerEvents: 'auto',
          }}
        >
          <div className="rounded border border-gray-300 bg-gray-900 shadow-md">
            {menu.items.map((item, i) => (
              <div key={i}>
                <button
                  onClick={() => {
                    item.onClick();
                    setMenu(null);
                  }}
                  className="block w-full rounded px-4 py-2 text-left hover:bg-gray-800"
                >
                  {item.label}
                </button>
                {item.children && (
                  <div className="pl-4">
                    {item.children.map((child, j) => (
                      <button
                        key={j}
                        onClick={() => {
                          child.onClick();
                          setMenu(null);
                        }}
                        className="block w-full px-4 py-2 text-left hover:bg-gray-800"
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
