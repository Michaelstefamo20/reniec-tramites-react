export function parseCookies(req, _res, next) {
  req.cookies = Object.fromEntries((req.headers.cookie || "").split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const index = part.indexOf("=");
    return [decodeURIComponent(part.slice(0, index)), decodeURIComponent(part.slice(index + 1))];
  }));
  next();
}

export function noStore(_req, res, next) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  next();
}

export function requireDatabase() {
  return (req, res, next) => {
    const { databaseReady, databaseConfigured } = req.app.locals;
    if (!databaseReady) {
      return res.status(503).json({ error: databaseConfigured
        ? "No se puede conectar a PostgreSQL. Revisa DATABASE_URL y que el servidor de base de datos esté iniciado."
        : "Falta configurar DATABASE_URL en el archivo .env para habilitar el registro." });
    }
    next();
  };
}
