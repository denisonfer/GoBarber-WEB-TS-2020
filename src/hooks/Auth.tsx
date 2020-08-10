import React, { createContext, useCallback, useState, useContext } from 'react';

import api from '../services/api';

interface Usuario {
  id: string;
  avatar_url: string;
  nome: string;
}

interface AuthState {
  token: string;
  usuario: Usuario;
}
interface SigInCredentials {
  email: string;
  senha: string;
}

interface AuthContextDTO {
  usuario: Usuario;
  sigIn(credentials: SigInCredentials): Promise<void>;
  signOut(): void;
}

const AuthContext = createContext<AuthContextDTO>({} as AuthContextDTO);

export const AuthProvider: React.FC = ({ children }) => {
  const [data, setData] = useState<AuthState>(() => {
    const token = localStorage.getItem('@GoBarber:token');
    const usuario = localStorage.getItem('@GoBarber:usuario');

    if (token && usuario) {
      api.defaults.headers.authorization = `Bearer ${token}`;

      return { token, usuario: JSON.parse(usuario) };
    }

    return {} as AuthState;
  });

  const sigIn = useCallback(async ({ email, senha }) => {
    const response = await api.post('/sessoes', {
      email,
      senha,
    });

    const { usuario, token } = response.data;

    localStorage.setItem('@GoBarber:token', token);
    localStorage.setItem('@GoBarber:usuario', JSON.stringify(usuario));

    api.defaults.headers.authorization = `Bearer ${token}`;

    setData({ token, usuario });
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('@GoBarber:token');
    localStorage.removeItem('@GoBarber:usuario');

    setData({} as AuthState);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario: data.usuario, sigIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextDTO {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth precisa de um AuthProvider');
  }

  return context;
}
