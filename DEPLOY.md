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
2. Click on **Settings** (top tab) > **Pages** (left sidebar).
3. Under **Build and deployment** > **Source**, select **GitHub Actions** from the dropdown menu.
   - **Note**: You will see several "Suggested Workflows" (like Jekyll or Static HTML). **Do NOT click these**. 
   - Since I have already added the `.github/workflows/deploy.yml` file to your project, GitHub will automatically detect it once you select the "GitHub Actions" source.
   - Simply selecting "GitHub Actions" is enough. 

## 3. Deployment
Once the source is set correctly:
1. Click the **Actions** tab at the top of your GitHub repository.
2. You should see a workflow run in progress titled "Deploy to GitHub Pages".
3. If it failed previously, you can click on it and select **"Re-run all jobs"** now that the source is configured.

## 4. Firebase Configuration
Since the app uses Firebase, you MUST perform these two steps to make it work and keep it safe:

### A. Authorize your Domain (Required for Sign-In)
By default, Firebase prevents unknown websites from using your login system.
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Go to **Authentication** > **Settings** > **Authorized Domains**.
4. Click **Add Domain** and enter `yourusername.github.io`.

### B. Security Rules (Data Safety)
Your app is already protected by strict **Firestore Security Rules**. These rules ensure:
- Only **YOU** can see your financial data.
- Even if someone knows your repo URL, they cannot "scrape" or see your transactions without logging into your specific account.
- Every transaction and account is verified for the correct format before being saved.

## 5. Security & Privacy: Why Firebase?
You asked if your data is safe or if you should use it offline. Here is the breakdown:

| Feature | Firebase (Current) | Local-Only (Offline) |
| :--- | :--- | :--- |
| **Sync** | Syncs across phone, laptop, and tablet automatically. | Data stays only on the device where you typed it. |
| **Backups** | If you lose your phone, your data is safe in the cloud. | If you clear your browser cache, **all your data is gone**. |
| **Privacy** | Encrypted and protected by Google-grade security rules. | Maximum privacy (no data ever leaves your computer). |

## 6. Desktop App Setup (Locally)
To run this as a native desktop application on your computer:
1.  **Clone the Repo**:
    ```bash
    git clone https://github.com/YOUR_USERNAME/FinTrack.git
    cd FinTrack
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Run in Dev Mode**:
    ```bash
    npm run electron:dev
    ```
4.  **Build Installer**:
    ```bash
    npm run electron:build
    ```

## 7. Plaid Integration (Automated Banks)
To enable automated bank syncing:
1.  Sign up at [Plaid Dashboard](https://dashboard.plaid.com/).
2.  Get your **Client ID** and **Secret** from the Team Settings.
3.  Set them in your environment variables (or `.env` file locally):
    - `PLAID_CLIENT_ID`
    - `PLAID_SECRET`
    - `PLAID_ENV=sandbox` (use `development` for real accounts)
4.  Once configured, click **"Connect Bank via Plaid"** in the Accounts view of your app.
