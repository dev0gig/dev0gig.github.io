
import React from 'react';
import { ExternalProjectItem } from '../types';
import ExternalProjectIframeView from './ExternalProjectIframeView';

interface SplitViewContainerProps {
  leftProject: ExternalProjectItem | null;
  rightProject: ExternalProjectItem | null;
  onClose: (position: 'left' | 'right') => void;
}

const SplitViewContainer: React.FC<SplitViewContainerProps> = ({ leftProject, rightProject, onClose }) => {
  const isSplit = leftProject && rightProject;

  return (
    <div className={`h-full w-full flex flex-row`}>
      {leftProject && (
        <div className={`relative ${isSplit ? 'w-1/2' : 'w-full'} h-full`}>
          <ExternalProjectIframeView
            project={leftProject}
            onClose={() => onClose('left')}
            showCloseButton={true}
          />
        </div>
      )}
      {rightProject && (
        <div className={`relative ${isSplit ? 'w-1/2' : 'w-full'} h-full`}>
           {isSplit && <div className="absolute top-0 bottom-0 left-0 w-px bg-zinc-700 z-30" aria-hidden="true"></div>}
          <ExternalProjectIframeView
            project={rightProject}
            onClose={() => onClose('right')}
            showCloseButton={true}
          />
        </div>
      )}
    </div>
  );
};

export default SplitViewContainer;
