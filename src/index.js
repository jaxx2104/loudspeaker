import { graphql } from '@octokit/graphql';
import { TwitterApi } from 'twitter-api-v2';
import { readFile, writeFile } from 'fs/promises';
import 'dotenv/config';

// 環境変数の存在確認
const requiredEnvVars = [
  'USER_GITHUB_TOKEN',
  'USER_GITHUB_NAME',
  'X_API_KEY',
  'X_API_SECRET',
  'X_ACCESS_TOKEN',
  'X_ACCESS_SECRET',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} is not set in environment variables`);
    process.exit(1);
  }
}

// 環境変数から認証情報を取得
const {
  USER_GITHUB_TOKEN,
  USER_GITHUB_NAME,
  X_API_KEY,
  X_API_SECRET,
  X_ACCESS_TOKEN,
  X_ACCESS_SECRET,
} = process.env;

// GraphQL クライアントの初期化
const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${USER_GITHUB_TOKEN}`,
  },
});

// X クライアントの初期化
const twitterClient = new TwitterApi({
  appKey: X_API_KEY,
  appSecret: X_API_SECRET,
  accessToken: X_ACCESS_TOKEN,
  accessSecret: X_ACCESS_SECRET,
});

async function getRecentStars() {
  const query = `
    query($username: String!, $cursor: String) {
      user(login: $username) {
        starredRepositories(
          first: 100, 
          after: $cursor, 
          orderBy: {field: STARRED_AT, direction: DESC}
        ) {
          edges {
            node {
              nameWithOwner
              description
              url
            }
            starredAt
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  `;

  const stars = [];
  let hasNextPage = true;
  let cursor = null;
  
  // 15分前の時刻を計算
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  while (hasNextPage) {
    const response = await graphqlWithAuth(query, {
      username: USER_GITHUB_NAME,
      cursor,
    });

    const edges = response.user.starredRepositories.edges;
    
    // 15分以内のStarのみを追加
    for (const edge of edges) {
      const starredAt = new Date(edge.starredAt);
      if (starredAt > fifteenMinutesAgo) {
        stars.push({
          repo: edge.node.nameWithOwner,
          description: edge.node.description,
          url: edge.node.url,
          starredAt,
        });
      } else {
        hasNextPage = false;
        break;
      }
    }

    if (hasNextPage && response.user.starredRepositories.pageInfo.hasNextPage) {
      cursor = response.user.starredRepositories.pageInfo.endCursor;
    } else {
      hasNextPage = false;
    }
  }

  return stars;
}

async function postToX(star) {
  const description = star.description ? `\n${star.description}` : '';
  const message = `I just starred ${star.repo}${description}\n${star.url}`;
  await twitterClient.v2.tweet(message);
}

async function main() {
  try {
    const stars = await getRecentStars();
    
    // 新しい Star を古い順に処理
    for (const star of stars.reverse()) {
      await postToX(star);
      console.log(`Posted about star from ${star.repo}`);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
