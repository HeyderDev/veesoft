import React from 'react';
import { useLogisticsNav, logisticsSectionTabs } from '../hooks/useLogisticsNav';
import { useAuth } from '../../../shared/context/AuthContext';

export const LogisticsSidebarSections: React.FC = () => {
  const { activeSection, setActiveSection } = useLogisticsNav();
  const { isAdmin } = useAuth();

  return (
    <div className="pl-4 pr-2 mt-1 space-y-1">
      <ul className="space-y-0.5">
        {logisticsSectionTabs.filter(tab => isAdmin || tab.id === 'purchases').map(section => {
          const isActive = activeSection === section.id;
          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-300 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <span className="text-sm">{section.icon}</span>
                <span>{section.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
