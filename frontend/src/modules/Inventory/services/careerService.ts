import axiosClient from '../../../shared/services/axiosClient';

export interface Career {
  id: number;
  name: string;
  status: 'active' | 'inactive';
}

export const careerService = {
  getCareers: async (): Promise<Career[]> => {
    return [];
  },
};
