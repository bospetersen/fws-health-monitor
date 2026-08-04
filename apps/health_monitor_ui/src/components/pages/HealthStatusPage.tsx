/**
 * Health Status Page
 * Displays monitoring of system endpoints and their health status
 * Integrated with Health Monitor API
 */

import { createSignal, createEffect, onCleanup, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth, getAuthToken } from '../../services/authService';
import styles from './pageLayout.module.css';

interface SystemLink {
  name: string;
  url: string;
  type: 'Login' | 'Swagger';
  description: string;
  protocol: 'HTTP' | 'HTTPS';
}

interface EndpointStatus {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'offline';
  responseTime?: number;
  statusCode?: number;
  errorMessage?: string;
  checkedAt: Date;
}

export default function HealthStatusPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  
  const [copiedUrl, setCopiedUrl] = createSignal<string | null>(null);
  const [endpointStatus, setEndpointStatus] = createSignal<Map<string, EndpointStatus>>(new Map());
  const [isLoading, setIsLoading] = createSignal(false);

  // System links to monitor - from the original SystemLinksPage
  const systemLinks: SystemLink[] = [
    {
      name: 'Colorworks Admin UI',
      url: 'https://localhost:3100',
      type: 'Login',
      description: 'Admin interface for Colorworks system',
      protocol: 'HTTPS',
    },
    {
      name: 'Colorworks Main UI',
      url: 'https://localhost:3001',
      type: 'Login',
      description: 'Main user interface for Colorworks',
      protocol: 'HTTPS',
    },
    {
      name: 'Auth Service UI',
      url: 'https://localhost:3200',
      type: 'Login',
      description: 'Authentication and user management UI',
      protocol: 'HTTPS',
    },
    {
      name: 'Device Service UI',
      url: 'https://localhost:3300',
      type: 'Login',
      description: 'Device management and tracking interface',
      protocol: 'HTTPS',
    },
    {
      name: 'Global Authenticator UI',
      url: 'https://localhost:3301/login',
      type: 'Login',
      description: 'Global authentication interface',
      protocol: 'HTTPS',
    },
    {
      name: 'Colorworks API',
      url: 'https://localhost:3001/api',
      type: 'Swagger',
      description: 'Colorworks main API',
      protocol: 'HTTPS',
    },
    {
      name: 'Auth Service API',
      url: 'https://localhost:3200/api',
      type: 'Swagger',
      description: 'Authentication service API',
      protocol: 'HTTPS',
    },
    {
      name: 'Device Service API',
      url: 'https://localhost:3300/api',
      type: 'Swagger',
      description: 'Device management API',
      protocol: 'HTTPS',
    },
    {
      name: 'Global Authenticator Swagger',
      url: 'https://localhost:3301/swagger',
      type: 'Swagger',
      description: 'Global authenticator API documentation',
      protocol: 'HTTPS',
    },
    {
      name: 'Global Authenticator API',
      url: 'https://localhost:3301/api',
      type: 'Swagger',
      description: 'Authentication and user management API',
      protocol: 'HTTPS',
    },
  ];

  const checkEndpointHealth = async () => {
    setIsLoading(true);
    try {
      console.log('Checking endpoint health via API...');
      const token = getAuthToken();
      const response = await fetch('http://localhost:3400/api/health-check/manual', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      console.log('Health check response status:', response.status);
      if (response.ok) {
        const statuses: EndpointStatus[] = await response.json();
        console.log('Health check results:', statuses);
        const statusMap = new Map<string, EndpointStatus>();
        statuses.forEach((status) => {
          statusMap.set(status.name, status);
        });
        setEndpointStatus(statusMap);
      } else {
        console.error('Health check failed with status:', response.status);
      }
    } catch (error) {
      console.error('Failed to check endpoint health:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check on mount
  createEffect(() => {
    checkEndpointHealth();

    // Set up auto-refresh every 5 minutes (300000ms)
    const intervalId = setInterval(checkEndpointHealth, 300000);

    onCleanup(() => clearInterval(intervalId));
  });

  const getStatusForLink = (linkName: string) => {
    return endpointStatus().get(linkName);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank');
  };

  const handleLogout = () => {
    // Clear auth state directly
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('jwtToken');
    sessionStorage.removeItem('user');
    console.log('Logout: storage cleared, redirecting...');
    // Redirect immediately
    window.location.href = '/login';
  };

  let logoutButtonRef: HTMLButtonElement | undefined;

  const loginLinks = systemLinks.filter((link) => link.type === 'Login');
  const swaggerLinks = systemLinks.filter((link) => link.type === 'Swagger');

  return (
    <div class={styles.pageContainer}>
      <header class={styles.pageHeader} style={{ "display": "flex", "justify-content": "space-between", "align-items": "center" }}>
        <div>
          <h1>System Health Status</h1>
          <p>Monitor all endpoint health and API availability</p>
        </div>
        <div style={{ "display": "flex", "gap": "10px", "align-items": "center" }}>
          <span style={{ "font-size": "14px", "color": "#666" }}>
            {auth.user()?.email}
          </span>
          <form onsubmit={(e) => {
            e.preventDefault();
            window.location.href = '/system/manage-endpoints';
          }} style={{ "display": "inline" }}>
            <button
              type="submit"
              style={{
                "padding": "8px 16px",
                "background-color": "#2196F3",
                "color": "white",
                "border": "none",
                "border-radius": "4px",
                "font-size": "14px",
                "cursor": "pointer",
                "transition": "background-color 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#1976D2")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#2196F3")}
            >
              Manage Endpoints
            </button>
          </form>
          <form
            onsubmit={(e) => {
              e.preventDefault();
              handleLogout();
            }}
            style={{ "display": "inline" }}
          >
            <button
              type="submit"
              style={{
                "padding": "8px 16px",
                "background-color": "#f44336",
                "color": "white",
                "border": "none",
                "border-radius": "4px",
                "font-size": "14px",
                "cursor": "pointer",
                "transition": "background-color 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#d32f2f")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#f44336")}
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      <main class={styles.pageContent}>
        {/* Health Check Controls */}
        <section class={styles.section}>
          <div class={styles.healthCheckHeader}>
            <h2>🔍 System Status</h2>
            <button
              onClick={checkEndpointHealth}
              disabled={isLoading()}
              class={styles.refreshButton}
              title="Refresh endpoint status (auto-checks every 5 minutes)"
            >
              {isLoading() ? '⟳ Checking...' : '⟳ Refresh Status'}
            </button>
          </div>
          <p class={styles.statusNote}>
            {isLoading() ? 'Checking endpoints...' : 'Auto-checks every 5 minutes. Click Refresh to check now.'}
          </p>
        </section>

        {/* Login Screens Section */}
        <section class={styles.section}>
          <h2>🔐 Login Screens</h2>
          <div class={styles.linksTable}>
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Name</th>
                  <th>URL</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loginLinks.map((link) => {
                  const status = getStatusForLink(link.name);
                  const isOffline = status?.status === 'offline';
                  return (
                    <tr class={isOffline ? styles.offlineRow : ''} key={link.url}>
                      <td class={styles.statusCell}>
                        <Show when={status} fallback={<span class={styles.statusUnknown}>—</span>}>
                          <div class={styles.statusBadge}>
                            {status!.status === 'online' ? (
                              <span class={styles.runningBadge}>✓ Running</span>
                            ) : (
                              <span class={styles.offlineBadge}>✗ Offline</span>
                            )}
                          </div>
                        </Show>
                      </td>
                      <td>
                        <span class={styles.linkName}>{link.name}</span>
                      </td>
                      <td>
                        <code class={styles.urlCode}>{link.url}</code>
                      </td>
                      <td>
                        <span class={styles.description}>{link.description}</span>
                      </td>
                      <td class={styles.actions}>
                        <button
                          class={styles.btnOpen}
                          onclick={() => handleOpenLink(link.url)}
                          title="Open in new tab"
                        >
                          ↗️ Open
                        </button>
                        <button
                          class={`${styles.btnCopy} ${copiedUrl() === link.url ? styles.copied : ''}`}
                          onclick={() => handleCopyUrl(link.url)}
                          title="Copy URL to clipboard"
                        >
                          {copiedUrl() === link.url ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Swagger API Documentation Section */}
        <section class={styles.section}>
          <h2>📚 API Documentation (Swagger)</h2>
          <div class={styles.linksTable}>
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Name</th>
                  <th>URL</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {swaggerLinks.map((link) => {
                  const status = getStatusForLink(link.name);
                  const isOffline = status?.status === 'offline';
                  return (
                    <tr class={isOffline ? styles.offlineRow : ''} key={link.url}>
                      <td class={styles.statusCell}>
                        <Show when={status} fallback={<span class={styles.statusUnknown}>—</span>}>
                          <div class={styles.statusBadge}>
                            {status!.status === 'online' ? (
                              <span class={styles.runningBadge}>✓ Running</span>
                            ) : (
                              <span class={styles.offlineBadge}>✗ Offline</span>
                            )}
                          </div>
                        </Show>
                      </td>
                      <td>
                        <span class={styles.linkName}>{link.name}</span>
                      </td>
                      <td>
                        <code class={styles.urlCode}>{link.url}</code>
                      </td>
                      <td>
                        <span class={styles.description}>{link.description}</span>
                      </td>
                      <td class={styles.actions}>
                        <button
                          class={styles.btnOpen}
                          onclick={() => handleOpenLink(link.url)}
                          title="Open in new tab"
                        >
                          ↗️ Open
                        </button>
                        <button
                          class={`${styles.btnCopy} ${copiedUrl() === link.url ? styles.copied : ''}`}
                          onclick={() => handleCopyUrl(link.url)}
                          title="Copy URL to clipboard"
                        >
                          {copiedUrl() === link.url ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Info Section */}
        <section class={styles.infoSection}>
          <h3>ℹ️ Health Monitoring Notes</h3>
          <ul>
            <li>
              <strong>HTTPS Services:</strong> May show certificate warnings on first access.
              Click "Proceed" or "Advanced" → "Proceed anyway" in your browser.
            </li>
            <li>
              <strong>Auto-Refresh:</strong> Status checks run automatically every 5 minutes. Click
              "Refresh Status" to check manually.
            </li>
            <li>
              <strong>Endpoint Configuration:</strong> Endpoints monitored are configured in the Health Monitor
              API database. Add new endpoints via the API management interface.
            </li>
            <li>
              <strong>Services Status:</strong> All services must be running for links to be accessible. Check
              service logs if endpoints show as offline unexpectedly.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
