import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Fallback para ambiente web
if (Platform.OS === 'web') {
  SecureStore.getItemAsync = async (key) => {
    console.log('Carregando token do localStorage:', key);
    return localStorage.getItem(key);
  };
  SecureStore.setItemAsync = async (key, value) => {
    console.log('Salvando token no localStorage:', key, value);
    localStorage.setItem(key, value);
  };
  SecureStore.deleteItemAsync = async (key) => {
    console.log('Removendo token do localStorage:', key);
    localStorage.removeItem(key);
  };
}

export const AuthContext = createContext({});

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorage() {
      try {
        const token = await SecureStore.getItemAsync('user_token');
        console.log('Token carregado:', token);
        if (token) {
          api.defaults.headers['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/me');
          console.log('Resposta /me:', response.data);
          setUser(response.data);
        }
      } catch (error) {
        console.error('Erro ao carregar token:', error);
      } finally {
        console.log('Finalizando loadStorage, loading:', false);
        setLoading(false);
      }
    }
    loadStorage();
  }, []);

  async function signUp(name, email, password) {
    setLoadingAuth(true);
    try {
      await api.post('/users', {
        name,
        email,
        password
      });
      console.log('Cadastro bem-sucedido:', { name, email });
      setLoadingAuth(false);
      return true;
    } catch (err) {
      console.error('Erro ao cadastrar:', err);
      setLoadingAuth(false);
      return false;
    }
  }

  async function signIn(email, password) {
    setLoadingAuth(true);
    try {
      const response = await api.post('/login', {
        email,
        password
      });
      
      const { token, user: userData } = response.data;
      console.log('Login bem-sucedido - Token:', token, 'User:', userData);
      
      await SecureStore.setItemAsync('user_token', token);
      api.defaults.headers['Authorization'] = `Bearer ${token}`;
      
      let finalUserData = userData;
      if (!userData) {
        console.log('User undefined, buscando dados via /me');
        const meResponse = await api.get('/me');
        finalUserData = meResponse.data;
        console.log('Resposta /me:', finalUserData);
      }
      
      setUser(finalUserData);
      setLoadingAuth(false);
      console.log('Estado user atualizado:', finalUserData);
      
      return true;
    } catch (err) {
      console.error('Erro ao logar:', err);
      setLoadingAuth(false);
      return false;
    }
  }

  async function signOut() {
    await SecureStore.deleteItemAsync('user_token');
    setUser(null);
    console.log('Logout realizado, user:', null);
  }

  return (
    <AuthContext.Provider value={{ 
      signed: !!user, 
      user, 
      signUp, 
      signIn, 
      signOut, 
      loadingAuth, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;