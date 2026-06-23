// ⚠️ LEGACY PLACEHOLDER — pre-blueprint scaffold, frozen. Do not extend.
// To be replaced by Party:Owner per docs/DOMAIN_BLUEPRINT.md (roadmap order).
import type { Landlord } from "./types.js";

/**
 * Landlord business logic — framework-agnostic, deterministic. Static
 * in-memory source (no DB layer). Returns plain data objects.
 */
const landlords: readonly Landlord[] = [
  {
    id: "l-001",
    fullName: "Hasan Kaya",
    nationalId: "20000000147",
    phone: "+905310000001",
    email: "hasan.kaya@example.com",
    iban: "TR000000000000000000000001",
    verificationStatus: "verified",
    active: true,
  },
  {
    id: "l-002",
    fullName: "Fatma Şahin",
    nationalId: "20000000235",
    phone: "+905310000002",
    email: "fatma.sahin@example.com",
    iban: "TR000000000000000000000002",
    verificationStatus: "pending",
    active: true,
  },
];

export function listLandlords(): readonly Landlord[] {
  return landlords;
}

export function getLandlord(id: string): Landlord | undefined {
  return landlords.find((landlord) => landlord.id === id);
}
