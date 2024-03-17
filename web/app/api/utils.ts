export const MEMORY_PREFIX = "m#";
export const JAR_PREFIX = "mj#";
export const USER_PREFIX = "u#";

export function wrapKey(
  key: string,
  entity: "memory" | "jar" | "user",
): string {
  const prefix =
    entity === "memory"
      ? MEMORY_PREFIX
      : entity === "jar"
        ? JAR_PREFIX
        : USER_PREFIX;
  return prefix + key;
}

export function unwrapKey(
  key: string,
  entity: "memory" | "jar" | "user",
): string {
  const prefix =
    entity === "memory"
      ? MEMORY_PREFIX
      : entity === "jar"
        ? JAR_PREFIX
        : USER_PREFIX;
  return key.substring(prefix.length);
}
