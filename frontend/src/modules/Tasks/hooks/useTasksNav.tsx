import React, { createContext, useContext, useState } from 'react';
import { BarChart3, CheckCircle2, Settings, type LucideIcon } from 'lucide-react';
import type { TaskTab } from '../types';

export const tasksSectionTabs: { id: TaskTab; label: string; icon: LucideIcon; adminOnly?: boolean }[] = [
  { id: 'activities', label: 'Actividades', icon: CheckCircle2 },
  { id: 'templates', label: 'Plantillas', icon: Settings },
  { id: 'reportes', label: 'Reportes', icon: BarChart3, adminOnly: true },
];

interface TasksNavValue {
  activeSection: TaskTab;
  setActiveSection: (section: TaskTab) => void;
}

const TasksNavContext = createContext<TasksNavValue | undefined>(undefined);

export const TasksNavProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<TaskTab>('activities');

  return (
    <TasksNavContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </TasksNavContext.Provider>
  );
};

export function useTasksNav(): TasksNavValue {
  const ctx = useContext(TasksNavContext);
  if (!ctx) throw new Error('useTasksNav debe usarse dentro de <TasksNavProvider>');
  return ctx;
}
