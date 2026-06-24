// Logical permissions (internal only — no DB). Resource.action format.
export enum Permission {
  AgencyRead = 'agency.read',
  AgencyWrite = 'agency.write',
  AgencyDelete = 'agency.delete',
  UserRead = 'user.read',
  UserWrite = 'user.write',
  UserDelete = 'user.delete',
  PropertyRead = 'property.read',
  PropertyWrite = 'property.write',
  PropertyDelete = 'property.delete',
  UnitRead = 'unit.read',
  UnitWrite = 'unit.write',
  UnitDelete = 'unit.delete',
  SystemAdmin = 'system.admin',
  BillingManage = 'billing.manage',
}
