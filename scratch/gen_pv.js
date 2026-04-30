
const seasonality = [0.55, 0.60, 0.85, 0.80, 1.30, 0.65, 1.40, 1.35, 0.50, 0.90, 0.75, 0.85];

function generatePV(baseMature, startMonth, reachRate, growthFactor = 1.0) {
    const pv = [];
    for (let i = 0; i < 24; i++) {
        const monthIndex = (startMonth + i - 1) % 12;
        const season = seasonality[monthIndex];
        
        // Growth curve
        let growth;
        if (i === 0) growth = 0.01;
        else if (i < 6) growth = 0.01 + (i / 6) * 0.3;
        else if (i < 12) growth = 0.31 + ((i - 6) / 6) * 0.69;
        else growth = 1.0;

        const val = Math.round(baseMature * growth * season * reachRate * growthFactor);
        pv.push(val);
    }
    return pv;
}

// Amami JP Guide
// Mature: 10,000 (Tier 2/1 boundary)
// Published: Feb (Index 1)
const amamiJpGuide = {
    pp: generatePV(12000, 2, 0.08, 1.0),
    pn: generatePV(12000, 2, 0.12, 1.1),
    po: generatePV(12000, 2, 0.18, 1.3)
};

// Amami EN Guide
// Mature: ~1/4 of JP
const amamiEnGuide = {
    pp: generatePV(3000, 2, 0.06, 1.0),
    pn: generatePV(3000, 2, 0.10, 1.1),
    po: generatePV(3000, 2, 0.15, 1.3)
};

// Amami JP Hotel
const amamiJpHotel = {
    pp: generatePV(8000, 2, 0.07, 1.0),
    pn: generatePV(8000, 2, 0.10, 1.1),
    po: generatePV(8000, 2, 0.15, 1.3)
};

// Amami EN Hotel
const amamiEnHotel = {
    pp: generatePV(2000, 2, 0.05, 1.0),
    pn: generatePV(2000, 2, 0.08, 1.1),
    po: generatePV(2000, 2, 0.12, 1.3)
};

console.log(JSON.stringify({ amamiJpGuide, amamiEnGuide, amamiJpHotel, amamiEnHotel }, null, 2));
