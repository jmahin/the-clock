import type { Estimate, EstimateRequest, Options } from "./types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

export const getOptions = (): Promise<Options> => fetch("/api/options").then(json<Options>);

export const postEstimate = (req: EstimateRequest, signal?: AbortSignal): Promise<Estimate> =>
  fetch("/api/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  }).then(json<Estimate>);
