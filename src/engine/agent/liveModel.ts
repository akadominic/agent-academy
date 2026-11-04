import type { ModelClient, ModelRequest, ModelResponse } from "./types";

/**
 * A ModelClient that calls OUR server (/api/model), which calls the real
 * provider. The browser never sees an API key.
 */
export function createLiveModel(provider: "anthropic" | "openai", accessCode?: string): ModelClient {
  return {
    label: `Live model (${provider}, via your server)`,
    kind: "live",
    async complete(request: ModelRequest): Promise<ModelResponse> {
      const res = await fetch("/api/model", {
        method: "POST",
        headers: { "content-type": "application/json", ...(accessCode ? { "x-access-code": accessCode } : {}) },
        body: JSON.stringify({ provider, request }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Server returned ${res.status}`);
      return data as ModelResponse;
    },
  };
}
