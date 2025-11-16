import api from './api';

const examService = {
  // Get all exams
  getAll: async (semesterId = null, subjectId = null) => {
    let url = '/exams';
    const params = new URLSearchParams();
    
    if (semesterId) params.append('semesterId', semesterId);
    if (subjectId) params.append('subjectId', subjectId);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
  },

  // Get exam by id
  getById: async (id) => {
    const response = await api.get(`/exams/${id}`);
    return response.data;
  },

  // Create new exam
  create: async (examData) => {
    const response = await api.post('/exams', examData);
    return response.data;
  },

  // Update exam
  update: async (id, examData) => {
    const response = await api.put(`/exams/${id}`, examData);
    return response.data;
  },

  // Delete exam
  delete: async (id) => {
    const response = await api.delete(`/exams/${id}`);
    return response.data;
  },
};

export default examService;
