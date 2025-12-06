const fs = require('fs');
const path = require('path');

// Load .env manually
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

const API_KEY = envVars.NEXT_PUBLIC_KIE_API_KEY || envVars.KIE_API_KEY || process.env.NEXT_PUBLIC_KIE_API_KEY;
const BASE_URL = "https://api.nanobananaapi.ai";

console.log("--- NanoBanana API Verification ---");
console.log(`API Key found: ${API_KEY ? "Yes (" + API_KEY.substring(0, 5) + "...)" : "No"}`);

async function verify() {
    if (!API_KEY) {
        console.error("Error: No API Key found in .env");
        return;
    }

    // 1. Submit Task
    console.log("\n1. Submitting Task...");
    const submitUrl = `${BASE_URL}/api/v1/nanobanana/generate-pro`;
    const payload = {
        prompt: "test image, cat",
        imageUrls: ["https://placehold.co/600x400.png"], // Dummy image
        resolution: "2K",
        aspectRatio: "1:1",
        callBackUrl: "https://example.com/callback"
    };

    try {
        const submitRes = await fetch(submitUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        console.log(`Submit Status: ${submitRes.status}`);
        const submitData = await submitRes.json();
        console.log("Submit Response:", JSON.stringify(submitData, null, 2));

        if (submitData.code === 402) {
            console.error("Error: Insufficient Credits");
            return;
        }

        const taskId = submitData.data?.taskId || submitData.taskId || submitData.data?.task_id || submitData.task_id;

        if (!taskId) {
            console.error("Error: No taskId found in response");
            return;
        }

        console.log(`\nTask ID: ${taskId}`);

        // Wait 5 seconds
        console.log("Waiting 5 seconds before checking status...");
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 2. Check Status
        console.log("\n2. Checking Status...");
        const statusUrl = `${BASE_URL}/api/v1/nanobanana/record-info?taskId=${taskId}`;
        console.log(`Status URL: ${statusUrl}`);

        const statusRes = await fetch(statusUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${API_KEY}`
            }
        });

        console.log(`Status Check HTTP Code: ${statusRes.status}`);
        const statusText = await statusRes.text();
        console.log("Status Response Text:", statusText);

    } catch (error) {
        console.error("Verification Failed:", error);
    }
}

verify();
