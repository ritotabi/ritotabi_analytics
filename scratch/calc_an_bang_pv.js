
const multipliers = [
  0.80, 1.10, 1.25, 1.30, 1.20, 1.10, 1.05, 0.95, 0.60, 0.50, 0.60, 0.70
];

const growthCurve = [
  0.0, 0.02, 0.10, 0.25, 0.50, 0.70, 0.80, 0.85, 0.90, 0.95, 0.98, 1.00
];

function calculatePV(basePeak, startMonthIndex) {
  const result = [];
  for (let m = 0; m < 24; m++) {
    const growth = m < 12 ? growthCurve[m] : 1.0 + (m - 12) * 0.02; // Slight growth after 12 months
    const seasonalIndex = (startMonthIndex + m) % 12;
    const multiplier = multipliers[seasonalIndex];
    result.push(Math.round(basePeak * growth * multiplier));
  }
  return result;
}

// Start month: April (index 3)
const startMonth = 3; 

const pp = calculatePV(250, startMonth);
const pn = calculatePV(600, startMonth);
const po = calculatePV(1200, startMonth);

console.log("pp:", JSON.stringify(pp));
console.log("pn:", JSON.stringify(pn));
console.log("po:", JSON.stringify(po));

const sum = (arr) => arr.reduce((a, b) => a + b, 0);
console.log("ap:", sum(pp.slice(0, 12)));
console.log("an:", sum(pn.slice(0, 12)));
console.log("ao:", sum(po.slice(0, 12)));
