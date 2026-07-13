export class IntegrationAuthError extends Error {
  constructor(
    public readonly providerId: string,
    public readonly integrationId: string,
  ) {
    super(
      `${providerId} integration ${integrationId} requires reauthentication`,
    );
    this.name = "IntegrationAuthError";
  }
}

export class RateLimitedError extends Error {
  constructor(providerId: string) {
    super(`${providerId} request was rate limited`);
    this.name = "RateLimitedError";
  }
}

/** Thrown by low-level provider fetch helpers on a live 401/403 — the
 * caller doesn't know the integrationId, so search-route.ts resolves that
 * and deactivates the integration. */
export class GoogleAuthRequiredError extends Error {
  constructor(public readonly providerId: string) {
    super(`${providerId} request requires reauthentication`);
    this.name = "GoogleAuthRequiredError";
  }
}
