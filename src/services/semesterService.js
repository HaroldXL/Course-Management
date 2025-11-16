import api from './api';

const semesterService = {
  // Get all semesters
  getAll: async () => {
    const response = await api.get('/semesters');
    return response.data;
  },

  // Get semester by id
  getById: async (id) => {
    const response = await api.get(`/semesters/${id}`);
    return response.data;
  },

  // Create new semester
  create: async (semesterData) => {
    const response = await api.post('/semesters', semesterData);
    return response.data;
  },

  // Update semester
  update: async (id, semesterData) => {
    const response = await api.put(`/semesters/${id}`, semesterData);
    return response.data;
  },

  // Delete semester
  delete: async (id) => {
    const response = await api.delete(`/semesters/${id}`);
    return response.data;
  },
};

export default semesterService;
