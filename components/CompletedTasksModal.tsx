import React, { useEffect, useState } from 'react';
import { TaskItem } from '../types';

interface CompletedTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onToggleTask: (task: TaskItem) => void;
}

const CompletedTasksModal: React.FC<CompletedTasksModalProps> = ({ isOpen, onClose, tasks, onToggleTask }) => {

  const [visibleCount, setVisibleCount] = useState(15);
  const tasksPerLoad = 15;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset count when modal opens
  useEffect(() => {
    if (isOpen) {
      setVisibleCount(tasksPerLoad);
    }
  }, [isOpen]);


  const currentTasks = tasks.slice(0, visibleCount);
  const hasMore = visibleCount < tasks.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + tasksPerLoad);
  };


  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="completed-tasks-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
      `}</style>
      <div
        className="bg-zinc-800/80 backdrop-blur-xl border border-zinc-700/60 rounded-2xl shadow-lg w-full max-w-md m-4 p-6 animate-scaleIn max-h-[80dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 id="completed-tasks-modal-title" className="text-xl font-bold text-zinc-100">
            Erledigte Aufgaben
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500"
            aria-label="Modal schließen"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto -mr-3 pr-3 space-y-2">
            {currentTasks.length > 0 ? (
                currentTasks.map(task => (
                    <div
                        key={task.id}
                        onClick={() => onToggleTask(task)}
                        className="flex items-center p-3 bg-zinc-900/50 rounded-lg cursor-pointer hover:bg-zinc-700/60 transition-colors"
                        role="button"
                        aria-label={`Markiere Aufgabe als unvollständig: ${task.text}`}
                    >
                        <span className="material-symbols-outlined mr-3 text-violet-400">
                           check_box
                        </span>
                        <span className="flex-grow line-through text-zinc-400">
                            {task.text}
                        </span>
                         <span className="text-xs text-zinc-500 ml-3 flex-shrink-0">
                            {new Date(task.entryCreatedAt).toLocaleDateString('de-DE', {day: '2-digit', month: 'short'})}
                        </span>
                    </div>
                ))
            ) : (
                <p className="text-center text-zinc-500 py-8">Keine erledigten Aufgaben.</p>
            )}
        </div>
        {hasMore && (
          <div className="pt-4 mt-2 flex-shrink-0 text-center">
            <button
              onClick={handleLoadMore}
              className="bg-zinc-700/50 hover:bg-zinc-700/80 text-zinc-200 font-semibold py-2 px-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500"
            >
              Mehr laden ({tasks.length - visibleCount} verbleibend)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletedTasksModal;