import React, { useLayoutEffect, useRef, useState } from 'react';

interface ContextMenuItem {
  label: string;
  icon: string;
  url?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

interface ContextMenuProps {
  position: { top: number; left: number };
  onClose: () => void;
  items: ContextMenuItem[];
  menuStyle?: React.CSSProperties;
  animationClass?: string;
  isViewportAware?: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ position, onClose, items, menuStyle, animationClass = 'animate-menu', isViewportAware = false }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  useLayoutEffect(() => {
    if (isViewportAware && menuRef.current) {
        const menuRect = menuRef.current.getBoundingClientRect();
        if (menuRect.width === 0) return; // Don't run if not measured yet

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const margin = 16;

        // position.left is the anchor's right edge. Position menu's right edge there.
        let newLeft = position.left - menuRect.width;
        let newTop = position.top;

        if (newLeft < margin) {
            newLeft = margin;
        }

        // Adjust vertical position
        if (animationClass !== 'animate-menu') { // For menus opening downwards
            if (newTop + menuRect.height > windowHeight - margin) {
                newTop = windowHeight - menuRect.height - margin;
            }
        }
        
        if (newTop < margin) {
            newTop = margin;
        }
        
        setAdjustedPosition({ top: newTop, left: newLeft });
    } else {
        setAdjustedPosition(position);
    }
    
    setIsVisible(true);
  }, [position, isViewportAware, animationClass]);


  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;
    if (item.onClick) {
      item.onClick();
    } else {
      onClose();
    }
  };

  const finalStyle: React.CSSProperties = {
    top: adjustedPosition.top,
    left: adjustedPosition.left,
    visibility: isVisible ? 'visible' : 'hidden',
    ...menuStyle,
  };

  return (
    <div className="fixed inset-0 z-30" onClick={onClose}>
      <style>{`
        @keyframes menuFadeInUp {
          from { opacity: 0; transform: translate(-50%, -100%) translateY(0px) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, -100%) translateY(-8px) scale(1); }
        }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-menu {
          animation: menuFadeInUp 0.15s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
          transform-origin: bottom center;
        }
        .animate-fadeIn {
            animation: fadeIn 0.1s ease-out forwards;
        }
      `}</style>
      <div
        ref={menuRef}
        className={`absolute bg-zinc-800/80 backdrop-blur-xl border border-zinc-700/60 rounded-xl shadow-lg w-56 p-2 ${animationClass}`}
        style={finalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          {items.map((item) => {
            const commonClasses = "w-full flex items-center text-left p-3 rounded-lg transition-colors duration-200 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500";
            const stateClasses = "bg-zinc-700/30 active:bg-zinc-700/60";
            const disabledClasses = 'text-zinc-500 bg-zinc-700/20 cursor-not-allowed';
            const finalClasses = `${commonClasses} ${item.disabled ? disabledClasses : (item.className || stateClasses)}`;

            if (item.url) {
              return (
                <a
                  key={item.label}
                  href={!item.disabled ? item.url : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (item.disabled) e.preventDefault();
                    else handleItemClick(item)
                  }}
                  className={finalClasses}
                  aria-disabled={item.disabled}
                >
                  <span className="material-symbols-outlined mr-3 text-zinc-400">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </a>
              );
            }
            
            return (
              <button
                key={item.label}
                onClick={() => handleItemClick(item)}
                className={finalClasses}
                disabled={item.disabled}
              >
                <span className="material-symbols-outlined mr-3 text-zinc-400">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ContextMenu;