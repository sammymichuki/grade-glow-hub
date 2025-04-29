
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedLoginStatus = localStorage.getItem('isLoggedIn');
    const storedName = localStorage.getItem('userName');
    const storedEmail = localStorage.getItem('userEmail');
    
    setIsLoggedIn(storedLoginStatus === 'true');
    
    if (storedLoginStatus === 'true' && storedEmail) {
      setUser({
        name: storedName || 'Student',
        email: storedEmail
      });
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API call
    try {
      // In a real app, this would validate credentials with an API
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', email);
      
      // If this is the first login and we don't have a name, use a default
      if (!localStorage.getItem('userName')) {
        localStorage.setItem('userName', 'Student');
      }
      
      setIsLoggedIn(true);
      setUser({
        name: localStorage.getItem('userName') || 'Student',
        email
      });
      
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const logout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    setUser(null);
  };

  const value = {
    isLoggedIn,
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
