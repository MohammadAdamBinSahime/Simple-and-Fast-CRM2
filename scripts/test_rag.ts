import { indexUserData, queryRag } from "../server/ai/rag";

async function main() {
  await indexUserData("default");
  const q = process.argv.slice(2).join(" ") || "Summarize contacts and deals.";
  const result = await queryRag("default", q);
  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
