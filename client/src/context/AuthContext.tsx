import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'COORDINATOR';
  schoolId?: string | null;
  schoolName?: string | null;
  organizationId?: string | null;
  studentId?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  switchDemoUser: (role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('spis_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('spis_token'));
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('spis_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('spis_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const login = async (email: string, password = 'Password@123') => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }

    const data = await res.json();
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('spis_user', JSON.stringify(data.user));
    localStorage.setItem('spis_token', data.token);
  };

  const switchDemoUser = async (role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT') => {
    const accounts = {
      SUPER_ADMIN: { email: 'superadmin@spis.edu', pass: 'Admin@123' },
      SCHOOL_ADMIN: { email: 'principal@oakridge.edu', pass: 'Principal@123' },
      TEACHER: { email: 'math.teacher@oakridge.edu', pass: 'Teacher@123' },
      STUDENT: { email: 'student.aarav@oakridge.edu', pass: 'Student@123' }
    };

    const target = accounts[role];
    await login(target.email, target.pass);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('spis_user');
    localStorage.removeItem('spis_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, theme, toggleTheme, switchDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
