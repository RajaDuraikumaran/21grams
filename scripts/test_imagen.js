const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    try {
        console.log("Testing SDK with model: imagen-3.0-generate-preview-06-06");
        const model = genAI.getGenerativeModel({ model: "imagen-3.0-generate-preview-06-06" });

        // Try generateContent (text-to-image might be via this or throw error)
        const result = await model.generateContent("a cat");
        console.log("Response:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("SDK Error:", e.message);
        if (e.response) {
            console.error("Response:", JSON.stringify(e.response, null, 2));
        }
    }
}

run();
