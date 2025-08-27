const BASE_URL = "http://127.0.0.1:5000";

export async function fetchData(endpoint) {
  try {
    const res = await fetch(`${BASE_URL}/${endpoint}/`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

export async function postData(endpoint, data) {
  try {
    const res = await fetch(`${BASE_URL}/${endpoint}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

export async function putData(endpoint, data) {
  try {
    const res = await fetch(`${BASE_URL}/${endpoint}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Error updating data:", error);
    return null;
  }
}

export async function deleteData(endpoint) {
  try {
    const res = await fetch(`${BASE_URL}/${endpoint}/`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Error deleting data:", error);
    return null;
  }
}

