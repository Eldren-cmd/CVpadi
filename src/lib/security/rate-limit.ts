const edgeRateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function consumeRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const existing = edgeRateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    const nextEntry = {
      count: 1,
      resetAt: now + windowMs,
    };

    edgeRateLimitStore.set(key, nextEntry);

    return {
      allowed: true,
      remaining: Math.max(0, limit - nextEntry.count),
      resetAt: nextEntry.resetAt,
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  edgeRateLimitStore.set(key, existing);

  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

export function getClientIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    headers.get("x-real-ip")
    || headers.get("cf-connecting-ip")
    || headers.get("fly-client-ip")
    || "unknown"
  );
}
