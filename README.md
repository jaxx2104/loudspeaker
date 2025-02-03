# GitHub Star X Share Action

A GitHub Action that automatically shares new repository stars on X (Twitter). It checks for new stars every 15 minutes and posts them to X if found.

## Features

- Automatic execution every 15 minutes
- Detection of new stars
- Automatic posting to X
- Prevention of duplicate posts

## Setup

1. Fork this repository or copy the workflow file to your repository.

2. Set up the following GitHub Secrets:

   - `X_API_KEY`: X API Consumer Key
   - `X_API_SECRET`: X API Consumer Secret
   - `X_ACCESS_TOKEN`: X API Access Token
   - `X_ACCESS_SECRET`: X API Access Token Secret

   You can set these secrets in your GitHub repository under Settings > Secrets and variables > Actions.

3. Enable GitHub Actions.

## Getting X API Credentials

1. Visit the [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create an App
3. Enable the following permissions:
   - Read and Write permissions
   - OAuth 1.0a
4. Generate the necessary keys and tokens

## Customization

To change the post message format, edit the `postToX` function in `src/index.js`.

## License

MIT

## Notes

- Be mindful of X API rate limits
- Be aware of GitHub API rate limits
