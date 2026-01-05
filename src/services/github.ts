import { graphql } from '@octokit/graphql';
import { config } from '../config/env.ts';
import type { GitHubResponse, StarData } from '../types/index.ts';

// GraphQL client with authentication
const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${config.github.token}`,
  },
});

// Time window configuration (20 minutes to account for GitHub Actions scheduling delays)
const TIME_WINDOW_MINUTES = 20;

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

  // Calculate timestamp for time window
  const timeWindowAgo = new Date(Date.now() - TIME_WINDOW_MINUTES * 60 * 1000);
  console.log(`[GitHub] Fetching stars from the last ${TIME_WINDOW_MINUTES} minutes`);
  console.log(`[GitHub] Time window: ${timeWindowAgo.toISOString()} - ${new Date().toISOString()}`);

  while (hasNextPage) {
    try {
      console.log(`[GitHub] Querying starred repositories${cursor ? ' (next page)' : ''}...`);
      const response = await graphqlWithAuth(query, {
        username: config.github.username,
        cursor,
      }) as GitHubResponse;

      const edges = response.user.starredRepositories.edges;
      console.log(`[GitHub] Retrieved ${edges.length} stars in current page`);

      // Add only stars from within the time window
      for (const edge of edges) {
        const starredAt = new Date(edge.starredAt);
        if (starredAt > timeWindowAgo) {
          console.log(`[GitHub] Found recent star: ${edge.node.nameWithOwner} (starred at: ${edge.starredAt})`);
          stars.push({
            repo: edge.node.nameWithOwner,
            description: edge.node.description,
            url: edge.node.url,
            primaryLanguage: edge.node.primaryLanguage?.name || 'Unknown',
            readme: edge.node.object?.text || '',
            starredAt,
          });
        } else {
          console.log(`[GitHub] Star ${edge.node.nameWithOwner} is outside time window, stopping pagination`);
          hasNextPage = false;
          break;
        }
      }

      if (hasNextPage && response.user.starredRepositories.pageInfo.hasNextPage) {
        cursor = response.user.starredRepositories.pageInfo.endCursor;
      } else {
        hasNextPage = false;
      }
    } catch (error) {
      console.error('[GitHub] Error fetching stars:', error);
      throw error;
    }
  }

  console.log(`[GitHub] Total stars found in time window: ${stars.length}`);
  return stars;
}
