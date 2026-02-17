
const calculatePrinting = (totalPages, copies, size, mode, side, rules) => {
    const isColor = mode === 'Color';
    const isDouble = side === 'Double';
    const isA3 = size === 'A3';

    const colorKey = isColor ? 'color' : 'bw';
    const sideKey = isDouble ? 'double' : 'single';
    const a3SideKey = isDouble ? 'a3_double' : 'a3_single';

    let rate;
    if (isA3) {
        rate = rules.printing[colorKey][a3SideKey];
    } else {
        rate = rules.printing[colorKey][sideKey];
    }

    return totalPages * rate * copies;
};

const calculateBinding = (binding, quantity, rules) => {
    if (binding === 'Spiral') return rules.additional.binding * quantity;
    if (binding === 'Chart') return rules.additional.chart_binding * quantity;
    return 0;
};

const rules = {
    printing: {
        bw: { single: 0.75, double: 0.5, a3_single: 2, a3_double: 1.5 },
        color: { single: 8, double: 8, a3_single: 20, a3_double: 20 }
    },
    additional: {
        binding: 15,
        chart_binding: 10
    }
};

// Test Cases
const tests = [
    { name: "A4 B/W Single, 10 pages", pages: 10, size: "A4", mode: "B/W", side: "Single", binding: "None", expected: 7.5 },
    { name: "A4 B/W Double, 10 pages", pages: 10, size: "A4", mode: "B/W", side: "Double", binding: "None", expected: 5.0 },
    { name: "A3 B/W Single, 10 pages", pages: 10, size: "A3", mode: "B/W", side: "Single", binding: "None", expected: 20.0 },
    { name: "A3 B/W Double, 10 pages", pages: 10, size: "A3", mode: "B/W", side: "Double", binding: "None", expected: 15.0 },
    { name: "A4 Color Single, 5 pages + Spiral", pages: 5, size: "A4", mode: "Color", side: "Single", binding: "Spiral", expected: 40 + 15 },
    { name: "A3 Color Double, 2 pages + Chart", pages: 2, size: "A3", mode: "Color", side: "Double", binding: "Chart", expected: 40 + 10 },
];

tests.forEach(t => {
    const printCharge = calculatePrinting(t.pages, 1, t.size, t.mode, t.side, rules);
    const bindCharge = calculateBinding(t.binding, 1, rules);
    const total = printCharge + bindCharge;
    console.log(`${t.name}: ₹${total} (Expected: ₹${t.expected}) - ${total === t.expected ? 'PASS' : 'FAIL'}`);
});
