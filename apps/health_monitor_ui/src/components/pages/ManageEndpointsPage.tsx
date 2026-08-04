import { createSignal, createEffect, For, Show, onCleanup } from 'solid-js';
import { useAuth, getAuthToken } from '../../services/authService';
import styles from './pageLayout.module.css';
import managementStyles from './management.module.css';

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

export default function ManageEndpointsPage() {
  const auth = useAuth();

  let nameInputRef: HTMLInputElement | undefined;
  let urlInputRef: HTMLInputElement | undefined;
  let descInputRef: HTMLInputElement | undefined;

  const [groups, setGroups] = createSignal<EndpointGroup[]>([]);
  const [endpoints, setEndpoints] = createSignal<Endpoint[]>([]);
  const [editMode, setEditMode] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // New group form
  const [newGroupName, setNewGroupName] = createSignal('');

  // Uncontrolled input ref
  let groupNameInputRef: HTMLInputElement | undefined;

  // New endpoint form
  const [selectedGroupId, setSelectedGroupId] = createSignal<string | null>(null);
  const [newEndpointName, setNewEndpointName] = createSignal('');
  const [newEndpointUrl, setNewEndpointUrl] = createSignal('');
  const [newEndpointDesc, setNewEndpointDesc] = createSignal('');
  const [endpointFormVisible, setEndpointFormVisible] = createSignal(false);
  const [checkingHealth, setCheckingHealth] = createSignal(false);

  // Fetch groups and endpoints
  const loadData = async () => {
    setIsLoading(true);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  createEffect(() => {
    loadData();
  });

  // Add group
  const handleAddGroup = async () => {
    const name = groupNameInputRef?.value || '';
    if (!name.trim()) {
      setError('Group name cannot be empty');
      return;
    }

    try {
      const token = getAuthToken();
      const response = await fetch('http://localhost:3400/api/endpoint-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const newGroup = await response.json();
        setGroups([...groups(), newGroup]);
        if (groupNameInputRef) groupNameInputRef.value = '';
        setError(null);
      } else {
        setError('Failed to create group');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating group');
    }
  };

  // Add endpoint
  const handleAddEndpoint = async () => {
    if (!selectedGroupId()) {
      setError('Please select a group');
      return;
    }
    const name = nameInputRef?.value?.trim() || '';
    const url = urlInputRef?.value?.trim() || '';
    const description = descInputRef?.value?.trim() || '';
    
    if (!name || !url) {
      setError('Name and URL are required');
      return;
    }

    try {
      setCheckingHealth(true);
      const token = getAuthToken();
      const response = await fetch('http://localhost:3400/api/endpoints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name,
          url,
          description,
          groupId: selectedGroupId(),
          active: true,
        }),
      });

      if (response.ok) {
        const newEndpoint = await response.json();
        setEndpoints([...endpoints(), newEndpoint]);
        if (nameInputRef) nameInputRef.value = '';
        if (urlInputRef) urlInputRef.value = '';
        if (descInputRef) descInputRef.value = '';
        setSelectedGroupId(null);
        setEndpointFormVisible(false);
        setError(null);
      } else {
        setError('Failed to create endpoint');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating endpoint');
    } finally {
      setCheckingHealth(false);
    }
  };

  // Toggle group active
  const handleToggleGroup = async (groupId: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:3400/api/endpoint-groups/${groupId}/toggle-active`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });

      if (response.ok) {
        const updated = await response.json();
        setGroups(groups().map((g) => (g._id === groupId ? updated : g)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error toggling group');
    }
  };

  // Delete group
  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm('Delete this group and all its endpoints?')) return;

    try {
      const token = getAuthToken();
      await fetch(`http://localhost:3400/api/endpoint-groups/${groupId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });

      setGroups(groups().filter((g) => g._id !== groupId));
      setEndpoints(endpoints().filter((e) => e.groupId !== groupId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting group');
    }
  };

  // Delete endpoint
  const handleDeleteEndpoint = async (endpointId: string) => {
    if (!window.confirm('Delete this endpoint?')) return;

    try {
      const token = getAuthToken();
      await fetch(`http://localhost:3400/api/endpoints/${endpointId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });

      setEndpoints(endpoints().filter((e) => e._id !== endpointId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting endpoint');
    }
  };

  // Reorder groups (up/down)
  const moveGroup = async (groupId: string, direction: 'up' | 'down') => {
    const index = groups().findIndex((g) => g._id === groupId);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === groups().length - 1)) return;

    const newGroups = [...groups()];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newGroups[index], newGroups[targetIndex]] = [newGroups[targetIndex], newGroups[index]];

    // Update sortOrder
    const updates = newGroups.map((g, i) => ({ id: g._id, sortOrder: i }));

    try {
      const token = getAuthToken();
      await fetch('http://localhost:3400/api/endpoint-groups/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      setGroups(newGroups);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error reordering groups');
    }
  };

  // Reorder endpoints within group
  const moveEndpoint = async (endpointId: string, groupId: string, direction: 'up' | 'down') => {
    const groupEndpoints = endpoints().filter((e) => e.groupId === groupId);
    const index = groupEndpoints.findIndex((e) => e._id === endpointId);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === groupEndpoints.length - 1)) return;

    const newGroupEndpoints = [...groupEndpoints];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newGroupEndpoints[index], newGroupEndpoints[targetIndex]] = [newGroupEndpoints[targetIndex], newGroupEndpoints[index]];

    // Update all endpoints
    const updates = newGroupEndpoints.map((e, i) => ({ id: e._id, sortOrder: i }));
    const otherEndpoints = endpoints().filter((e) => e.groupId !== groupId);

    try {
      const token = getAuthToken();
      await fetch('http://localhost:3400/api/endpoints/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      setEndpoints([...otherEndpoints, ...newGroupEndpoints]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error reordering endpoints');
    }
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
          <h1>Manage Endpoints</h1>
          <p>Organize and configure endpoints for health monitoring</p>
        </div>
        <div style={{ "display": "flex", "gap": "10px", "align-items": "center" }}>
          <form
            onsubmit={(e) => {
              e.preventDefault();
              setEditMode(!editMode());
            }}
            style={{ display: 'inline' }}
          >
            <button
              type="submit"
              style={{
                "padding": "8px 16px",
                "background-color": editMode() ? "#ff9800" : "#2196F3",
                "color": "white",
                "border": "none",
                "border-radius": "4px",
                "font-size": "14px",
                "cursor": "pointer",
              }}
            >
              {editMode() ? 'Exit Edit Mode' : 'Edit Mode'}
            </button>
          </form>
          <form
            onsubmit={(e) => {
              e.preventDefault();
              handleLogout();
            }}
            style={{ display: 'inline' }}
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
              }}
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      <div class={managementStyles.contentArea}>
        <Show when={error()}>
          <div class={managementStyles.errorBox}>
            <strong>Error:</strong> {error()}
            <button onclick={() => setError(null)}>Dismiss</button>
          </div>
        </Show>

        <div style={{ "display": editMode() ? "block" : "none" }}>
          <div class={managementStyles.formSection}>
            <h2>Add New Group</h2>
            <div style={{ "margin-top": "8px", "display": "flex", "gap": "6px" }}>
              <form
                onsubmit={(e) => {
                  e.preventDefault();
                  const name = groupNameInputRef?.value || '';
                  if (name.trim()) {
                    handleAddGroup();
                  }
                }}
                style={{ display: 'inline', "width": "100%", "display": "flex", "gap": "6px" }}
              >
                <input
                  type="text"
                  ref={groupNameInputRef}
                  placeholder="Group name (e.g., Login Screens, API Documentation)"
                  style={{ "padding": "6px", "border": "1px solid #ddd", "border-radius": "4px", "flex": "1" }}
                />
                <button
                  type="submit"
                  style={{
                    "padding": "6px 12px",
                    "background-color": "#4CAF50",
                    "color": "white",
                    "border": "none",
                    "border-radius": "4px",
                    "cursor": "pointer",
                    "font-size": "13px",
                  }}
                >
                  Create Group
                </button>
              </form>
              <form
                onsubmit={(e) => {
                  e.preventDefault();
                  if (groupNameInputRef) groupNameInputRef.value = '';
                }}
                style={{ display: 'inline' }}
              >
                <button
                  type="submit"
                  style={{
                    "padding": "6px 12px",
                    "background-color": "#999",
                    "color": "white",
                    "border": "none",
                    "border-radius": "4px",
                    "cursor": "pointer",
                    "font-size": "13px",
                  }}
                >
                  Clear
                </button>
              </form>
            </div>
          </div>

          <div class={managementStyles.formSection}>
            <h2>Add Endpoints</h2>
            <div style={{ "margin-top": "8px" }}>
              <Show when={groups().length === 0}>
                <div style={{ "color": "#d32f2f", "background-color": "#ffebee", "padding": "8px", "border-radius": "4px", "margin-bottom": "12px", "font-size": "14px" }}>
                  Please create a group first before adding endpoints
                </div>
              </Show>
              <select
                value={selectedGroupId() || ''}
                onchange={(e) => setSelectedGroupId(e.currentTarget.value || null)}
                disabled={groups().length === 0}
                style={{ "padding": "6px", "border": "1px solid #ddd", "border-radius": "4px", "width": "100%", "margin-bottom": "6px", "cursor": groups().length === 0 ? "not-allowed" : "pointer" }}
              >
                <option value="">-- Select a group --</option>
                <For each={groups()}>
                  {(group) => <option value={group._id}>{group.name}</option>}
                </For>
              </select>
              <input
                type="text"
                placeholder="Endpoint name"
                ref={nameInputRef}
                style={{ "padding": "6px", "border": "1px solid #ddd", "border-radius": "4px", "width": "100%", "margin-bottom": "6px" }}
              />
              <input
                type="url"
                placeholder="URL (https://...)"
                ref={urlInputRef}
                style={{ "padding": "6px", "border": "1px solid #ddd", "border-radius": "4px", "width": "100%", "margin-bottom": "6px" }}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                ref={descInputRef}
                style={{ "padding": "6px", "border": "1px solid #ddd", "border-radius": "4px", "width": "100%", "margin-bottom": "8px" }}
              />
              <div style={{ "display": "flex", "gap": "6px" }}>
                <form
                  onsubmit={(e) => {
                    e.preventDefault();
                    handleAddEndpoint();
                  }}
                  style={{ display: 'inline' }}
                >
                  <button
                    type="submit"
                    disabled={!selectedGroupId() || !nameInputRef?.value?.trim() || !urlInputRef?.value?.trim() || checkingHealth()}
                    style={{
                      "padding": "6px 12px",
                      "background-color": "#4CAF50",
                      "color": "white",
                      "border": "none",
                      "border-radius": "4px",
                      "cursor": "pointer",
                      "font-size": "13px",
                    }}
                  >
                    {checkingHealth() ? 'Checking...' : 'Add Endpoint'}
                  </button>
                </form>
                <form
                  onsubmit={(e) => {
                    e.preventDefault();
                    clearEndpointForm();
                  }}
                  style={{ display: 'inline' }}
                >
                  <button
                    type="submit"
                    style={{
                      "padding": "6px 12px",
                      "background-color": "#999",
                      "color": "white",
                      "border": "none",
                      "border-radius": "4px",
                      "cursor": "pointer",
                      "font-size": "13px",
                    }}
                  >
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div class={managementStyles.groupsContainer}>
          <Show when={groups().length > 0} fallback={<p>No groups yet. Create one to get started!</p>}>
            <For each={groups()}>
              {(group, index) => {
                const groupEndpoints = () => endpoints().filter((e) => e.groupId === group._id).sort((a, b) => a.sortOrder - b.sortOrder);

                return (
                  <div class={managementStyles.groupCard}>
                    <div class={managementStyles.endpointsSubList}>
                      <Show when={groupEndpoints().length > 0} fallback={<p style={{ "color": "#999", "font-size": "14px" }}>No endpoints</p>}>
                        <For each={groupEndpoints()}>
                          {(endpoint, epIndex) => (
                            <div class={managementStyles.endpointItem}>
                              <div style={{ "flex": "1" }}>
                                <strong>{endpoint.name}</strong>
                                <div style={{ "font-size": "12px", "color": "#666" }}>{endpoint.url}</div>
                                <Show when={endpoint.description}>
                                  <div style={{ "font-size": "12px", "color": "#999" }}>{endpoint.description}</div>
                                </Show>
                              </div>

                              <Show when={editMode()}>
                                <div style={{ "display": "flex", "gap": "4px" }}>
                                  <Show when={epIndex() > 0}>
                                    <button
                                      onclick={() => moveEndpoint(endpoint._id, group._id, 'up')}
                                      style={{
                                        "padding": "4px 8px",
                                        "background-color": "#2196F3",
                                        "color": "white",
                                        "border": "none",
                                        "border-radius": "4px",
                                        "font-size": "12px",
                                        "cursor": "pointer",
                                      }}
                                    >
                                      ↑
                                    </button>
                                  </Show>
                                  <Show when={epIndex() < groupEndpoints().length - 1}>
                                    <button
                                      onclick={() => moveEndpoint(endpoint._id, group._id, 'down')}
                                      style={{
                                        "padding": "4px 8px",
                                        "background-color": "#2196F3",
                                        "color": "white",
                                        "border": "none",
                                        "border-radius": "4px",
                                        "font-size": "12px",
                                        "cursor": "pointer",
                                      }}
                                    >
                                      ↓
                                    </button>
                                  </Show>
                                  <button
                                    onclick={() => handleDeleteEndpoint(endpoint._id)}
                                    style={{
                                      "padding": "4px 8px",
                                      "background-color": "#f44336",
                                      "color": "white",
                                      "border": "none",
                                      "border-radius": "4px",
                                      "font-size": "12px",
                                      "cursor": "pointer",
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </Show>
                            </div>
                          )}
                        </For>
                      </Show>
                    </div>
                  </div>
                );
              }}
            </For>
          </Show>
        </div>
      </div>
    </div>
  );
}
