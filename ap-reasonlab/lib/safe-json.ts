/** Parse fetch Response as JSON; surface plain-text platform errors (e.g. 413). */
export async function readResponseJson<T = unknown>(
  response: Response
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  const text = await response.text();
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      ok: false,
      error: response.ok ? "Empty response from server." : `Request failed (${response.status}).`,
      status: response.status,
    };
  }
  try {
    return { ok: true, data: JSON.parse(trimmed) as T };
  } catch {
    const snippet = trimmed.slice(0, 180).replace(/\s+/g, " ");
    if (/request entity too large/i.test(trimmed) || response.status === 413) {
      return {
        ok: false,
        error:
          "Upload/save too large (Request Entity Too Large). Use a smaller file, or remove unused large files from Manage → Files, then try again.",
        status: response.status || 413,
      };
    }
    return {
      ok: false,
      error: `Server returned non-JSON (${response.status}): ${snippet}`,
      status: response.status,
    };
  }
}
