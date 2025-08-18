

import React, { useState, useEffect } from 'react';
import { ExternalProjectItem } from '../types';

interface ExternalProjectIframeViewProps {
  project: ExternalProjectItem;
  onClose?: () => void;
  showCloseButton?: boolean;
}

const ExternalProjectIframeView: React.FC<ExternalProjectIframeViewProps> = ({ project, onClose, showCloseButton = false }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Setzt den Ladezustand zurück, wenn sich die Projekt-URL ändert
  useEffect(() => {
    setIsLoading(true);
  }, [project.url]);

  return (
    <div className="h-full w-full relative bg-zinc-800 shadow-inner">
      {showCloseButton && onClose && (
          <button
            onClick={onClose}
            aria-label={`Close ${project.name}`}
            className="absolute top-3 right-3 z-20 text-zinc-300 bg-black/40 rounded-full p-1.5 transition-all duration-200 hover:bg-red-500/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
              <span className="material-symbols-outlined text-lg leading-none" style={{ fontSize: '20px' }}>close</span>
          </button>
      )}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center animate-fadeIn z-0">
          <div className="w-12 h-12 rounded-full animate-spin border-4 border-dashed border-violet-400 border-t-transparent"></div>
        </div>
      )}
      <iframe
        key={project.url}
        src={project.url}
        title={project.name}
        className="w-full h-full border-0 relative z-10"
        style={{ backgroundColor: '#27272a', visibility: isLoading ? 'hidden' : 'visible' }}
        onLoad={() => setIsLoading(false)}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation allow-downloads"
      />
    </div>
  );
};

export default ExternalProjectIframeView;