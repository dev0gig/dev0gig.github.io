



import React from 'react';
import { View, ExternalProjectItem, MyProject } from '../types';
import SidebarInfoWidget from './SidebarInfoWidget';

interface SidebarProps {
  activeView: View;
  onNavigate: (view: View) => void;
  externalProjects: ExternalProjectItem[];
  onExternalProjectSelect: (project: ExternalProjectItem) => void;
  onExternalProjectContextMenu: (event: React.MouseEvent, project: ExternalProjectItem) => void;
  activeExternalProjects: { left: ExternalProjectItem | null; right: ExternalProjectItem | null };
  activeMyProject: MyProject | null;
  onMyProjectSelect: (project: MyProject) => void;
}

interface NavItem {
  view: View;
  label: string;
  icon: string;
}

const mainNavItems: NavItem[] = [
  { view: View.Apps, label: 'Apps', icon: 'apps' },
];

const MY_PROJECT_DEFINITIONS: Record<MyProject, { label: string; icon: string }> = {
  [MyProject.MemoMea]: { label: 'MemoMea', icon: 'edit_note' },
  [MyProject.ReadLateR]: { label: 'ReadLateR', icon: 'bookmark' },
  [MyProject.CollMea]: { label: 'CollMea', icon: 'collections_bookmark' },
};

const myProjectNavItems = Object.entries(MY_PROJECT_DEFINITIONS).map(([key, value]) => ({
    id: key as MyProject,
    label: value.label,
    icon: value.icon,
}));

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
    externalProjects, 
    onExternalProjectSelect, 
    onExternalProjectContextMenu, 
    activeExternalProjects, 
    activeMyProject, 
    onMyProjectSelect 
}) => {
  return (
    <aside className="bg-zinc-900/50 border-r border-zinc-800 flex flex-col p-4 flex-shrink-0 w-72">
        <div className="flex items-center mb-8 flex-shrink-0 px-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">AxisMea</h1>
        </div>
        
        <SidebarInfoWidget />

        <div className="flex-grow overflow-y-auto overflow-x-hidden -mr-2 pr-2">
            <nav className="space-y-2">
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
            
            <hr className="my-4 border-zinc-800" />

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
            
            {externalProjects.length > 0 && (
                <>
                    <hr className="my-4 border-zinc-800" />
                    <nav className="space-y-1">
                        {externalProjects.map((project) => {
                            const isActive = activeExternalProjects.left?.url === project.url || activeExternalProjects.right?.url === project.url;
                            return (
                                <button
                                    key={project.name}
                                    onClick={() => onExternalProjectSelect(project)}
                                    onContextMenu={(e) => onExternalProjectContextMenu(e, project)}
                                    className={`group relative flex items-center w-full px-4 py-2.5 rounded-lg text-left transition-colors duration-200 text-sm ${
                                        isActive
                                            ? 'bg-zinc-700/60 text-white font-semibold'
                                            : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-100'
                                    }`}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    <span className="material-symbols-outlined text-2xl text-zinc-500 mr-3">{project.icon}</span>
                                    <span>{project.name}</span>
                                </button>
                            );
                        })}
                    </nav>
                </>
            )}
        </div>

    </aside>
  );
};

export default Sidebar;