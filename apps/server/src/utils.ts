export const FLARESOLVERR_URL = "http://192.168.97.4:8191/v1";

interface FlareSolverrResponse {
  status: string;
  solution?: {
    response: string;
    status: number;
    url: string;
    cookies: unknown[];
  };
}

export async function queryFlareSolverr(
  url: string,
): Promise<FlareSolverrResponse> {
  const response = await fetch(FLARESOLVERR_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cmd: "request.get",
      url,
      maxTimeout: 60000,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `FlareSolverr request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<FlareSolverrResponse>;
}
