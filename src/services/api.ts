export const API_URL = "";

async function request(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  let userId = "";
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.id;
    } catch (e) {}
  }

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(userId ? { "user-id": userId } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}/api${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Something went wrong");
  }
  return response.json();
}

export const api = {
  get: (endpoint: string) => request(endpoint, { method: "GET" }),
  post: (endpoint: string, data: any) => request(endpoint, { method: "POST", body: JSON.stringify(data) }),
  put: (endpoint: string, data: any) => request(endpoint, { method: "PUT", body: JSON.stringify(data) }),
  patch: (endpoint: string, data: any) => request(endpoint, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (endpoint: string) => request(endpoint, { method: "DELETE" }),
};
