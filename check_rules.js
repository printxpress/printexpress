import axios from 'axios';

const checkPricing = async () => {
    try {
        const { data } = await axios.get('http://localhost:5000/api/pricing');
        console.log("Current Pricing Rules:", JSON.stringify(data.pricing?.rules, null, 2));
    } catch (error) {
        console.error("Error:", error.message);
    }
};

checkPricing();
