
import React from 'react';

interface FloatingBackButtonProps {
  onClick: () => void;
}

const FloatingBackButton: React.FC<FloatingBackButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      aria-label="Zurück zur Übersicht"
      className="fixed top-4 right-4 z-50 w-12 h-12 bg-zinc-800/80 backdrop-blur-md text-white rounded-full flex items-center justify-center shadow-lg hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-colors"
    >
      <span className="material-symbols-outlined">dashboard</span>
    </button>
  );
};

export default FloatingBackButton;
