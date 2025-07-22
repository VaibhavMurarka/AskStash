import axios from 'axios';

const API_BASE_URL = 'https://askstashserver.onrender.com';
//'https://vaibhavmurarka2.pythonanywhere.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // On authentication failure, clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * JSDoc comments for API object shapes.
 * These are for documentation purposes as JS doesn't enforce types.
 *
 * @typedef {object} User
 * @property {number} id
 * @property {string} email
 * @property {string} full_name
 *
 * @typedef {object} AuthResponse
 * @property {string} access_token
 * @property {string} token_type
 * @property {User} user
 *
 * @typedef {object} Document
 * @property {number} id
 * @property {string} filename
 * @property {string} file_type
 * @property {string} created_at
 * @property {number} [content_length]
 * @property {string} [content]
 *
 * @typedef {object} ChatMessage
 * @property {number} id
 * @property {number} user_id
 * @property {string} message
 * @property {string} response
 * @property {string} [context_documents]
 * @property {string} created_at
 *
 * @typedef {object} ChatResponse
 * @property {string} response
 * @property {boolean} context_used
 * @property {Array<{id: number, filename: string}>} context_sources
 */

export const authAPI = {
  /**
   * Registers a new user.
   * @param {string} email - The user's email.
   * @param {string} password - The user's password.
   * @param {string} full_name - The user's full name.
   * @returns {Promise<AuthResponse>}
   */
  register: async (email, password, full_name) => {
    const response = await api.post('/api/auth/register', { email, password, full_name });
    return response.data;
  },

  /**
   * Logs in a user.
   * @param {string} email - The user's email.
   * @param {string} password - The user's password.
   * @returns {Promise<AuthResponse>}
   */
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },
};

export const documentAPI = {
  /**
   * Uploads a file.
   * @param {File} file - The file to upload.
   * @returns {Promise<any>}
   */
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Retrieves all documents for the user.
   * @returns {Promise<{ documents: Document[] }>}
   */
  getDocuments: async () => {
    const response = await api.get('/api/documents');
    return response.data;
  },

  /**
   * Retrieves a single document by its ID.
   * @param {number} documentId - The ID of the document.
   * @returns {Promise<{ document: Document }>}
   */
  getDocument: async (documentId) => {
    const response = await api.get(`/api/documents/${documentId}`);
    return response.data;
  },

  /**
   * Deletes a document by its ID.
   * @param {number} documentId - The ID of the document to delete.
   * @returns {Promise<{ message: string }>}
   */
  deleteDocument: async (documentId) => {
    const response = await api.delete(`/api/documents/${documentId}`);
    return response.data;
  },
};

export const chatAPI = {
  /**
   * Sends a message to the chat API.
   * @param {string} message - The user's message.
   * @param {number[]} [selectedDocuments] - An array of selected document IDs for context.
   * @param {boolean} [useAllDocuments] - Flag to use all documents as context.
   * @returns {Promise<ChatResponse>}
   */
  sendMessage: async (message, selectedDocuments, useAllDocuments) => {
    const payload = { message };
    
    if (selectedDocuments && selectedDocuments.length > 0) {
      payload.selected_documents = selectedDocuments;
    }
    
    if (useAllDocuments) {
      payload.use_all_documents = true;
    }
    
    const response = await api.post('/api/chat', payload);
    return response.data;
  },

  /**
   * Retrieves the user's chat history.
   * @returns {Promise<{ history: ChatMessage[] }>}
   */
  getChatHistory: async () => {
    const response = await api.get('/api/chat/history');
    return response.data;
  },
};

export default api;