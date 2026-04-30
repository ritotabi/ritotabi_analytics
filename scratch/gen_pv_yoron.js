
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

// Yoron JP Guide
const yoronJpGuide = {
    pp: generatePV(4500, 3, 0.10, 1.0),
    pn: generatePV(4500, 3, 0.15, 1.1),
    po: generatePV(4500, 3, 0.20, 1.3)
};

// Yoron JP Beaches
const yoronJpBeaches = {
    pp: generatePV(5000, 3, 0.10, 1.0),
    pn: generatePV(5000, 3, 0.15, 1.1),
    po: generatePV(5000, 3, 0.20, 1.3)
};

// Yoron JP Hotel
const yoronJpHotel = {
    pp: generatePV(4000, 3, 0.08, 1.0),
    pn: generatePV(4000, 3, 0.12, 1.1),
    po: generatePV(4000, 3, 0.18, 1.3)
};

// Yoron JP Running
const yoronJpRunning = {
    pp: generatePV(2000, 3, 0.10, 1.0),
    pn: generatePV(2000, 3, 0.15, 1.1),
    po: generatePV(2000, 3, 0.20, 1.3)
};

console.log(JSON.stringify({ yoronJpGuide, yoronJpBeaches, yoronJpHotel, yoronJpRunning }, null, 2));
