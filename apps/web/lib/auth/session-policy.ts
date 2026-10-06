export type AuthenticationPolicyMode = "closed_pilot" | "require_mfa";

type FactorVerificationAge = readonly [number, number];

function parseFactorVerificationAge(
  claims: unknown,
): FactorVerificationAge | null {
  if (typeof claims !== "object" || claims === null || !("fva" in claims)) {
    return null;
  }

  const factorAges = claims.fva;
  if (
    !Array.isArray(factorAges) ||
    factorAges.length < 2 ||
    typeof factorAges[0] !== "number" ||
    typeof factorAges[1] !== "number" ||
    !Number.isInteger(factorAges[0]) ||
    !Number.isInteger(factorAges[1])
  ) {
    return null;
  }

  return [factorAges[0], factorAges[1]];
}

export function hasRecentSecondFactor(claims: unknown): boolean {
  const factorAges = parseFactorVerificationAge(claims);
  return (
    factorAges !== null &&
    factorAges[0] >= 0 &&
    factorAges[0] <= 10 &&
    factorAges[1] >= 0 &&
    factorAges[1] <= 10
  );
}
