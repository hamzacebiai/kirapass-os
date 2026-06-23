import type { Account } from "./domain/account.js";
import type { AccountId } from "./domain/value-objects.js";

/**
 * In-memory Account repository (no DB yet — DOMAIN roadmap defers persistence).
 * Owns load/save of the Account aggregate root only. Non-persistent: state
 * resets on process restart. Replaced by a durable implementation when the
 * persistence layer is introduced; the ownership boundary stays the same.
 */
class InMemoryAccountRepository {
  private readonly store = new Map<string, Account>();

  save(account: Account): Account {
    this.store.set(account.id, account);
    return account;
  }

  findById(id: AccountId): Account | undefined {
    return this.store.get(id);
  }

  findAll(): readonly Account[] {
    return [...this.store.values()];
  }
}

export const accountRepository = new InMemoryAccountRepository();
