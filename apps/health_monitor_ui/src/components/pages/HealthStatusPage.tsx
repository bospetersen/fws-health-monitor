/**
 * Health Status Page
 * Displays monitoring of system endpoints and their health status
 * Integrated with Health Monitor API
 */

import { createSignal, createEffect, createMemo, For, onCleanup } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth, getAuthToken } from '../../services/authService';
import styles from './pageLayout.module.css';

interface EndpointGroup {
  _id: string;
  name: string;
  active: boolean;
  sortOrder: number;
}

interface Endpoint {
  _id: string;
  name: string;
  url: string;
  active: boolean;
  description: string;
  groupId: string;
  sortOrder: number;
  status?: 'online' | 'offline';
  checkedAt?: Date;
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
  const [hoveredEndpointId, setHoveredEndpointId] = createSignal<string | null>(null);
  const [endpointStatus, setEndpointStatus] = createSignal<Record<string, EndpointStatus>>({});
  const [isLoading, setIsLoading] = createSignal(false);
  const [groups, setGroups] = createSignal<EndpointGroup[]>([]);
  const [endpoints, setEndpoints] = createSignal<Endpoint[]>([]);

  // Fetch groups and endpoints from database
  const loadData = async () => {
    try {
      const token = getAuthToken();
      const [groupRes, endpointRes] = await Promise.all([
        fetch('http://localhost:3400/api/endpoint-groups', {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include',
        }),
        fetch('http://localhost:3400/api/endpoints', {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include',
        }),
      ]);

      if (groupRes.ok) {
        const groupData = await groupRes.json();
        setGroups(groupData);
      }

      if (endpointRes.ok) {
        const endpointData = await endpointRes.json();
        setEndpoints(endpointData);
      }
    } catch (error) {
      console.error('Failed to load endpoints:', error);
    }
  };

  const checkEndpointHealth = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch('http://localhost:3400/api/health-check/manual', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      if (response.ok) {
        const statuses: EndpointStatus[] = await response.json();
        const statusObj: Record<string, EndpointStatus> = {};
        statuses.forEach((status) => {
          statusObj[status.id] = status;
        });
        setEndpointStatus({...statusObj});
      } else {
        console.error('Health check failed with status:', response.status);
      }
    } catch (error) {
      console.error('Failed to check endpoint health:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load endpoints and start health checks
  createEffect(() => {
    loadData();
    checkEndpointHealth();

    // Set up auto-refresh every 5 minutes (300000ms)
    const intervalId = setInterval(checkEndpointHealth, 300000);

    onCleanup(() => clearInterval(intervalId));
  });

  let logoutButtonRef: HTMLButtonElement | undefined;

  const getStatusForEndpoint = (endpointId: string) => {
    return endpointStatus()[endpointId];
  };

  const getGroupEndpoints = (groupId: string) => {
    return endpoints()
      .filter((e) => e.groupId === groupId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const handleCopyUrl = (url: string) => {
    console.log('Copy button clicked:', url);
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    console.log('setCopiedUrl called with:', url);
    setTimeout(() => setCopiedUrl(null), 2000);
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

        {/* Endpoint Groups Sections */}
        <Show when={groups().length > 0} fallback={<p>No endpoint groups configured. Go to Manage Endpoints to add groups.</p>}>
          <For each={groups()}>
            {(group) => (
              <section class={styles.section}>
                <h2>{group.name}</h2>
                <div class={styles.linksTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <Show when={getGroupEndpoints(group._id).length > 0} fallback={<tr><td colSpan={4} style={{"text-align": "center", "color": "#999"}}>No endpoints in this group</td></tr>}>
                        <For each={getGroupEndpoints(group._id)}>
                          {(endpoint) => {
                            const status = createMemo(() => endpointStatus()[endpoint._id]);
                            const isOffline = () => status()?.status === 'offline';
                            return (
                              <>
                                <tr 
                                  class={`${isOffline() ? styles.offlineRow : ''} ${hoveredEndpointId() === endpoint._id ? styles.rowHovered : ''}`}
                                  key={endpoint._id}
                                  onMouseEnter={() => setHoveredEndpointId(endpoint._id)}
                                  onMouseLeave={() => setHoveredEndpointId(null)}
                                >
                                  <td class={styles.statusCell}>
                                    <div class={styles.statusBadge}>
                                      {status()?.status === 'online' ? (
                                        <span class={styles.runningBadge}>Running</span>
                                      ) : status()?.status === 'offline' ? (
                                        <span class={styles.offlineBadge}>Offline</span>
                                      ) : (
                                        <span class={styles.statusUnknown}>—</span>
                                      )}
                                    </div>
                                  </td>
                                  <td>
                                    <span class={styles.linkName}>{endpoint.name}</span>
                                  </td>
                                  <td>
                                    <span class={styles.description}>{endpoint.description}</span>
                                  </td>
                                  <td class={styles.actions}>
                                    <button
                                      class={`${styles.btnCopy} ${copiedUrl() === endpoint.url ? styles.copied : ''}`}
                                      onClick={() => handleCopyUrl(endpoint.url)}
                                      title="Copy URL to clipboard"
                                    >
                                      {copiedUrl() === endpoint.url ? '✓ Copied' : '📋 Copy'}
                                    </button>
                                  </td>
                                </tr>
                                <tr 
                                  class={`${isOffline() ? styles.offlineRow : ''} ${hoveredEndpointId() === endpoint._id ? styles.rowHovered : ''}`}
                                  onMouseEnter={() => setHoveredEndpointId(endpoint._id)}
                                  onMouseLeave={() => setHoveredEndpointId(null)}
                                >
                                  <td></td>
                                  <td colSpan={2}>
                                    <a 
                                      class={styles.urlCode}
                                      href={endpoint.url.startsWith('http') ? endpoint.url : 'http://' + endpoint.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      🔗 {endpoint.url}
                                    </a>
                                  </td>
                                  <td></td>
                                </tr>
                              </>
                            );
                          }}
                        </For>
                      </Show>
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </For>
        </Show>

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
