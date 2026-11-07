const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const ACCESS_TOKEN_KEY = 'gymnasyum_access_token';
const REFRESH_TOKEN_KEY = 'gymnasyum_refresh_token';

export const getAccessToken = () =>
  localStorage.getItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = () =>
  localStorage.getItem(REFRESH_TOKEN_KEY);

export const saveTokens = ({ accessToken, refreshToken }) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearTokens();
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const result = await response.json();

    if (!response.ok || result.status !== 'success') {
      clearTokens();
      return false;
    }

    saveTokens({
      accessToken: result.data.accessToken,
      refreshToken: result.data.refreshToken,
    });

    return true;
  } catch (error) {
    console.error('Gagal memperbarui token:', error);
    return false;
  }
};

export const apiRequest = async (endpoint, options = {}, retry = true) => {
  const headers = { ...options.headers };
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (isFormData) {
    delete headers['Content-Type'];
    delete headers['content-type'];
  } else if (!headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  const accessToken = getAccessToken();

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      'Tidak dapat terhubung ke server. Periksa koneksi backend.',
      { cause: error },
    );
  }

  if (response.status === 401 && retry && endpoint !== '/auth/refresh') {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      return apiRequest(endpoint, options, false);
    }

    clearTokens();
    throw new Error('Sesi berakhir. Silakan login kembali.');
  }

  const result = await response.json();

  if (!response.ok || result.status !== 'success') {
    throw new Error(result.message || 'Terjadi kesalahan pada server.');
  }

  return result.data;
};

export const loginRequest = async (credentials) => {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }, false);

  saveTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });

  return data.user;
};

export const getCurrentUser = () =>
  apiRequest('/auth/me');

export const logoutRequest = async () => {
  const refreshToken = getRefreshToken();

  try {
    if (getAccessToken()) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }, false);
    }
  } finally {
    clearTokens();
  }
};

export const getUsers = () =>
  apiRequest('/users');

export const updateOwnProfile = (profile) =>
  apiRequest('/users/me', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });

export const changeOwnPassword = (passwords) =>
  apiRequest('/users/me/password', {
    method: 'PATCH',
    body: JSON.stringify(passwords),
  });

export const uploadOwnProfilePhoto = (file) => {
  const formData = new FormData();
  formData.append('photo', file);

  return apiRequest('/users/me/photo', {
    method: 'POST',
    body: formData,
  });
};

const getAuthenticatedBlob = async (endpoint, retry = true) => {
  const headers = {};
  const accessToken = getAccessToken();
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, { headers });
  } catch (error) {
    throw new Error(
      'Tidak dapat terhubung ke server. Periksa koneksi backend.',
      { cause: error },
    );
  }

  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return getAuthenticatedBlob(endpoint, false);
    clearTokens();
    throw new Error('Sesi berakhir. Silakan login kembali.');
  }

  if (response.status === 404) return null;
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.message || 'Foto profil gagal dimuat.');
  }

  return response.blob();
};

export const getOwnProfilePhoto = () =>
  getAuthenticatedBlob('/users/me/photo');

export const getUserProfilePhoto = (userId) =>
  getAuthenticatedBlob(`/users/${encodeURIComponent(userId)}/photo`);

export const deleteOwnProfilePhoto = () =>
  apiRequest('/users/me/photo', { method: 'DELETE' });

export const createUser = (userData) =>
  apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

export const updateUser = (id, userData) =>
  apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });

export const deleteUser = (id) =>
  apiRequest(`/users/${id}`, {
    method: 'DELETE',
  });

// CUSTOMER API

export const getCustomers = (params = {}) => {
  const query = new URLSearchParams(params).toString();

  return apiRequest(`/customers${query ? `?${query}` : ''}`);
};

export const getAllCustomers = async (params = {}) => {
  const firstPage = await getCustomers({
    ...params,
    page: '1',
    limit: '100',
  });
  const pages = Array.from(
    { length: Math.max(0, firstPage.pagination.totalPages - 1) },
    (_, index) => String(index + 2),
  );
  const remainingPages = await Promise.all(
    pages.map((page) => getCustomers({ ...params, page, limit: '100' })),
  );

  return {
    ...firstPage,
    customers: [
      ...(firstPage.customers || []),
      ...remainingPages.flatMap((page) => page.customers || []),
    ],
  };
};

export const getCustomerById = (id) =>
  apiRequest(`/customers/${id}`);

export const createCustomer = (customerData) =>
  apiRequest('/customers', {
    method: 'POST',
    body: JSON.stringify(customerData),
  });

export const updateCustomer = (id, customerData) =>
  apiRequest(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(customerData),
  });

export const deactivateCustomer = (id) =>
  apiRequest(`/customers/${id}/deactivate`, {
    method: 'PATCH',
  });

// FOLLOW-UP API

export const getFollowUps = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/followups${query ? `?${query}` : ''}`);
};

export const updateFollowUpStatus = (customerId, status) =>
  apiRequest(`/followups/${customerId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const getFollowUpHistory = (customerId) =>
  apiRequest(`/followups/${customerId}/history`);

export const createFollowUpActivity = (customerId, activity) =>
  apiRequest(`/followups/${customerId}/activities`, {
    method: 'POST',
    body: JSON.stringify(activity),
  });

export const getFollowUpRecommendations = () =>
  apiRequest('/followups/recommendations');

export const getFollowupDraftStatus = () =>
  apiRequest('/followups/draft-status');
export const approveFollowUpRecommendation = (id, payload) =>
  apiRequest(`/followups/recommendations/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const dismissFollowUpRecommendation = (id, note = '') =>
  apiRequest(`/followups/recommendations/${id}/dismiss`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });

// ATTENDANCE API

export const getAttendances = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/attendances${query ? `?${query}` : ''}`);
};

export const createAttendance = (attendance) =>
  apiRequest('/attendances', {
    method: 'POST',
    body: JSON.stringify(attendance),
  });

// SCHEDULE API

export const getSchedules = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/schedules${query ? `?${query}` : ''}`);
};

export const getScheduleById = (id) =>
  apiRequest(`/schedules/${id}`);

export const createSchedule = (schedule) =>
  apiRequest('/schedules', {
    method: 'POST',
    body: JSON.stringify(schedule),
  });

export const updateSchedule = (id, schedule) =>
  apiRequest(`/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(schedule),
  });

export const deleteSchedule = (id) =>
  apiRequest(`/schedules/${id}`, {
    method: 'DELETE',
  });

// REMINDER AND REPORT API

export const getReminders = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/reminders${query ? `?${query}` : ''}`);
};

export const getReminderDraftStatus = () =>
  apiRequest('/reminders/draft-status');

export const reviewReminder = (id, payload) =>
  apiRequest(`/reminders/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const markReminderSent = (id) =>
  apiRequest(`/reminders/${id}/send`, { method: 'POST' });

export const setReminderResponse = (id, responded, note = '') =>
  apiRequest(`/reminders/${id}/${responded ? 'responded' : 'no-response'}`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });

export const getReminderHistory = (id) =>
  apiRequest(`/reminders/${id}/history`);

export const getStaffNotifications = () =>
  apiRequest('/reminders/notifications');

export const markStaffNotificationRead = (id) =>
  apiRequest(`/reminders/notifications/${id}/read`, { method: 'PATCH' });

export const getReports = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/reports${query ? `?${query}` : ''}`);
};