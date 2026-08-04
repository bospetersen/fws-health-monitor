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

// Create SHARED signals once, not per useAuth() call
const [isAuth, setIsAuth] = createSignal(false);
const [user, setUserState] = createSignal<User | null>(null);
const [token, setTokenState] = createSignal<string | null>(null);

// Initialize from storage once on module load
function initializeAuth() {
  const stored = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
  if (stored) {
    jwtToken = stored;
    const userStored = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStored) {
      currentUser = JSON.parse(userStored);
    }
    setIsAuth(true);
    setUserState(currentUser);
    setTokenState(jwtToken);
  }
}

function setJwtToken(token: string) {
  jwtToken = token;
  localStorage.setItem('jwtToken', token);
  sessionStorage.setItem('jwtToken', token);
  setTokenState(token);
}

function setUser(user: User) {
  currentUser = user;
  localStorage.setItem('user', JSON.stringify(user));
  sessionStorage.setItem('user', JSON.stringify(user));
  setUserState(user);
}

function clearAuth() {
  jwtToken = null;
  currentUser = null;
  localStorage.removeItem('jwtToken');
  localStorage.removeItem('user');
  sessionStorage.removeItem('jwtToken');
  sessionStorage.removeItem('user');
  setIsAuth(false);
  setUserState(null);
  setTokenState(null);
}

// Initialize on load
initializeAuth();

export function useAuth() {
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
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    clearAuth();
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
