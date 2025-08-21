export function resolve(path: string, base: string) {
  return new URL(path, base).href;
}