
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

const calculateBinding = (binding, quantity, size, rules) => {
    if (binding === 'Spiral') return (size === 'A3' ? 40 : 15) * quantity;
    if (binding === 'Chart') return (size === 'A3' ? 20 : 10) * quantity;
    return 0;
};

const rules = {
    printing: {
        bw: { single: 0.75, double: 0.5, a3_single: 2, a3_double: 1.5 },
        color: { single: 8, double: 8, a3_single: 20, a3_double: 20 }
    }
};

// Test Cases
const tests = [
    { name: "A4 B/W Single, 10 pages", pages: 10, size: "A4", mode: "B/W", side: "Single", binding: "None", expected: 7.5 },
    { name: "A4 Spiral Binding", pages: 1, size: "A4", mode: "B/W", side: "Single", binding: "Spiral", expected: 0.75 + 15 },
    { name: "A4 Chart Binding", pages: 1, size: "A4", mode: "B/W", side: "Single", binding: "Chart", expected: 0.75 + 10 },
    { name: "A3 Spiral Binding", pages: 1, size: "A3", mode: "B/W", side: "Single", binding: "Spiral", expected: 2 + 40 },
    { name: "A3 Chart Binding", pages: 1, size: "A3", mode: "B/W", side: "Single", binding: "Chart", expected: 2 + 20 },
];

tests.forEach(t => {
    const printCharge = calculatePrinting(t.pages, 1, t.size, t.mode, t.side, rules);
    const bindCharge = calculateBinding(t.binding, 1, t.size, rules);
    const total = printCharge + bindCharge;
    console.log(`${t.name}: ₹${total} (Expected: ₹${t.expected}) - ${total === t.expected ? 'PASS' : 'FAIL'}`);
});
