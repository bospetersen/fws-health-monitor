import { JSX } from 'solid-js';
import { Show } from 'solid-js';
import { Navigate } from '@solidjs/router';
import { useAuth } from '../services/authService';

interface ProtectedRouteProps {
  component: () => JSX.Element;
}

export default function ProtectedRoute(props: ProtectedRouteProps) {
  const auth = useAuth();
  return (
    <Show when={auth.isAuthenticated()} fallback={<Navigate href="/login" />}>
      {props.component()}
    </Show>
  );
}
