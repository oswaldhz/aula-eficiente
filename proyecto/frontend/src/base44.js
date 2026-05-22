// base44.js
const BASE44_KEY = "30f81ea6410d421c81acc7d6828ed18b"; // tu API Key
const BASE44_APP = "68af963251fc087c2053291d";

async function fetchEntities(entity, limit = 0, sort = "") {
  try {
    let url = `https://app.base44.com/api/apps/${BASE44_APP}/entities/${entity}`;
    if (sort || limit) url += `?${sort ? "_sort=" + sort : ""}${limit ? "&_limit=" + limit : ""}`;
    
    const res = await fetch(url, {
      headers: {
        "api_key": BASE44_KEY,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`Error fetching ${entity}:`, error);
    return [];
  }
}

export { fetchEntities };
