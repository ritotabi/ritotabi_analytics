
const seasonality = [0.55, 0.60, 0.85, 0.80, 1.30, 0.65, 1.40, 1.35, 0.50, 0.90, 0.75, 0.85];

function generatePV(baseMature, startMonth, reachRate, growthFactor = 1.0) {
    const pv = [];
    for (let i = 0; i < 24; i++) {
        const monthIndex = (startMonth + i - 1) % 12;
        const season = seasonality[monthIndex];
        
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

// Kume JP Guide
const kumeJpGuide = {
    pp: generatePV(4000, 2, 0.10, 1.0),
    pn: generatePV(4000, 2, 0.15, 1.1),
    po: generatePV(4000, 2, 0.20, 1.3)
};

// Kume JP Hotel
const kumeJpHotel = {
    pp: generatePV(3000, 2, 0.08, 1.0),
    pn: generatePV(3000, 2, 0.12, 1.1),
    po: generatePV(3000, 2, 0.18, 1.3)
};

console.log(JSON.stringify({ kumeJpGuide, kumeJpHotel }, null, 2));
