const multipliers = [
  0.80, 1.10, 1.25, 1.30, 1.20, 1.10, 1.05, 0.95, 0.60, 0.50, 0.60, 0.70
];

function getMultiplier(monthIndex) {
  return multipliers[monthIndex % 12];
}

function calculateCurve(baseMature, startMonthIndex) {
  const result = [];
  for (let i = 0; i < 24; i++) {
    let growth = 0;
    if (i === 0) growth = 0;
    else if (i === 1) growth = 0.05;
    else if (i < 6) growth = 0.05 + (i - 1) * 0.1;
    else if (i < 12) growth = 0.5 + (i - 6) * 0.08;
    else growth = 1.0 + (i - 12) * 0.05;

    const currentMonth = (startMonthIndex + i) % 12;
    const m = getMultiplier(currentMonth);
    result.push(Math.round(baseMature * growth * m));
  }
  return result;
}

const startMonth = 3; // April
const pn_base = 2500; // Adjusted for Hoi An EN potential
const pp_base = Math.round(pn_base * 0.6);
const po_base = Math.round(pn_base * 1.5);

console.log("PP:", JSON.stringify(calculateCurve(pp_base, startMonth)));
console.log("PN:", JSON.stringify(calculateCurve(pn_base, startMonth)));
console.log("PO:", JSON.stringify(calculateCurve(po_base, startMonth)));
