import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // Adjust base URL as per backend
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor for JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me')
};

export const homestayService = {
  getAll: (params) => api.get('/homestays', { params }),
  getById: (id) => api.get(`/homestays/${id}`)
};

export const bookingService = {
  create: (data) => api.post('/bookings', data),
  getMyBookings: () => api.get('/bookings/me'),
  getHostBookings: (params) => api.get('/bookings/host', { params }),
  confirm: (id) => api.put(`/bookings/${id}/confirm`),
  reject: (id) => api.put(`/bookings/${id}/reject`)
};

export const paymentService = {
  create: (data) => api.post('/payments', data)
};

export const userService = {
  updateMe: (data) => api.put('/users/me', data)
};

export const hostService = {
  getMyHomestays: () => api.get('/homestays/host'),
  createHomestay: (data) => api.post('/homestays', data),
  updateHomestay: (id, data) => api.put(`/homestays/${id}`, data),
  deleteHomestay: (id) => api.delete(`/homestays/${id}`)
};

export const uploadService = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export const hostRequestService = {
  submit: (data) => api.post('/host-requests', data),
  getMine: () => api.get('/host-requests/me'),
  getAll: (params) => api.get('/host-requests', { params }),
  getById: (id) => api.get(`/host-requests/${id}`),
  approve: (id) => api.put(`/host-requests/${id}/approve`),
  reject: (id, adminNote) => api.put(`/host-requests/${id}/reject`, { adminNote })
};

export const amenityService = {
  getAll: () => api.get('/amenities')
};
