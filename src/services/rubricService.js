import api from "./api";

const rubricService = {
  // Get all rubrics for a specific exam
  getByExamId: async (examId) => {
    const response = await api.get(`/rubrics/${examId}`);
    return response.data;
  },

  // Get all rubrics
  getAll: async () => {
    const response = await api.get("/rubrics");
    return response.data;
  },

  // Get a single rubric by ID
  getById: async (id) => {
    const response = await api.get(`/rubrics/${id}`);
    return response.data;
  },

  // Create a new rubric
  create: async (rubricData) => {
    const response = await api.post("/rubrics", rubricData);
    return response.data;
  },

  // Update a rubric
  update: async (id, rubricData) => {
    const response = await api.put(`/rubrics/${id}`, rubricData);
    return response.data;
  },

  // Delete a rubric
  delete: async (id) => {
    const response = await api.delete(`/rubrics/${id}`);
    return response.data;
  },
};

export default rubricService;
