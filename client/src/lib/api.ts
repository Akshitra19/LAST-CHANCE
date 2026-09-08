const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export interface HealthResponse {
  status: 'ok';
  app: 'LAST CHANCE';
  server: 'up';
  supabase: {
    configured: boolean;
    reachable: boolean;
  };
}

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(`${apiBaseUrl}/api/health`, { signal });

  if (!response.ok) {
    throw new Error(`Health request failed with status ${response.status}.`);
  }

  return (await response.json()) as HealthResponse;
}
