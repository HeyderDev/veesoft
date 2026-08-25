import React, { createContext, useContext, useState } from 'react';
import type { TaskTab } from '../types';

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
