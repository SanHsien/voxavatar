export function shouldResetSceneError(
  previousResetKey: string,
  nextResetKey: string,
  failed: boolean,
): boolean {
  return previousResetKey !== nextResetKey && failed;
}
