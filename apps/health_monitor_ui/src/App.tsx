import { createSignal } from 'solid-js';
import { Router, Route, Navigate } from '@solidjs/router';
import './App.css';
import LoginPage from './components/LoginPage';
import HealthStatusPage from './components/pages/HealthStatusPage';
import ManageEndpointsPage from './components/pages/ManageEndpointsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './services/authService';

function App() {
  const auth = useAuth();

  return (
    <Router>
      <Route path="/login" component={LoginPage} />
      <Route
        path="/system/health"
        component={() => <ProtectedRoute component={HealthStatusPage} />}
      />
      <Route
        path="/system/manage-endpoints"
        component={() => <ProtectedRoute component={ManageEndpointsPage} />}
      />
      <Route path="/" component={() => <Navigate href="/system/health" />} />
    </Router>
  );
}

export default App;

