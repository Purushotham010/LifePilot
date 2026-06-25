export const getAuthToken = () => { try { return localStorage.getItem('token'); } catch (e) { return null; } };
export const setAuthToken = (token: string) => { try { localStorage.setItem('token', token); } catch (e) {} };
export const removeAuthToken = () => { try { localStorage.removeItem('token'); } catch (e) {} };

export const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  if (!response.ok) {
    if (response.status === 401) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } catch (e) {}
    }
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'API Request failed');
  }

  return response.json();
};
