import { ToolPermissionError } from "./types.js";
export class ToolPermissionManager {
    grantedPermissions;
    constructor(granted = ["*"]) {
        this.grantedPermissions = new Set(granted);
    }
    grant(permission) {
        this.grantedPermissions.add(permission);
    }
    revoke(permission) {
        this.grantedPermissions.delete(permission);
    }
    hasPermission(permission) {
        if (this.grantedPermissions.has("*"))
            return true;
        if (this.grantedPermissions.has(permission))
            return true;
        // Support wildcard matching e.g. "network:*" matching "network:read"
        for (const granted of this.grantedPermissions) {
            if (granted.endsWith(":*")) {
                const prefix = granted.slice(0, -2);
                if (permission.startsWith(prefix))
                    return true;
            }
        }
        return false;
    }
    validateToolPermissions(toolName, requiredPermissions = []) {
        for (const req of requiredPermissions) {
            if (!this.hasPermission(req)) {
                throw new ToolPermissionError(toolName, req);
            }
        }
    }
}
//# sourceMappingURL=permissions.js.map