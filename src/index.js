import { graphql } from '@octokit/graphql';
import { TwitterApi } from 'twitter-api-v2';
import 'dotenv/config';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatMistralAI } from '@langchain/mistralai';

// 環境変数の存在確認
const requiredEnvVars = [
  'USER_GITHUB_TOKEN',
  'USER_GITHUB_NAME',
  'X_API_KEY',
  'X_API_SECRET',
  'X_ACCESS_TOKEN',
  'X_ACCESS_SECRET',
  'MISTRAL_API_KEY',
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
  MISTRAL_API_KEY,
} = process.env;

// LangChainの設定
const model = new ChatMistralAI({
  apiKey: MISTRAL_API_KEY,
  modelName: 'mistral-tiny', // 最も安価なモデル
  temperature: 0.3,
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "あなたは優秀なWEBエンジニアです。必ず日本語で要約してください"],
  ["user", "以下のGitHubリポジトリの説明を30文字以内で簡潔に要約してください。説明: {description}"]
]);

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

async function summarizeDescription(description) {
  try {
    const chain = prompt.pipe(model);
    const result = await chain.invoke({
      description: description || "No description provided"
    });
    return result.content ? ` - ${result.content}` : '';
  } catch (error) {
    console.error("Error in summarizeDescription:", error);
    return '';
  }
}

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

async function postToX(message) {
  console.log(message)
  await twitterClient.v2.tweet(message);
}

async function main() {
  try {
    // GitHub Star の取得
    const stars = await getRecentStars();
    console.log(stars)

    // 新しい Star を古い順に処理
    for (const star of stars.reverse()) {
      // LLM によって要約を作成
      const summary = await summarizeDescription(star.description);
      const message = `I just starred ${star.repo}${summary}\n${star.url}`;
      console.log(message)
      // X に投稿（一旦コメントアウト）
      // await postToX(message);
      // console.log(`Posted about star from ${star.repo}`);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
