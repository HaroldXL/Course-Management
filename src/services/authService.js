import authApi from './authApi';

const authService = {
  // Login
  login: async (keyLogin, password) => {
    const response = await authApi.post('/auth/login', { keyLogin, password });
    if (response.data.isSuccess && response.data.data.accessToken) {
      localStorage.setItem('token', response.data.data.accessToken);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
      localStorage.setItem('tokenExpiry', response.data.data.accessTokenExpiry);
    }
    return response.data;
  },

  // Register
  register: async (fullName, email, phoneNumber, password, role = 0) => {
    const response = await authApi.post('/auth/register', {
      fullName,
      email,
      phoneNumber,
      password,
      role,
    });
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
  },

  // Get current user from token
  getCurrentUser: () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      // Decode JWT token to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        email: payload.email,
        role: payload.role,
        fullName: payload.FullName,
        isActive: payload.IsActive === 'True',
      };
    } catch (error) {
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const expiry = localStorage.getItem('tokenExpiry');
    
    if (!token || !expiry) return false;
    
    // Check if token is expired
    const expiryDate = new Date(expiry);
    const now = new Date();
    
    return now < expiryDate;
  },

  // Get user role
  getUserRole: () => {
    const user = authService.getCurrentUser();
    return user?.role || null;
  },

  // Register (if needed)
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
};

export default authService;
