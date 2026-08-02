import { ToolPermissionError } from "./types.js";

export class ToolPermissionManager {
  private grantedPermissions: Set<string>;

  constructor(granted: string[] = ["*"]) {
    this.grantedPermissions = new Set(granted);
  }

  grant(permission: string): void {
    this.grantedPermissions.add(permission);
  }

  revoke(permission: string): void {
    this.grantedPermissions.delete(permission);
  }

  hasPermission(permission: string): boolean {
    if (this.grantedPermissions.has("*")) return true;
    if (this.grantedPermissions.has(permission)) return true;

    // Support wildcard matching e.g. "network:*" matching "network:read"
    for (const granted of this.grantedPermissions) {
      if (granted.endsWith(":*")) {
        const prefix = granted.slice(0, -2);
        if (permission.startsWith(prefix)) return true;
      }
    }

    return false;
  }

  validateToolPermissions(toolName: string, requiredPermissions: string[] = []): void {
    for (const req of requiredPermissions) {
      if (!this.hasPermission(req)) {
        throw new ToolPermissionError(toolName, req);
      }
    }
  }
}
