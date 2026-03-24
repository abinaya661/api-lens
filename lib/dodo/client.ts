import DodoPayments from 'dodopayments';

let _dodo: DodoPayments | null = null;

function getDodoClient(): DodoPayments {
  if (!_dodo) {
    _dodo = new DodoPayments({
      bearerToken: process.env.DODO_API_KEY!,
      environment:
        process.env.DODO_PAYMENTS_ENVIRONMENT === 'test_mode' ? 'test_mode' : undefined,
    });
  }
  return _dodo;
}

// Lazy proxy — the SDK is only instantiated on first use at request time,
// not at module evaluation time (avoids build errors when env vars are absent).
export const dodo = new Proxy({} as DodoPayments, {
  get(_target, prop) {
    return (getDodoClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
