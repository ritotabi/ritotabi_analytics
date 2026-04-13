const marketData = {
  hoian: [0.8, 1.1, 1.25, 1.3, 1.2, 1.1, 1.05, 0.95, 0.6, 0.5, 0.6, 0.7]
};

const tier2MaturePV = 3500; // Tier 2 (Hotel Summary) mature range is 1500-5000. 3500 is a good middle for Hoi An.
const enMultiplier = 2.5; // EN is 2.0-3.0x JP.
const maturityMonths = 12;

function calculatePV(startMonthIndex, maturePV) {
  const pv = [];
  for (let i = 0; i < 24; i++) {
    const currentMonthIndex = (startMonthIndex + i) % 12;
    const seasonality = marketData.hoian[currentMonthIndex];
    
    // Growth curve: linear growth to maturity
    let growthFactor = (i + 1) / maturityMonths;
    if (growthFactor > 1) growthFactor = 1;
    
    // Initial 2 months penalty (SEO indexing)
    if (i === 0) growthFactor *= 0.05;
    if (i === 1) growthFactor *= 0.2;

    const basePV = maturePV * growthFactor * seasonality;
    pv.push(Math.round(basePV));
  }
  return pv;
}

const publishedMonth = 3; // April (0-indexed: 0=Jan, 3=Apr)
const maturePV_EN = tier2MaturePV * enMultiplier; // 3500 * 2.5 = 8750

const pn = calculatePV(publishedMonth, maturePV_EN);
const pp = pn.map(v => Math.round(v * 0.7)); // Pessimistic
const po = pn.map(v => Math.round(v * 1.5)); // Optimistic

console.log("PN:", JSON.stringify(pn));
console.log("PP:", JSON.stringify(pp));
console.log("PO:", JSON.stringify(po));
