import submissionDetailApi from './submissionDetailApi';

const submissionDetailService = {
  // Get submission details by submission ID
  getBySubmissionId: async (submissionId) => {
    const response = await submissionDetailApi.get(`/submissions/${submissionId}`);
    return response.data;
  },

  // Get download URL for submission
  getDownloadUrl: async (submissionId) => {
    const response = await submissionDetailApi.get(`/submissions/download/${submissionId}`);
    return response.data;
  },
};

export default submissionDetailService;
