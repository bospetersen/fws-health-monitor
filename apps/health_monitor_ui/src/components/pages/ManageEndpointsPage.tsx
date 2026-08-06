import { createSignal, createEffect, For, Show, onCleanup } from 'solid-js';
import { useNavigate, A } from '@solidjs/router';
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
  const [copiedUrl, setCopiedUrl] = createSignal<string | null>(null);
  const [hoveredEndpointId, setHoveredEndpointId] = createSignal<string | null>(null);
  const [draggedEndpointId, setDraggedEndpointId] = createSignal<string | null>(null);
  const [draggedGroupId, setDraggedGroupId] = createSignal<string | null>(null);
  const [dragOverEndpointId, setDragOverEndpointId] = createSignal<string | null>(null);
  const [dropPosition, setDropPosition] = createSignal<'above' | 'below' | null>(null);
  const [isReordering, setIsReordering] = createSignal(false);
  const [reorderingGroupId, setReorderingGroupId] = createSignal<string | null>(null);

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

  const handleCopyUrl = (url: string) => {
    console.log('Copy button clicked:', url);
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    console.log('setCopiedUrl called with:', url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Drag and drop handlers
  const handleDragStart = (endpoint: Endpoint, event: DragEvent) => {
    setDraggedEndpointId(endpoint._id);
    setDraggedGroupId(endpoint.groupId);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', endpoint._id);
    }
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragLeave = () => {
    setDragOverEndpointId(null);
    setDropPosition(null);
  };

  const handleDrop = async (dropTargetEndpoint: Endpoint, event: DragEvent) => {
    event.preventDefault();
    const draggedId = draggedEndpointId();
    const draggedGroupIdValue = draggedGroupId();
    setDraggedEndpointId(null);
    setDraggedGroupId(null);
    setDragOverEndpointId(null);

    if (!draggedId || draggedId === dropTargetEndpoint._id) return;

    // Find both endpoints
    const draggedEndpoint = endpoints().find((e) => e._id === draggedId);
    if (!draggedEndpoint || draggedEndpoint.groupId !== dropTargetEndpoint.groupId) return;

    setReorderingGroupId(draggedGroupIdValue);
    setIsReordering(true);

    // Reorder using existing moveEndpoint logic
    const groupEndpoints = endpoints()
      .filter((e) => e.groupId === dropTargetEndpoint.groupId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const draggedIndex = groupEndpoints.findIndex((e) => e._id === draggedId);
    const targetIndex = groupEndpoints.findIndex((e) => e._id === dropTargetEndpoint._id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setIsReordering(false);
      setReorderingGroupId(null);
      return;
    }

    // Determine insert position based on dropPosition
    const position = dropPosition();
    setDropPosition(null);
    
    // Create new order by removing dragged item and inserting at correct position
    const newGroupEndpoints = [...groupEndpoints];
    const draggedItem = newGroupEndpoints[draggedIndex];
    
    // Remove dragged item from array
    newGroupEndpoints.splice(draggedIndex, 1);
    
    // Find the target index after removal
    const newTargetIndex = newGroupEndpoints.findIndex((e) => e._id === dropTargetEndpoint._id);
    
    // Insert dragged item before or after target based on position
    const insertIndex = position === 'above' ? newTargetIndex : newTargetIndex + 1;
    newGroupEndpoints.splice(insertIndex, 0, draggedItem);

    // Update sortOrder in endpoint objects
    const updatedGroupEndpoints = newGroupEndpoints.map((e, i) => ({
      ...e,
      sortOrder: i,
    }));

    // Prepare updates for API
    const updates = updatedGroupEndpoints.map((e) => ({ id: e._id, sortOrder: e.sortOrder }));
    const otherEndpoints = endpoints().filter((e) => e.groupId !== dropTargetEndpoint.groupId);

    console.log('Sending reorder request with updates:', updates);

    try {
      const token = getAuthToken();
      console.log('Token present before reorder:', !!token);
      const response = await fetch('http://localhost:3400/api/endpoints/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      console.log('Reorder response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Reorder failed:', errorText);
        setError(`Failed to reorder: ${response.status}`);
        setIsReordering(false);
        setReorderingGroupId(null);
        return;
      }

      const result = await response.json();
      console.log('Reorder result:', result);

      setEndpoints([...otherEndpoints, ...updatedGroupEndpoints]);
      setIsReordering(false);
      setReorderingGroupId(null);
    } catch (err) {
      console.error('Reorder error:', err);
      setError(err instanceof Error ? err.message : 'Error reordering endpoints');
      setIsReordering(false);
      setReorderingGroupId(null);
    }
  };

  const clearEndpointForm = () => {
    if (nameInputRef) nameInputRef.value = '';
    if (urlInputRef) urlInputRef.value = '';
    if (descInputRef) descInputRef.value = '';
    setSelectedGroupId(null);
  };

  return (
    <div class={styles.pageContainer}>
      <header class={styles.pageHeader} style={{ "display": "grid", "grid-template-columns": "auto 1fr", "gap": "40px", "align-items": "center", "padding": "0px 0 20px 0" }}>
        {/* Left Column: Title and Subtitle */}
        <div style={{ "text-align": "left" }}>
          <h1 style={{ "margin": "0 0 8px 0", "font-size": "28px" }}>Manage Endpoints</h1>
          <p style={{ "margin": "0", "font-size": "16px", "color": "#666" }}>Organize and configure endpoints for health monitoring</p>
        </div>

        {/* Right Column: User Info and Buttons */}
        <div style={{ "display": "flex", "flex-direction": "column", "align-items": "flex-end", "gap": "12px" }}>
          <span style={{ "font-size": "18px", "color": "#333" }}>
            <strong>{auth.user()?.name}</strong> - {auth.user()?.email}
          </span>
          <div style={{ "display": "flex", "gap": "10px" }}>
            <A href="/system/health" style={{ "padding": "8px 16px", "color": "#2196F3", "text-decoration": "none", "font-size": "14px", "cursor": "pointer" }}>Back to Health Status</A>
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
        </div>
      </header>

      <div class={managementStyles.contentArea}>
        <Show when={error()}>
          <div class={managementStyles.errorBox}>
            <strong>Error:</strong> {error()}
          </div>
        </Show>

        <div style={{"display": "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "20px"}}>
          <h2 style={{"margin": "0"}}>Groups</h2>
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
        </div>

        {/* Forms - Only visible in Edit Mode */}
        <Show when={editMode()}>
          <div class={managementStyles.formSection} style={{ "display": "flex", "gap": "20px", "margin-bottom": "30px" }}>
            {/* Add Group Form */}
            <div style={{ "flex": "1" }}>
              <h2>Add New Group</h2>
              <form
                onsubmit={(e) => {
                  e.preventDefault();
                  handleAddGroup();
                }}
              >
                <div style={{ "margin-bottom": "12px" }}>
                  <label style={{ "display": "block", "margin-bottom": "6px", "font-weight": "500" }}>
                    Group Name
                  </label>
                  <input
                    ref={groupNameInputRef}
                    type="text"
                    placeholder="e.g., Login Screens"
                    style={{
                      "width": "100%",
                      "padding": "12px",
                      "font-size": "16px",
                      "border": "1px solid #ddd",
                      "border-radius": "4px",
                      "box-sizing": "border-box",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading()}
                  style={{
                    "padding": "10px 20px",
                    "background-color": "#4caf50",
                    "color": "white",
                    "border": "none",
                    "border-radius": "4px",
                    "font-size": "16px",
                    "font-weight": "500",
                    "cursor": "pointer",
                    "opacity": isLoading() ? 0.6 : 1,
                  }}
                >
                  Create Group
                </button>
              </form>
            </div>

            {/* Add Endpoint Form */}
            <div style={{ "flex": "1" }}>
              <h2>Add Endpoint</h2>
              <form
                onsubmit={(e) => {
                  e.preventDefault();
                  handleAddEndpoint();
                }}
              >
                <div style={{ "margin-bottom": "12px" }}>
                  <label style={{ "display": "block", "margin-bottom": "6px", "font-weight": "500" }}>
                    Select Group
                  </label>
                  <select
                    value={selectedGroupId() || ''}
                    onchange={(e) => setSelectedGroupId(e.target.value || null)}
                    style={{
                      "width": "100%",
                      "padding": "12px",
                      "font-size": "16px",
                      "border": "1px solid #ddd",
                      "border-radius": "4px",
                      "box-sizing": "border-box",
                    }}
                  >
                    <option value="">-- Select a group --</option>
                    <For each={groups()}>
                      {(group) => <option value={group._id}>{group.name}</option>}
                    </For>
                  </select>
                </div>

                <div style={{ "margin-bottom": "12px" }}>
                  <label style={{ "display": "block", "margin-bottom": "6px", "font-weight": "500" }}>
                    Endpoint Name
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    placeholder="e.g., Admin Portal"
                    style={{
                      "width": "100%",
                      "padding": "12px",
                      "font-size": "16px",
                      "border": "1px solid #ddd",
                      "border-radius": "4px",
                      "box-sizing": "border-box",
                    }}
                  />
                </div>

                <div style={{ "margin-bottom": "12px" }}>
                  <label style={{ "display": "block", "margin-bottom": "6px", "font-weight": "500" }}>
                    URL
                  </label>
                  <input
                    ref={urlInputRef}
                    type="text"
                    placeholder="e.g., https://admin.example.com"
                    style={{
                      "width": "100%",
                      "padding": "12px",
                      "font-size": "16px",
                      "border": "1px solid #ddd",
                      "border-radius": "4px",
                      "box-sizing": "border-box",
                    }}
                  />
                </div>

                <div style={{ "margin-bottom": "12px" }}>
                  <label style={{ "display": "block", "margin-bottom": "6px", "font-weight": "500" }}>
                    Description (Optional)
                  </label>
                  <input
                    ref={descInputRef}
                    type="text"
                    placeholder="Brief description"
                    style={{
                      "width": "100%",
                      "padding": "12px",
                      "font-size": "16px",
                      "border": "1px solid #ddd",
                      "border-radius": "4px",
                      "box-sizing": "border-box",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading() || checkingHealth()}
                  style={{
                    "padding": "10px 20px",
                    "background-color": "#2196F3",
                    "color": "white",
                    "border": "none",
                    "border-radius": "4px",
                    "font-size": "16px",
                    "font-weight": "500",
                    "cursor": "pointer",
                    "opacity": isLoading() || checkingHealth() ? 0.6 : 1,
                  }}
                >
                  {checkingHealth() ? 'Adding...' : 'Add Endpoint'}
                </button>
              </form>
            </div>
          </div>
        </Show>

        {/* Groups/Endpoints List - Only visible when NOT in Edit Mode */}
        <Show when={!editMode()}>
          <div class={managementStyles.groupsContainer}>
          <Show when={groups().length > 0} fallback={<p>No groups yet. Create one to get started!</p>}>
            <For each={groups()}>
              {(group, groupIndex) => {
                const groupEndpoints = () => endpoints().filter((e) => e.groupId === group._id).sort((a, b) => a.sortOrder - b.sortOrder);

                return (
                  <section class={managementStyles.section}>
                    <div style={{ "display": "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "20px" }}>
                      <h2>{group.name}</h2>
                      <div style={{ "display": "flex", "gap": "8px" }}>
                        <Show when={groupIndex() > 0}>
                          <button
                            onClick={() => moveGroup(group._id, 'up')}
                            style={{
                              "padding": "10px 15px",
                              "background-color": "#2196F3",
                              "color": "white",
                              "border": "none",
                              "border-radius": "4px",
                              "font-size": "16px",
                              "cursor": "pointer",
                            }}
                          >
                            ↑ Move Up
                          </button>
                        </Show>
                        <Show when={groupIndex() < groups().length - 1}>
                          <button
                            onClick={() => moveGroup(group._id, 'down')}
                            style={{
                              "padding": "10px 15px",
                              "background-color": "#2196F3",
                              "color": "white",
                              "border": "none",
                              "border-radius": "4px",
                              "font-size": "16px",
                              "cursor": "pointer",
                            }}
                          >
                            ↓ Move Down
                          </button>
                        </Show>
                        <button
                          onClick={() => handleToggleGroup(group._id)}
                          style={{
                            "padding": "10px 15px",
                            "background-color": group.active ? "#4CAF50" : "#ff9800",
                            "color": "white",
                            "border": "none",
                            "border-radius": "4px",
                            "font-size": "16px",
                            "cursor": "pointer",
                          }}
                        >
                          {group.active ? '✓ Active' : '✗ Inactive'}
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group._id)}
                          style={{
                            "padding": "10px 15px",
                            "background-color": "#f44336",
                            "color": "white",
                            "border": "none",
                            "border-radius": "4px",
                            "font-size": "16px",
                            "cursor": "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <Show when={groupEndpoints().length > 0} fallback={<p style={{ "color": "#999", "font-size": "14px" }}>No endpoints in this group</p>}>
                      <div class={managementStyles.linksTable} style={{ "position": "relative" }}>
                        <Show when={isReordering() && reorderingGroupId() === group._id}>
                          <div class={managementStyles.loadingOverlay}>
                            <div class={managementStyles.spinnerContainer}>
                              <div class={managementStyles.spinner}></div>
                              <p class={managementStyles.spinnerText}>Sorting...</p>
                            </div>
                          </div>
                        </Show>
                        <table>
                          <thead>
                            <tr>
                              <th style={{"width": "300px", "padding-left": "10px"}}>Name</th>
                              <th>Description</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            <For each={groupEndpoints()}>
                              {(endpoint, epIndex) => (
                                <>
                                  <tr 
                                    draggable="true"
                                    onDragStart={(e) => handleDragStart(endpoint, e)}
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      if (draggedGroupId() === endpoint.groupId) {
                                        if (e.dataTransfer) {
                                          e.dataTransfer.dropEffect = 'move';
                                        }
                                        setDragOverEndpointId(endpoint._id);
                                        setDropPosition('above');
                                      } else {
                                        if (e.dataTransfer) {
                                          e.dataTransfer.dropEffect = 'none';
                                        }
                                      }
                                    }}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(endpoint, e)}
                                    class={`${hoveredEndpointId() === endpoint._id ? managementStyles.rowHovered : ''} ${draggedEndpointId() === endpoint._id ? managementStyles.rowDragging : ''} ${dragOverEndpointId() === endpoint._id ? managementStyles.rowDragOver : ''} ${dragOverEndpointId() === endpoint._id && dropPosition() === 'above' ? managementStyles.dropAbove : ''} ${draggedEndpointId() && draggedGroupId() !== endpoint.groupId && dragOverEndpointId() === endpoint._id ? managementStyles.dropInvalid : ''}`}
                                    style={{
                                      "opacity": draggedEndpointId() === endpoint._id ? "0.5" : "1",
                                      "background-color": dragOverEndpointId() === endpoint._id ? "#e3f2fd" : "transparent",
                                      "transition": "all 0.2s ease",
                                    }}
                                    onMouseEnter={() => setHoveredEndpointId(endpoint._id)}
                                    onMouseLeave={() => setHoveredEndpointId(null)}
                                  >
                                    <td style={{"padding-left": "10px"}}>
                                      <span class={managementStyles.linkName}>{endpoint.name}</span>
                                    </td>
                                    <td>
                                      <span class={managementStyles.description}>{endpoint.description}</span>
                                    </td>
                                    <td class={managementStyles.actions}>
                                      <button
                                        class={`${managementStyles.btnCopy} ${
                                          copiedUrl() === endpoint.url ? managementStyles.copied : ''
                                        }`}
                                        onClick={() => handleCopyUrl(endpoint.url)}
                                        title="Copy URL to clipboard"
                                      >
                                        {copiedUrl() === endpoint.url ? '✓ Copied' : '📋 Copy'}
                                      </button>
                                      <button
                                        disabled={epIndex() === 0}
                                        onClick={() => moveEndpoint(endpoint._id, group._id, 'up')}
                                        style={{
                                          "padding": "5px 15px",
                                          "background-color": epIndex() === 0 ? "#cccccc" : "#2196F3",
                                          "color": "white",
                                          "border": "none",
                                          "border-radius": "4px",
                                          "font-size": "16px",
                                          "font-weight": "bold",
                                          "cursor": epIndex() === 0 ? "not-allowed" : "pointer",
                                          "opacity": epIndex() === 0 ? "0.6" : "1",
                                          "line-height": "1",
                                        }}
                                      >
                                        ⬆
                                      </button>
                                      <button
                                        disabled={epIndex() === groupEndpoints().length - 1}
                                        onClick={() => moveEndpoint(endpoint._id, group._id, 'down')}
                                        style={{
                                          "padding": "5px 15px",
                                          "background-color": epIndex() === groupEndpoints().length - 1 ? "#cccccc" : "#2196F3",
                                          "color": "white",
                                          "border": "none",
                                          "border-radius": "4px",
                                          "font-size": "16px",
                                          "font-weight": "bold",
                                          "cursor": epIndex() === groupEndpoints().length - 1 ? "not-allowed" : "pointer",
                                          "opacity": epIndex() === groupEndpoints().length - 1 ? "0.6" : "1",
                                          "line-height": "1",
                                        }}
                                      >
                                        ⬇
                                      </button>
                                      <button
                                        class={managementStyles.btnDelete}
                                        onClick={() => handleDeleteEndpoint(endpoint._id)}
                                      >
                                        Delete
                                      </button>
                                    </td>
                                  </tr>
                                  <tr 
                                    draggable="true"
                                    onDragStart={(e) => handleDragStart(endpoint, e)}
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      if (draggedGroupId() === endpoint.groupId) {
                                        if (e.dataTransfer) {
                                          e.dataTransfer.dropEffect = 'move';
                                        }
                                        setDragOverEndpointId(endpoint._id);
                                        setDropPosition('below');
                                      } else {
                                        if (e.dataTransfer) {
                                          e.dataTransfer.dropEffect = 'none';
                                        }
                                      }
                                    }}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(endpoint, e)}
                                    class={`${dragOverEndpointId() === endpoint._id && dropPosition() === 'below' ? managementStyles.dropBelow : ''} ${draggedEndpointId() && draggedGroupId() !== endpoint.groupId && dragOverEndpointId() === endpoint._id ? managementStyles.dropInvalid : ''}`}
                                    style={{
                                      "border-bottom": "1px solid #e8e8e8",
                                      "user-select": "none",
                                      "opacity": draggedEndpointId() === endpoint._id ? "0.5" : "1",
                                      "background-color": dragOverEndpointId() === endpoint._id ? "#e3f2fd" : "transparent",
                                      "transition": "all 0.2s ease",
                                    }}
                                    onMouseEnter={() => setHoveredEndpointId(endpoint._id)}
                                    onMouseLeave={() => setHoveredEndpointId(null)}
                                  >
                                    <td></td>
                                    <td>
                                      <a 
                                        class={managementStyles.urlCode}
                                        style={{"float": "left", "user-select": "none"}}
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
                              )}
                            </For>
                          </tbody>
                        </table>
                      </div>
                    </Show>
                  </section>
                );
              }}
            </For>
          </Show>
        </div>
        </Show>
      </div>
    </div>
  );
}
