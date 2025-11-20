import api from "./api";

const violationService = {
  // Get all violations
  getAll: async () => {
    const response = await api.get("/violations");
    return response.data;
  },

  // Get a single violation by ID
  getById: async (id) => {
    const response = await api.get(`/violations/${id}`);
    return response.data;
  },

  // Create a new violation
  create: async (violationData) => {
    const response = await api.post("/violations", violationData);
    return response.data;
  },

  // Update a violation
  update: async (id, violationData) => {
    const response = await api.put(`/violations/${id}`, violationData);
    return response.data;
  },

  // Delete a violation
  delete: async (id) => {
    const response = await api.delete(`/violations/${id}`);
    return response.data;
  },
};

export default violationService;
