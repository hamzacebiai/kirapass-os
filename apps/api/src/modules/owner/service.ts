import { randomUUID } from "node:crypto";

import { NotFoundError } from "./domain/errors.js";
import {
  activate,
  archive,
  registerOwner as createOwner,
  setPayoutIban as setOwnerPayoutIban,
  verify,
} from "./domain/owner.js";
import type { Owner } from "./domain/owner.js";
import {
  makeEmailAddress,
  makeIban,
  makeNationalId,
  makeOwnerId,
  makePhoneNumber,
} from "./domain/value-objects.js";
import { ownerRepository } from "./repository.js";
import type { OwnerView, RegisterOwnerInput } from "./types.js";

/**
 * Owner application service — orchestrates the Owner aggregate and its
 * repository per use case. No business rules here: invariants live in the
 * aggregate, validation in the Value Objects. Id generation (infrastructure)
 * happens here, never inside the aggregate.
 */
function toView(owner: Owner): OwnerView {
  return {
    id: owner.id,
    fullName: owner.fullName,
    nationalId: owner.nationalId,
    phone: owner.phone,
    email: owner.email,
    payoutIban: owner.payoutIban,
    status: owner.status,
    accountId: owner.accountId,
    partnerId: owner.partnerId,
  };
}

function loadOrThrow(id: string): Owner {
  const owner = ownerRepository.findById(makeOwnerId(id));
  if (!owner) {
    throw new NotFoundError(`Owner ${id} not found`);
  }
  return owner;
}

export function registerOwner(input: RegisterOwnerInput): OwnerView {
  const owner = createOwner({
    id: makeOwnerId(randomUUID()),
    fullName: input.fullName,
    nationalId: makeNationalId(input.nationalId),
    phone: makePhoneNumber(input.phone),
    email: makeEmailAddress(input.email),
    payoutIban: input.payoutIban ? makeIban(input.payoutIban) : null,
    accountId: input.accountId ?? null,
    partnerId: input.partnerId ?? null,
  });
  return toView(ownerRepository.save(owner));
}

export function getOwner(id: string): OwnerView | null {
  const owner = ownerRepository.findById(makeOwnerId(id));
  return owner ? toView(owner) : null;
}

export function listOwners(): readonly OwnerView[] {
  return ownerRepository.findAll().map(toView);
}

export function verifyOwner(id: string): OwnerView {
  return toView(ownerRepository.save(verify(loadOrThrow(id))));
}

export function setPayoutIban(id: string, iban: string): OwnerView {
  return toView(
    ownerRepository.save(setOwnerPayoutIban(loadOrThrow(id), makeIban(iban))),
  );
}

export function activateOwner(id: string): OwnerView {
  return toView(ownerRepository.save(activate(loadOrThrow(id))));
}

export function archiveOwner(id: string): OwnerView {
  return toView(ownerRepository.save(archive(loadOrThrow(id))));
}
