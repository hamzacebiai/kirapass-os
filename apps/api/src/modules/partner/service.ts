import { randomUUID } from "node:crypto";

import { NotFoundError } from "./domain/errors.js";
import {
  activate,
  archive,
  assignOwnerStewardship,
  onboardPartner as createPartner,
  revokeOwnerStewardship,
  suspend,
} from "./domain/partner.js";
import type { Partner } from "./domain/partner.js";
import {
  makeEmailAddress,
  makeOwnerRef,
  makePartnerId,
  makePhoneNumber,
} from "./domain/value-objects.js";
import { partnerRepository } from "./repository.js";
import type { OnboardPartnerInput, PartnerView } from "./types.js";

/**
 * Partner application service — orchestrates the Partner aggregate and its
 * repository per use case. No business rules here: invariants live in the
 * aggregate, validation in the Value Objects. Id generation (infrastructure)
 * happens here, never inside the aggregate.
 */
function toView(partner: Partner): PartnerView {
  return {
    id: partner.id,
    name: partner.name,
    email: partner.email,
    phone: partner.phone,
    status: partner.status,
    accountId: partner.accountId,
    managedOwnerIds: [...partner.managedOwnerIds],
  };
}

function loadOrThrow(id: string): Partner {
  const partner = partnerRepository.findById(makePartnerId(id));
  if (!partner) {
    throw new NotFoundError(`Partner ${id} not found`);
  }
  return partner;
}

export function onboardPartner(input: OnboardPartnerInput): PartnerView {
  const partner = createPartner({
    id: makePartnerId(randomUUID()),
    name: input.name,
    email: makeEmailAddress(input.email),
    phone: makePhoneNumber(input.phone),
    accountId: input.accountId ?? null,
  });
  return toView(partnerRepository.save(partner));
}

export function getPartner(id: string): PartnerView | null {
  const partner = partnerRepository.findById(makePartnerId(id));
  return partner ? toView(partner) : null;
}

export function listPartners(): readonly PartnerView[] {
  return partnerRepository.findAll().map(toView);
}

export function activatePartner(id: string): PartnerView {
  return toView(partnerRepository.save(activate(loadOrThrow(id))));
}

export function suspendPartner(id: string): PartnerView {
  return toView(partnerRepository.save(suspend(loadOrThrow(id))));
}

export function archivePartner(id: string): PartnerView {
  return toView(partnerRepository.save(archive(loadOrThrow(id))));
}

export function assignStewardship(id: string, ownerId: string): PartnerView {
  return toView(
    partnerRepository.save(
      assignOwnerStewardship(loadOrThrow(id), makeOwnerRef(ownerId)),
    ),
  );
}

export function revokeStewardship(id: string, ownerId: string): PartnerView {
  return toView(
    partnerRepository.save(
      revokeOwnerStewardship(loadOrThrow(id), makeOwnerRef(ownerId)),
    ),
  );
}
