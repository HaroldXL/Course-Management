import api from './api';

const subjectService = {
  // Get all subjects
  getAll: async () => {
    const response = await api.get('/subjects');
    return response.data;
  },

  // Get subject by id
  getById: async (id) => {
    const response = await api.get(`/subjects/${id}`);
    return response.data;
  },

  // Create new subject
  create: async (subjectData) => {
    const response = await api.post('/subjects', subjectData);
    return response.data;
  },

  // Update subject
  update: async (id, subjectData) => {
    const response = await api.put(`/subjects/${id}`, subjectData);
    return response.data;
  },

  // Delete subject
  delete: async (id) => {
    const response = await api.delete(`/subjects/${id}`);
    return response.data;
  },
};

export default subjectService;
