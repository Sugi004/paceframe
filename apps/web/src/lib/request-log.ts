type RouteOutcome = {
  route: string;
  method: string;
  status: number;
  durationMs: number;
  meta?: Record<string, string | number | boolean | null | undefined>;
};

export function logRouteOutcome({ route, method, status, durationMs, meta }: RouteOutcome) {
  const suffix = meta ? ` ${JSON.stringify(meta)}` : '';
  console.info(`[${route}] ${method} ${status} ${durationMs}ms${suffix}`);
}
