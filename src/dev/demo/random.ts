// Park-Miller generator as in the design's demo data (BilanzScreen.dc.html),
// so the same seed gives the same numbers as the design.
export function createRandom(seed: number) {
  let state = seed;
  // Uniform in (0, 1).
  const next = () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
  // Roughly normal around 0 (sum of six uniforms), standard deviation ≈ 1.
  const gauss = () =>
    (next() + next() + next() + next() + next() + next() - 3) * 1.41;
  return { next, gauss };
}
