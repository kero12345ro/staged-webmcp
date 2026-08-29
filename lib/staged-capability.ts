export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends ReadonlyArray<infer Item>
    ? ReadonlyArray<DeepReadonly<Item>>
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T;

export type CompiledCapability<TPayload> = Readonly<{
  subjectId: string;
  baseVersion: number;
  baseHash: string;
  approvedAt: number;
  expiresAt: number;
  digest: string;
  payload: DeepReadonly<TPayload>;
}>;

type CompileCapabilityOptions<TPayload> = {
  subjectId: string;
  baseVersion: number;
  baseHash: string;
  payload: TPayload;
  ttlMs?: number;
  now?: () => number;
};

function canonicalize(value: unknown): string {
  if (value === null) return "null";

  if (
    typeof value === "string" ||
    typeof value === "boolean" ||
    typeof value === "number"
  ) {
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new TypeError("Capability payload numbers must be finite.");
    }
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return "[" + value.map((item) => canonicalize(item)).join(",") + "]";
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      "{" +
      Object.keys(record)
        .filter((key) => record[key] !== undefined)
        .sort()
        .map((key) => JSON.stringify(key) + ":" + canonicalize(record[key]))
        .join(",") +
      "}"
    );
  }

  throw new TypeError(
    "Capability snapshots support only JSON-compatible payloads.",
  );
}

function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((child) => {
      deepFreeze(child);
    });
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
}

export async function sha256Json(value: unknown) {
  const canonical = canonicalize(value);
  const bytes = new TextEncoder().encode(canonical);

  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto SHA-256 is required to compile a capability.");
  }

  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function compileCapability<TPayload>({
  subjectId,
  baseVersion,
  baseHash,
  payload,
  ttlMs = 60_000,
  now = Date.now,
}: CompileCapabilityOptions<TPayload>): Promise<
  CompiledCapability<TPayload>
> {
  if (!subjectId) throw new TypeError("subjectId is required.");
  if (!Number.isInteger(baseVersion) || baseVersion < 0) {
    throw new TypeError("baseVersion must be a non-negative integer.");
  }
  if (!/^[a-f0-9]{64}$/.test(baseHash)) {
    throw new TypeError("baseHash must be a 64-character SHA-256 hex digest.");
  }
  if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
    throw new TypeError("ttlMs must be positive.");
  }

  const approvedAt = now();
  const expiresAt = approvedAt + ttlMs;
  const clonedPayload = structuredClone(payload);
  const envelope = {
    version: 1,
    subjectId,
    baseVersion,
    baseHash,
    approvedAt,
    expiresAt,
    payload: clonedPayload,
  };
  const digest = await sha256Json(envelope);

  return Object.freeze({
    subjectId,
    baseVersion,
    baseHash,
    approvedAt,
    expiresAt,
    digest,
    payload: deepFreeze(clonedPayload),
  });
}
