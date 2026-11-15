export async function askClaude(message, history, region) {
  let response;
  try {
    response = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ message, history, region }),
    });
  } catch {
    throw new Error("No se pudo conectar con Claude. Prueba de nuevo o usa las preguntas rápidas.");
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Claude no está disponible. Prueba de nuevo.");
  return result.answer;
}
