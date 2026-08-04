import { createSignal } from 'solid-js';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: () => boolean;
  user: () => User | null;
  token: () => string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

let jwtToken: string | null = null;
let currentUser: User | null = null;

// Initialize from storage
function initializeAuth() {
  const stored = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
  if (stored) {
    jwtToken = stored;
    const userStored = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStored) {
      currentUser = JSON.parse(userStored);
    }
  }
}

function setJwtToken(token: string) {
  jwtToken = token;
  localStorage.setItem('jwtToken', token);
  sessionStorage.setItem('jwtToken', token);
}

function setUser(user: User) {
  currentUser = user;
  localStorage.setItem('user', JSON.stringify(user));
  sessionStorage.setItem('user', JSON.stringify(user));
}

function clearAuth() {
  jwtToken = null;
  currentUser = null;
  localStorage.removeItem('jwtToken');
  localStorage.removeItem('user');
  sessionStorage.removeItem('jwtToken');
  sessionStorage.removeItem('user');
}

export function useAuth() {
  const [isAuth, setIsAuth] = createSignal(!!jwtToken);
  const [user, setUserState] = createSignal<User | null>(currentUser);
  const [token, setTokenState] = createSignal<string | null>(jwtToken);

  initializeAuth();

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:3400/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const result = await response.json();
      setJwtToken(result.access_token);
      setUser(result.user);
      setIsAuth(true);
      setUserState(result.user);
      setTokenState(result.access_token);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    clearAuth();
    setIsAuth(false);
    setUserState(null);
    setTokenState(null);
  };

  return {
    isAuthenticated: isAuth,
    user,
    token,
    login,
    logout,
  };
}

// Helper to get the current token for API requests
export function getAuthToken(): string | null {
  if (!jwtToken) {
    const stored = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
    jwtToken = stored;
  }
  return jwtToken;
}

// Helper to check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
