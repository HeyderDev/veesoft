import React from 'react';
import { useInventoryNav, inventorySectionTabs } from '../hooks/useInventoryNav';

export const InventorySidebarSections: React.FC = () => {
  const { activeSection, setActiveSection } = useInventoryNav();

  return (
    <div className="relative pl-4 pr-2 mt-1 space-y-1">
      <span className="absolute left-[6px] top-0.5 bottom-0.5 w-0.5 rounded-full bg-emerald-400 shadow-[0_0_6px_1px_rgba(52,211,153,0.8)]" />
      <ul className="space-y-0.5">
        {inventorySectionTabs.map(section => {
          const isActive = activeSection === section.id;
          const Icon = section.icon;
          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-emerald-600/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{section.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
