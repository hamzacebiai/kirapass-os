/**
 * ⚠️ LEGACY PLACEHOLDER — pre-blueprint scaffold. NOT production code.
 * Excluded from implementation decisions; frozen (do not extend or build on).
 * Authoritative model: docs/DOMAIN_BLUEPRINT.md (Party:Owner — canonical term
 * is "Owner", not "landlord"). Slated for replacement in roadmap order — see
 * docs/RECONCILIATION_PLAN.md. Known divergences: terminology ("landlord"),
 * endpoint (/api/landlords → /api/owners), inline `verificationStatus`
 * (belongs to Verification), primitives vs VOs, boolean `active` vs lifecycle.
 */

/**
 * Landlord (ev sahibi) domain types — DTO only.
 */

/** e-Devlet identity verification state (integration placeholder). */
export type LandlordVerificationStatus = "unverified" | "pending" | "verified";

export interface Landlord {
  id: string;
  fullName: string;
  /** TC Kimlik No — identity verification reference. */
  nationalId: string;
  phone: string;
  email: string;
  /** IBAN for rent/dues payouts. */
  iban: string;
  verificationStatus: LandlordVerificationStatus;
  active: boolean;
}
