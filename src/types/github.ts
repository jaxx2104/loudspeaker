export interface PrimaryLanguage {
  name: string;
}

export interface ReadmeBlob {
  text: string;
}

export interface RepositoryNode {
  nameWithOwner: string;
  description: string | null;
  url: string;
  primaryLanguage: PrimaryLanguage | null;
  object: ReadmeBlob | null;
}

export interface StarEdge {
  node: RepositoryNode;
  starredAt: string;
}

export interface PageInfo {
  endCursor: string | null;
  hasNextPage: boolean;
}

export interface StarredRepositories {
  edges: StarEdge[];
  pageInfo: PageInfo;
}

export interface GitHubUser {
  starredRepositories: StarredRepositories;
}

export interface GitHubResponse {
  user: GitHubUser;
}

export interface StarData {
  repo: string;
  description: string | null;
  url: string;
  primaryLanguage: string;
  readme: string;
  starredAt: Date;
}
