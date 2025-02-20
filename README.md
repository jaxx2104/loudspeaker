# GitHub Star X Share Action

A GitHub Action that automatically shares new repository stars on X (Twitter). It checks for new stars every 15 minutes and posts them to X if found.

## Features

- Automatic execution every 15 minutes
- Detection of new stars
- AI-powered repository description summarization
- Automatic posting to X
- Prevention of duplicate posts

## Setup

1. Fork this repository or copy the workflow file to your repository.

2. Set up the following GitHub Secrets:

   - `USER_GITHUB_TOKEN`: GitHub Personal Access Token
   - `USER_GITHUB_NAME`: Your GitHub username
   - `X_API_KEY`: X API Consumer Key
   - `X_API_SECRET`: X API Consumer Secret
   - `X_ACCESS_TOKEN`: X API Access Token
   - `X_ACCESS_SECRET`: X API Access Token Secret
   - `MISTRAL_API_KEY`: Mistral AI API Key

   You can set these secrets in your GitHub repository under Settings > Secrets and variables > Actions.

3. Enable GitHub Actions.

## Project Structure

```
src/
├── config/
│   └── env.js           # Environment variables configuration
├── services/
│   ├── github.js        # GitHub API interactions
│   ├── summarizer.js    # AI-powered description summarization
│   └── twitter.js       # X (Twitter) API interactions
└── index.js             # Main application logic
```

## Getting X API Credentials

1. Visit the [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create an App
3. Enable the following permissions:
   - Read and Write permissions
   - OAuth 1.0a
4. Generate the necessary keys and tokens

## Getting Mistral AI API Key

1. Visit [Mistral AI Platform](https://console.mistral.ai/)
2. Sign up or log in
3. Generate an API key from your dashboard

## Customization

- To change the post message format, edit the message template in `src/index.js`
- To modify the summary format, update the prompt in `src/services/summarizer.js`
- To adjust environment variables, modify `src/config/env.js`

## License

MIT

## Notes

- Be mindful of X API rate limits
- Be aware of GitHub API rate limits
- Consider Mistral AI API usage and costs
