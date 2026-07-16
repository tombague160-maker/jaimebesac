// Triggers an RSS sync by calling the running app's HTTP endpoint.
// Usage (cron): APP_URL=https://app CRON_SECRET=xxx npm run news:sync
// Avoids importing the server-only app code (which throws under tsx).

const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
const cronSecret = process.env.CRON_SECRET;

async function main() {
  const response = await fetch(`${appUrl}/api/news/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
    },
    body: JSON.stringify({ limitPerSource: 20 }),
  });

  const text = await response.text();
  if (!response.ok) {
    console.error(`Synchronisation échouée (${response.status}) : ${text}`);
    process.exit(1);
  }
  console.log(text);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
