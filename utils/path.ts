export function resolve(path: string) {
  return new URL(path, location.href).href;
}