const BASE = "/api/auth";

async function request(path, payload, method = "POST") {
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      credentials: "same-origin",
      headers: payload ? { "Content-Type": "application/json" } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
    });
  } catch {
    throw new Error("No se puede conectar con el servidor. Comprueba que la API esté iniciada.");
  }
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `No se pudo completar la solicitud (${response.status}).`);
  return data;
}

export const authApi = {
  register: (payload) => request("/register", payload),
  setupPassword: (payload) => request("/setup-password", payload),
  login: (payload) => request("/login", payload),
  forgotPassword: (payload) => request("/forgot-password", payload),
  resetPassword: (payload) => request("/reset-password", payload),
  me: () => request("/me", null, "GET"),
  logout: () => request("/logout"),
};
