const https = require('https');

const apiKey = process.env.GOOGLE_API_KEY;
const model = "imagen-3.0-generate-preview-06-06";
const prompt = "a cat";

function testEndpoint(path, method, body) {
    const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log(`Endpoint: ${path}`);
            console.log(`Status: ${res.statusCode}`);
            console.log(`Response: ${data.substring(0, 200)}...`);
            console.log('---');
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.write(JSON.stringify(body));
    req.end();
}

// Test: generateImages
testEndpoint(
    `/v1beta/models/${model}:generateImages`,
    'POST',
    {
        prompt: prompt,
        number_of_images: 1
    }
);
