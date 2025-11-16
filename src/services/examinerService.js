import api from './api';

const examinerService = {
  // Get all examiners
  getAll: async () => {
    const response = await api.get('/examiners');
    return response.data;
  },

  // Get examiner by id
  getById: async (id) => {
    const response = await api.get(`/examiners/${id}`);
    return response.data;
  },

  // Create new examiner
  create: async (examinerData) => {
    const response = await api.post('/examiners', examinerData);
    return response.data;
  },

  // Update examiner
  update: async (id, examinerData) => {
    const response = await api.put(`/examiners/${id}`, examinerData);
    return response.data;
  },

  // Delete examiner
  delete: async (id) => {
    const response = await api.delete(`/examiners/${id}`);
    return response.data;
  },
};

export default examinerService;
