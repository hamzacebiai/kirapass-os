import { UserRole } from '@prisma/client';
import { Permission } from './permissions.enum';

const ALL: Permission[] = Object.values(Permission);

// Static role -> permissions matrix. Server-owned; never client-controlled.
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: ALL,
  SYSTEM_ADMIN: [
    Permission.SystemAdmin,
    Permission.AgencyRead,
    Permission.AgencyWrite,
    Permission.AgencyDelete,
    Permission.UserRead,
    Permission.UserWrite,
    Permission.UserDelete,
    Permission.PropertyRead,
    Permission.PropertyWrite,
    Permission.PropertyDelete,
    Permission.UnitRead,
    Permission.UnitWrite,
    Permission.UnitDelete,
  ],
  AGENCY_OWNER: [
    Permission.AgencyRead,
    Permission.AgencyWrite,
    Permission.AgencyDelete,
    Permission.UserRead,
    Permission.UserWrite,
    Permission.PropertyRead,
    Permission.PropertyWrite,
    Permission.PropertyDelete,
    Permission.UnitRead,
    Permission.UnitWrite,
    Permission.UnitDelete,
  ],
  AGENCY_STAFF: [
    Permission.AgencyRead,
    Permission.UserRead,
    Permission.PropertyRead,
    Permission.PropertyWrite,
    Permission.UnitRead,
  ],
  AGENT: [
    Permission.AgencyRead,
    Permission.UserRead,
    Permission.PropertyRead,
    Permission.UnitRead,
  ],
  VIEWER: [
    Permission.AgencyRead,
    Permission.UserRead,
    Permission.PropertyRead,
    Permission.UnitRead,
  ],
};

export function permissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
