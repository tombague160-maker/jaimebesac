import { syncNewsSources } from "../src/lib/news/sync-news-sources";

syncNewsSources()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
