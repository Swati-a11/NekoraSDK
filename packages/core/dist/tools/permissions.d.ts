export declare class ToolPermissionManager {
    private grantedPermissions;
    constructor(granted?: string[]);
    grant(permission: string): void;
    revoke(permission: string): void;
    hasPermission(permission: string): boolean;
    validateToolPermissions(toolName: string, requiredPermissions?: string[]): void;
}
//# sourceMappingURL=permissions.d.ts.map