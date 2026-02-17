
const calculateWeight = (totalPages, copies, side, binding) => {
    const billingPages = side === 'Double' ? Math.ceil(totalPages / 2) : totalPages;
    const totalSheets = billingPages * copies;
    let bindingWeight = 0;
    if (binding === 'Spiral') bindingWeight = 0.1 * 1; // Assuming 1 binding
    else if (binding === 'Chart') bindingWeight = 0.05 * 1;

    return (totalSheets * 5 / 1000) + bindingWeight;
};

const calculateDelivery = (weight, tiers) => {
    let rule = tiers.tier_c;
    if (weight <= tiers.tier_a.maxWeight) rule = tiers.tier_a;
    else if (weight <= tiers.tier_b.maxWeight) rule = tiers.tier_b;

    return (rule.rate * weight) + rule.slip;
};

const tiers = {
    tier_a: { maxWeight: 3, rate: 35, slip: 0 },
    tier_b: { maxWeight: 10, rate: 29, slip: 20 },
    tier_c: { maxWeight: 999, rate: 26, slip: 20 }
};

// Test cases
console.log("Test 1: 100 pages, Double, No Binding (50 sheets)");
const w1 = calculateWeight(100, 1, 'Double', 'None');
console.log(`Weight: ${w1}kg, Delivery: ₹${calculateDelivery(w1, tiers)}`);

console.log("\nTest 2: 800 pages, Single, Spiral (800 sheets + 0.1kg)");
const w2 = calculateWeight(800, 1, 'Single', 'Spiral');
console.log(`Weight: ${w2}kg, Delivery: ₹${calculateDelivery(w2, tiers)}`);

console.log("\nTest 3: 2500 pages, Single, No Binding (2500 sheets)");
const w3 = calculateWeight(2500, 1, 'Single', 'None');
console.log(`Weight: ${w3}kg, Delivery: ₹${calculateDelivery(w3, tiers)}`);
