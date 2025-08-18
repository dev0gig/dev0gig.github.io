
import React from 'react';
import { ExternalProjectItem } from '../types';

interface ExternalProjectsViewProps {
  projects: ExternalProjectItem[];
  onProjectSelect: (project: ExternalProjectItem) => void;
}

const ExternalProjectCard: React.FC<{ project: ExternalProjectItem; onSelect: () => void }> = ({ project, onSelect }) => (
  <button
    onClick={onSelect}
    className="bg-zinc-800/70 backdrop-blur-xl border border-zinc-700/60 p-5 rounded-xl shadow-md w-full text-left group transition-all duration-300 hover:border-zinc-600 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500 flex flex-col h-full"
    aria-label={`Öffne Projekt ${project.name}`}
  >
    <div className="flex items-center mb-4">
      <div className="p-3 bg-zinc-900/50 rounded-lg mr-4">
        <span className="material-symbols-outlined text-3xl text-violet-400">{project.icon}</span>
      </div>
      <h3 className="font-bold text-lg text-zinc-200 group-hover:text-white transition-colors truncate">{project.name}</h3>
    </div>
    <p className="text-sm text-zinc-400 flex-grow leading-relaxed">{project.description}</p>
  </button>
);


const ExternalProjectsView: React.FC<ExternalProjectsViewProps> = ({ projects, onProjectSelect }) => {
  return (
    <div className="animate-fadeIn h-full flex flex-col">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
      
      <header className="flex items-center space-x-3 text-zinc-300 mb-6 flex-shrink-0">
        <span className="material-symbols-outlined text-4xl">public</span>
        <h1 className="text-3xl font-bold tracking-tight">Externe Projekte</h1>
      </header>
      
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 pb-4">
            {projects.map(project => (
              <ExternalProjectCard key={project.name} project={project} onSelect={() => onProjectSelect(project)} />
            ))}
        </div>
      ) : (
         <div className="flex-grow flex flex-col items-center justify-center text-center text-zinc-500">
          <span className="material-symbols-outlined text-6xl mb-4 text-zinc-600">public_off</span>
          <h2 className="text-2xl font-bold text-zinc-400">Keine Projekte</h2>
          <p className="mt-1 text-zinc-500">Es sind keine externen Projekte konfiguriert.</p>
        </div>
      )}
    </div>
  );
};

export default ExternalProjectsView;
