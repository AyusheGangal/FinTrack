# Deploying to GitHub Pages

This application has been converted to a static React app, which can be hosted for free on GitHub Pages.

## 1. Push to GitHub
1. Create a new repository on GitHub.
2. Initialize git in your local project:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

## 2. Configure GitHub Pages
1. Go to your repository on GitHub.
2. Click on **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.

## 3. Deployment
The included GitHub Action (`.github/workflows/deploy.yml`) will automatically build and deploy your site every time you push to the `main` branch.

## 4. Firebase Configuration
Since the app uses Firebase, ensure your Firestore Security Rules are deployed and configured correctly to allow client-side access from your `github.io` domain.
- Go to the [Firebase Console](https://console.firebase.google.com/).
- Navigate to **Authentication** > **Settings** > **Authorized Domains**.
- Add your GitHub Pages domain (e.g., `yourusername.github.io`).

## Troubleshooting
- **Routing**: This app uses state-based navigation, so you don't need to worry about 404s on refresh (a common issue with React Router on GitHub Pages).
- **Base Path**: The `vite.config.ts` is configured with `base: './'` to support both top-level and subfolder deployments.
