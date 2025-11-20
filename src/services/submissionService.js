import api from "./api";

const submissionService = {
  // Get all submissions for a specific exam
  getByExamId: async (examId) => {
    const response = await api.get(`/submissions`, {
      params: { examId },
    });
    return response.data;
  },

  // Get all submissions
  getAll: async () => {
    const response = await api.get("/submissions");
    return response.data;
  },

  // Get a single submission by ID
  getById: async (id) => {
    const response = await api.get(`/submissions/${id}`);
    return response.data;
  },

  // Create a new submission
  create: async (submissionData) => {
    const response = await api.post("/submissions", submissionData);
    return response.data;
  },

  // Update a submission
  update: async (id, submissionData) => {
    const response = await api.put(`/submissions/${id}`, submissionData);
    return response.data;
  },

  // Assign examiner to submission
  assignExaminer: async (id, examinerId) => {
    const response = await api.patch(`/submissions/${id}/assign/${examinerId}`);
    return response.data;
  },

  // Grade a submission
  gradeSubmission: async (id, totalScore) => {
    const response = await api.patch(`/submissions/${id}/grade`, { totalScore });
    return response.data;
  },

  // Delete a submission
  delete: async (id) => {
    const response = await api.delete(`/submissions/${id}`);
    return response.data;
  },
};

export default submissionService;
