import { graphql } from '@octokit/graphql';
import { config } from '../config/env.ts';
import type { GitHubResponse, StarData } from '../types/index.ts';

// GraphQL client with authentication
const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${config.github.token}`,
  },
});

export async function getRecentStars(): Promise<StarData[]> {
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

  const stars: StarData[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  // Calculate timestamp for 15 minutes ago
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  while (hasNextPage) {
    const response = await graphqlWithAuth(query, {
      username: config.github.username,
      cursor,
    }) as GitHubResponse;

    const edges = response.user.starredRepositories.edges;

    // Add only stars from within the last 15 minutes
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
