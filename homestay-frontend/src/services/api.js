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
  reject: (id) => api.put(`/bookings/${id}/reject`),
  cancelPreview: (id) => api.get(`/bookings/${id}/cancel-preview`),
  cancel: (id) => api.put(`/bookings/${id}/cancel`)
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
  deleteHomestay: (id) => api.delete(`/homestays/${id}`),
  updateStatus: (id, status) => api.put(`/homestays/${id}/status?status=${status}`),
  getCalendar: (id, month, year) => api.get(`/homestays/${id}/calendar`, { params: { month, year } }),
  getBookingsByDate: (id, date) => api.get(`/homestays/${id}/bookings`, { params: { date } })
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

export const statsService = {
  host: (params) => api.get('/stats/host', { params }),
  admin: (params) => api.get('/stats/admin', { params })
};

export const reviewService = {
  create: (data) => api.post('/reviews', data),
  getByHomestay: (homestayId) => api.get(`/reviews/homestay/${homestayId}`)
};

export const refundService = {
  getHostRefunds: () => api.get('/refunds/host'),
  getById: (id) => api.get(`/refunds/${id}`),
  confirmSent: (id) => api.put(`/refunds/${id}/confirm-sent`),
  getMyRefunds: () => api.get('/refunds/my'),
  confirmReceived: (id) => api.put(`/refunds/${id}/confirm-received`)
};
