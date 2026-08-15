/**
 * Minimal client for a local Ollama instance (https://ollama.com).
 *
 * No API key: Ollama's local server has no authentication, so — per
 * direction — this calls it directly from the browser rather than adding a
 * backend proxy. That's a reasonable trade for a local demo (there's no
 * secret to leak), but it does mean this only works when Ollama is running
 * on the same machine as the browser. Documented as a known limitation in
 * DOCUMENTATION.md.
 *
 * Requires:
 *   1. Ollama installed and running (`ollama serve`, or the desktop app).
 *   2. A model pulled locally, e.g. `ollama pull llama3.2`.
 *   3. CORS allowing this dev server's origin. Ollama allows localhost by
 *      default in recent versions; if requests are blocked, run Ollama with
 *      `OLLAMA_ORIGINS=http://localhost:5173 ollama serve`.
 */

const OLLAMA_URL = "http://localhost:11434/api/generate";

export interface OllamaError {
  kind: "unreachable" | "model_not_found" | "unknown";
  message: string;
}

export async function generateWithOllama(
  model: string,
  prompt: string
): Promise<{ text: string } | { error: OllamaError }> {
  try {
    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const notFound = res.status === 404 || /model.*not found/i.test(body);
      return {
        error: {
          kind: notFound ? "model_not_found" : "unknown",
          message: notFound
            ? `Model "${model}" isn't pulled locally. Run: ollama pull ${model}`
            : `Ollama returned an error (${res.status}): ${body || res.statusText}`,
        },
      };
    }

    const data = (await res.json()) as { response?: string };
    return { text: (data.response ?? "").trim() };
  } catch (err) {
    return {
      error: {
        kind: "unreachable",
        message:
          "Couldn't reach Ollama at localhost:11434. Make sure it's running (`ollama serve`) and, if this is blocked by CORS, restart it with OLLAMA_ORIGINS set to this app's origin.",
      },
    };
  }
}
