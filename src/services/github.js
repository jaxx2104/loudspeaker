import { graphql } from '@octokit/graphql';
import { config } from '../config/env.js';

// GraphQL クライアントの初期化
const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${config.github.token}`,
  },
});

export async function getRecentStars() {
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
              primaryLanguage {
                name
              }
              object(expression: "HEAD:README.md") {
                ... on Blob {
                  text
                }
              }
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
      username: config.github.username,
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
          primaryLanguage: edge.node.primaryLanguage?.name || 'Unknown',
          readme: edge.node.object?.text || '',
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
