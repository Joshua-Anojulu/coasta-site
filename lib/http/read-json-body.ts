export type JsonBodyResult =
  | { readonly ok: true; readonly value: unknown }
  | { readonly ok: false; readonly error: "body_too_large" | "invalid_body" }

export async function readJsonBody(
  request: Request,
  maximumBytes: number,
): Promise<JsonBodyResult> {
  const contentLength = request.headers.get("content-length")
  if (contentLength !== null) {
    const declaredBytes = Number(contentLength)
    if (!Number.isFinite(declaredBytes) || declaredBytes < 0) {
      return { error: "invalid_body", ok: false }
    }
    if (declaredBytes > maximumBytes) {
      return { error: "body_too_large", ok: false }
    }
  }

  if (request.body === null) {
    return { error: "invalid_body", ok: false }
  }

  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  let byteCount = 0
  let text = ""

  while (true) {
    const chunk = await reader.read()
    if (chunk.done) {
      text += decoder.decode()
      break
    }

    byteCount += chunk.value.byteLength
    if (byteCount > maximumBytes) {
      await reader.cancel()
      return { error: "body_too_large", ok: false }
    }
    text += decoder.decode(chunk.value, { stream: true })
  }

  try {
    const value: unknown = JSON.parse(text)
    return { ok: true, value }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { error: "invalid_body", ok: false }
    }
    throw error
  }
}
