/**
 * Backfill script to add all existing starred repositories to processed-stars.json
 * This prevents them from being tweeted.
 *
 * Usage: deno run --allow-read --allow-write --allow-net --allow-env scripts/backfill-processed-stars.ts
 */

import { load } from 'https://deno.land/std@0.224.0/dotenv/mod.ts';
import { graphql } from 'npm:@octokit/graphql';

await load({ export: true });

const token = Deno.env.get('USER_GITHUB_TOKEN');
const username = Deno.env.get('USER_GITHUB_NAME');

if (!token || !username) {
  console.error('Error: USER_GITHUB_TOKEN and USER_GITHUB_NAME must be set in .env');
  Deno.exit(1);
}

const graphqlWithAuth = graphql.defaults({
  headers: { authorization: `token ${token}` },
});

const query = `
  query($username: String!, $cursor: String) {
    user(login: $username) {
      starredRepositories(first: 100, after: $cursor, orderBy: {field: STARRED_AT, direction: DESC}) {
        edges {
          node { url }
          starredAt
        }
        pageInfo { endCursor hasNextPage }
        totalCount
      }
    }
  }
`;

interface ProcessedStar {
  url: string;
  processedAt: string;
}

interface CacheData {
  processedStars: ProcessedStar[];
}

// Fetch all stars
const allStars: ProcessedStar[] = [];
let hasNextPage = true;
let cursor: string | null = null;

console.log('Fetching all starred repositories...');

while (hasNextPage) {
  const response = (await graphqlWithAuth(query, { username, cursor })) as {
    user: {
      starredRepositories: {
        edges: Array<{ node: { url: string }; starredAt: string }>;
        pageInfo: { endCursor: string; hasNextPage: boolean };
        totalCount: number;
      };
    };
  };
  const data = response.user.starredRepositories;

  if (allStars.length === 0) {
    console.log(`Total stars: ${data.totalCount}`);
  }

  for (const edge of data.edges) {
    allStars.push({
      url: edge.node.url,
      processedAt: new Date().toISOString(),
    });
  }

  console.log(`Fetched ${allStars.length} stars...`);

  hasNextPage = data.pageInfo.hasNextPage;
  cursor = data.pageInfo.endCursor;
}

// Load existing cache
let existing: CacheData = { processedStars: [] };
try {
  existing = JSON.parse(await Deno.readTextFile('.processed-stars.json'));
} catch {
  // File doesn't exist, start fresh
}

// Merge (avoid duplicates)
const existingUrls = new Set(existing.processedStars.map((s) => s.url));
const newStars = allStars.filter((s) => !existingUrls.has(s.url));

const merged: CacheData = {
  processedStars: [...existing.processedStars, ...newStars],
};

await Deno.writeTextFile('.processed-stars.json', JSON.stringify(merged, null, 2));
console.log(`\nDone! Added ${newStars.length} new stars. Total: ${merged.processedStars.length}`);
