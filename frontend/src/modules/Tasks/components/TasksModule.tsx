import React from 'react';
import { TasksPage } from '../pages/TasksPage';

interface TasksModuleProps {
  onTabChange?: (label: string) => void;
}

/**
 * Componente raíz del módulo Tasks.
 * No tiene navegación drill-down — muestra directamente la página de tareas.
 */
export const TasksModule: React.FC<TasksModuleProps> = ({ onTabChange }) => {
  React.useEffect(() => {
    onTabChange?.('Tareas Operativas');
  }, [onTabChange]);

  return (
    <div className="animate-fade-in">
      <TasksPage />
    </div>
  );
};
