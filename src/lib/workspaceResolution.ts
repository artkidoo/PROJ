export function resolveClientProjectWorkspaceId(
  projectWorkspaceId: string | undefined,
  primaryWorkspaceId: string | undefined
): string | undefined {
  return projectWorkspaceId || primaryWorkspaceId || undefined;
}
