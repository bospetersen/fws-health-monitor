import { JSX, Accessor } from 'solid-js';
import { Navigate } from '@solidjs/router';
import { isAuthenticated } from '../services/authService';

interface ProtectedRouteProps {
  component: () => JSX.Element;
}

export default function ProtectedRoute(props: ProtectedRouteProps) {
  return isAuthenticated() ? props.component() : <Navigate href="/login" />;
}
