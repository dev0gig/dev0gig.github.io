
import React from 'react';

interface PlaceholderViewProps {
  title: string;
  icon: string;
}

const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500">
      <span className="material-symbols-outlined text-8xl mb-4 text-zinc-600">{icon}</span>
      <h1 className="text-4xl font-bold tracking-tight text-zinc-300">{title}</h1>
      <p className="mt-2 text-lg text-zinc-400">Inhalt kommt bald.</p>
    </div>
  );
};

export default PlaceholderView;
