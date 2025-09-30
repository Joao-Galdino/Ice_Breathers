import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token automaticamente
    this.api.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor para lidar com respostas de erro
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expirado, limpar storage
          await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
        }
        return Promise.reject(error);
      }
    );
  }

  // Autenticação
  async login(username, password) {
    const response = await this.api.post('/auth/login/', {
      username,
      password,
    });
    
    if (response.data.access) {
      await AsyncStorage.setItem('access_token', response.data.access);
      await AsyncStorage.setItem('refresh_token', response.data.refresh);
    }
    
    return response.data;
  }

  async register(userData) {
    const response = await this.api.post('/auth/register/', userData);
    
    if (response.data.access) {
      await AsyncStorage.setItem('access_token', response.data.access);
      await AsyncStorage.setItem('refresh_token', response.data.refresh);
    }
    
    return response.data;
  }

  async logout() {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
  }

  // Perfil
  async getProfile() {
    const response = await this.api.get('/profiles/me/');
    return response.data;
  }

  // Sessões
  async createSession(sessionData) {
    const response = await this.api.post('/sessions/', sessionData);
    return response.data;
  }

  async getSessions() {
    const response = await this.api.get('/sessions/');
    return response.data;
  }

  async completeSession(sessionId) {
    const response = await this.api.post(`/sessions/${sessionId}/complete/`);
    return response.data;
  }

  async startHold(sessionId) {
    const response = await this.api.post(`/sessions/${sessionId}/start_hold/`);
    return response.data;
  }

  async endHold(sessionId, roundNumber, holdSeconds) {
    const response = await this.api.post(`/sessions/${sessionId}/end_hold/`, {
      round_number: roundNumber,
      hold_seconds: holdSeconds,
    });
    return response.data;
  }

  async endRecovery(sessionId, roundNumber, recoverySeconds) {
    const response = await this.api.post(`/sessions/${sessionId}/end_recovery/`, {
      round_number: roundNumber,
      recovery_seconds: recoverySeconds,
    });
    return response.data;
  }

  async getSessionStats() {
    const response = await this.api.get('/sessions/stats/');
    return response.data;
  }

  // Verificar conexão
  async healthCheck() {
    try {
      const response = await this.api.get('/health/');
      return response.data;
    } catch (error) {
      throw new Error('Servidor não disponível');
    }
  }
}

export default new ApiService();
