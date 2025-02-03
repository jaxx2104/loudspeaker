import { graphql } from '@octokit/graphql';
import { TwitterApi } from 'twitter-api-v2';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

// 環境変数から認証情報を取得
const {
  USER_GITHUB_TOKEN,
  X_API_KEY,
  X_API_SECRET,
  X_ACCESS_TOKEN,
  X_ACCESS_SECRET,
  REPOSITORY
} = process.env;

// リポジトリ情報を分解
const [owner, repo] = REPOSITORY.split('/');

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

// 最後のチェック時刻を保存するファイルのパス
const LAST_CHECK_FILE = '.last-check';

async function getLastCheckTime() {
  try {
    const time = await readFile(LAST_CHECK_FILE, 'utf8');
    return new Date(time.trim());
  } catch {
    return new Date(0); // ファイルが存在しない場合は最古の日時を返す
  }
}

async function saveLastCheckTime(time) {
  await writeFile(LAST_CHECK_FILE, time.toISOString());
}

async function getRecentStars(lastCheck) {
  const query = `
    query($owner: String!, $repo: String!, $cursor: String) {
      repository(owner: $owner, name: $repo) {
        stargazers(first: 100, after: $cursor, orderBy: {field: STARRED_AT, direction: DESC}) {
          edges {
            node {
              login
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

  while (hasNextPage) {
    const response = await graphqlWithAuth(query, {
      owner,
      repo,
      cursor,
    });

    const edges = response.repository.stargazers.edges;
    
    // 最後のチェック時刻より新しいStarのみを追加
    for (const edge of edges) {
      const starredAt = new Date(edge.starredAt);
      if (starredAt > lastCheck) {
        stars.push({
          user: edge.node.login,
          starredAt,
        });
      } else {
        hasNextPage = false;
        break;
      }
    }

    if (hasNextPage && response.repository.stargazers.pageInfo.hasNextPage) {
      cursor = response.repository.stargazers.pageInfo.endCursor;
    } else {
      hasNextPage = false;
    }
  }

  return stars;
}

async function postToX(star) {
  const message = `🌟 New Star!\n${star.user} starred ${REPOSITORY}\nhttps://github.com/${REPOSITORY}`;
  await twitterClient.v2.tweet(message);
}

async function main() {
  try {
    const lastCheck = await getLastCheckTime();
    const stars = await getRecentStars(lastCheck);
    
    // 新しい Star を古い順に処理
    for (const star of stars.reverse()) {
      await postToX(star);
      console.log(`Posted about star from ${star.user}`);
    }

    // 最終チェック時刻を更新
    await saveLastCheckTime(new Date());
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
