import "dotenv/config";
import Replicate from "replicate";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

async function main() {
    try {
        console.log("Fetching lucataco/instantid...");
        const model = await replicate.models.get("lucataco", "instantid");
        console.log("Latest version:", model.latest_version?.id);
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

main();
