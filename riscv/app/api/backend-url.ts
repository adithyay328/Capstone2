const DEFAULT_BACKEND_URL = "http://localhost:25565";

export function getBackendUrl(path: string): string {
  const baseUrl = (
    process.env.BACKEND_URL || DEFAULT_BACKEND_URL
  ).trim();
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}
