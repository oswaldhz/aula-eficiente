import { useAuth } from "@clerk/clerk-react";

const BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

export function useFetch() {
  const { getToken } = useAuth()

  async function fetchData(endpoint) {
    const token = await getToken()
    try {
      const res = await fetch(`${BASE_URL}/${endpoint.toLowerCase() === 'classrooms' ? `classrooms/${localStorage.getItem('periodo')}` : endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error("Error fetching data:", error);
      return [];
    }
  }

  async function postData(endpoint, data) {
    const token = await getToken()
    try {
      const res = await fetch(`${BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error("Error posting data:", error);
      return null;
    }
  }

  // --------------------------------------------------
  // NUEVAS FUNCIONES CRUD: PUT y DELETE
  // --------------------------------------------------

  async function putData(endpoint, data) {
    const token = await getToken()
    try {
      const res = await fetch(`${BASE_URL}/${endpoint}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error("Error updating data:", error);
      return null;
    }
  }

  async function deleteData(endpoint) {
    const token = await getToken()
    try {
      const res = await fetch(`${BASE_URL}/${endpoint}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error("Error deleting data:", error);
      return null;
    }
  }

  return {
    fetchData,
    postData,
    putData,
    deleteData
  };
}
