import { randomUUID } from "node:crypto";

import { NotFoundError } from "./domain/errors.js";
import {
  activate,
  archive,
  markPast,
  registerTenant as createTenant,
  verify,
} from "./domain/tenant.js";
import type { Tenant } from "./domain/tenant.js";
import {
  makeEmailAddress,
  makeNationalId,
  makePhoneNumber,
  makeTenantId,
} from "./domain/value-objects.js";
import { tenantRepository } from "./repository.js";
import type { RegisterTenantInput, TenantView } from "./types.js";

/**
 * Tenant application service — orchestrates the Tenant aggregate and its
 * repository per use case. No business rules here: invariants live in the
 * aggregate, validation in the Value Objects. Id generation (infrastructure)
 * happens here, never inside the aggregate.
 */
function toView(tenant: Tenant): TenantView {
  return {
    id: tenant.id,
    fullName: tenant.fullName,
    nationalId: tenant.nationalId,
    phone: tenant.phone,
    email: tenant.email,
    status: tenant.status,
    accountId: tenant.accountId,
    ratingSummary: tenant.ratingSummary,
  };
}

function loadOrThrow(id: string): Tenant {
  const tenant = tenantRepository.findById(makeTenantId(id));
  if (!tenant) {
    throw new NotFoundError(`Tenant ${id} not found`);
  }
  return tenant;
}

export function registerTenant(input: RegisterTenantInput): TenantView {
  const tenant = createTenant({
    id: makeTenantId(randomUUID()),
    fullName: input.fullName,
    nationalId: makeNationalId(input.nationalId),
    phone: makePhoneNumber(input.phone),
    email: makeEmailAddress(input.email),
    accountId: input.accountId ?? null,
  });
  return toView(tenantRepository.save(tenant));
}

export function getTenant(id: string): TenantView | null {
  const tenant = tenantRepository.findById(makeTenantId(id));
  return tenant ? toView(tenant) : null;
}

export function listTenants(): readonly TenantView[] {
  return tenantRepository.findAll().map(toView);
}

export function verifyTenant(id: string): TenantView {
  return toView(tenantRepository.save(verify(loadOrThrow(id))));
}

export function activateTenant(id: string): TenantView {
  return toView(tenantRepository.save(activate(loadOrThrow(id))));
}

export function markTenantPast(id: string): TenantView {
  return toView(tenantRepository.save(markPast(loadOrThrow(id))));
}

export function archiveTenant(id: string): TenantView {
  return toView(tenantRepository.save(archive(loadOrThrow(id))));
}
