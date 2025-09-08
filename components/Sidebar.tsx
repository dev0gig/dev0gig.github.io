import React from 'react';
import { View, MyProject } from '../types';
import SidebarInfoWidget from './SidebarInfoWidget';

interface SidebarProps {
  activeView: View;
  onNavigate: (view: View) => void;
  activeMyProject: MyProject | null;
  onMyProjectSelect: (project: MyProject) => void;
  onOpenSettings: () => void;
}

interface NavItem {
  view: View;
  label: string;
  icon: string;
}

const mainNavItems: NavItem[] = [
  { view: View.Apps, label: 'Alle Apps', icon: 'apps' },
];

const MY_PROJECT_DEFINITIONS: Record<MyProject, { label: string; icon: string }> = {
  [MyProject.MemoMea]: { label: 'MemoMea', icon: 'edit_note' },
  [MyProject.ReadLateR]: { label: 'ReadLateR', icon: 'bookmark' },
  [MyProject.CollMea]: { label: 'CollMea', icon: 'collections_bookmark' },
  [MyProject.AuriMea]: { label: 'AuriMea', icon: 'payments' },
  [MyProject.FWDaten]: { label: 'FW-Daten', icon: 'ssid_chart' },
};

const myProjectNavItems = Object.entries(MY_PROJECT_DEFINITIONS)
  .map(([key, value]) => ({
    id: key as MyProject,
    label: value.label,
    icon: value.icon,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

const NavButton: React.FC<{
    label: string;
    icon: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`group relative flex items-center w-full px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
            isActive
                ? 'bg-violet-500/20 text-white font-semibold'
                : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-100'
        }`}
        aria-current={isActive ? 'page' : undefined}
    >
        <span className="material-symbols-outlined text-2xl mr-4">{icon}</span>
        <span>{label}</span>
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ 
    activeView, 
    onNavigate, 
    activeMyProject, 
    onMyProjectSelect,
    onOpenSettings,
}) => {
  return (
    <aside className="bg-zinc-900/50 border-r border-zinc-800 flex flex-col p-4 flex-shrink-0 w-72">
        <div className="flex items-center justify-between mb-8 flex-shrink-0 px-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">AxisMea</h1>
            <button 
                onClick={onOpenSettings}
                className="text-zinc-400 hover:text-white transition-colors rounded-full w-10 h-10 -m-2 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
                aria-label="Einstellungen öffnen"
            >
                <span className="material-symbols-outlined">settings</span>
            </button>
        </div>
        
        <SidebarInfoWidget />

        <div className="flex-grow overflow-y-auto overflow-x-hidden -mr-2 pr-2">
            <h3 className="px-2 mb-3 mt-2 font-bold text-zinc-100">My Favorites</h3>
            <nav className="space-y-1">
                {mainNavItems.map((item) => (
                    <NavButton
                        key={item.view}
                        label={item.label}
                        icon={item.icon}
                        isActive={activeView === item.view}
                        onClick={() => onNavigate(item.view)}
                    />
                ))}
            </nav>
            
            <h3 className="px-2 mb-3 mt-6 font-bold text-zinc-100">Tools</h3>
            <nav className="space-y-1">
                {myProjectNavItems.map((project) => (
                    <NavButton
                        key={project.id}
                        label={project.label}
                        icon={project.icon}
                        isActive={activeMyProject === project.id}
                        onClick={() => onMyProjectSelect(project.id)}
                    />
                ))}
            </nav>
        </div>

    </aside>
  );
};

export default Sidebar;