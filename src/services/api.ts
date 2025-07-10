import axios from 'axios';

const API_BASE_URL = 'https://vaibhavmurarka2.pythonanywhere.com';


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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  email: string;
  full_name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Document {
  id: number;
  filename: string;
  file_type: string;
  created_at: string;
  content_length?: number;
  content?: string;
}

export interface ChatMessage {
  id: number;
  user_id: number;
  message: string;
  response: string;
  context_documents?: string;
  created_at: string;
}

export interface ChatResponse {
  response: string;
  context_used: boolean;
  context_sources: Array<{
    id: number;
    filename: string;
  }>;
}

export const authAPI = {
  register: async (email: string, password: string, full_name: string): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/register', { email, password, full_name });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },
};

export const documentAPI = {
  upload: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getDocuments: async (): Promise<{ documents: Document[] }> => {
    const response = await api.get('/api/documents');
    return response.data;
  },

  getDocument: async (documentId: number): Promise<{ document: Document }> => {
    const response = await api.get(`/api/documents/${documentId}`);
    return response.data;
  },

  deleteDocument: async (documentId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/api/documents/${documentId}`);
    return response.data;
  },
};

export const chatAPI = {
  sendMessage: async (
    message: string, 
    selectedDocuments?: number[], 
    useAllDocuments?: boolean
  ): Promise<ChatResponse> => {
    const payload: any = { message };
    
    if (selectedDocuments && selectedDocuments.length > 0) {
      payload.selected_documents = selectedDocuments;
    }
    
    if (useAllDocuments) {
      payload.use_all_documents = true;
    }
    
    const response = await api.post('/api/chat', payload);
    return response.data;
  },

  getChatHistory: async (): Promise<{ history: ChatMessage[] }> => {
    const response = await api.get('/api/chat/history');
    return response.data;
  },
};

export default api; 