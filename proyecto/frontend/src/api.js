const BASE_URL = import.meta.env.VITE_API_URL || "/api";

export { BASE_URL };

export function useFetch() {
  const headers = async () => {
    let token = null;
    try {
      if (window.Clerk?.session) {
        token = await window.Clerk.session.getToken();
      }
    } catch {}
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const doFetch = async (url, options = {}) => {
    try {
      const res = await fetch(url, { ...options, headers: { ...await headers(), ...options.headers } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error("API error:", error);
      return options.method === "GET" ? [] : null;
    }
  };

  const fetchData = (endpoint) => doFetch(`${BASE_URL}/${endpoint}`, { method: "GET" });
  const postData = (endpoint, data) => doFetch(`${BASE_URL}/${endpoint}`, { method: "POST", body: JSON.stringify(data) });
  const putData = (endpoint, data) => doFetch(`${BASE_URL}/${endpoint}`, { method: "PUT", body: JSON.stringify(data) });
  const deleteData = (endpoint) => doFetch(`${BASE_URL}/${endpoint}`, { method: "DELETE" });

  return { fetchData, postData, putData, deleteData };
}

export async function fetchWithToken(endpoint, token, options = {}) {
  const h = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };
  return fetch(`${BASE_URL}/${endpoint}`, { ...options, headers: h });
}
