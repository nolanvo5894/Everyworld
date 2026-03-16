# Deploying Drama Engine to Cloud Run

## Prerequisites

1. **Google Cloud account** with billing enabled
2. **gcloud CLI** installed — https://cloud.google.com/sdk/docs/install
3. **Gemini API key** — https://aistudio.google.com/apikey

Verify gcloud is installed:

```bash
gcloud --version
```

## Step 1: Authenticate and set project

```bash
gcloud auth login
```

If you already have a GCP project:

```bash
gcloud config set project YOUR_PROJECT_ID
```

Or create a new one:

```bash
gcloud projects create drama-engine-demo --name="Drama Engine"
gcloud config set project drama-engine-demo
```

Link a billing account (required for Cloud Run):

```bash
# List billing accounts
gcloud billing accounts list

# Link one
gcloud billing projects link drama-engine-demo --billing-account=ACCOUNT_ID
```

## Step 2: Enable required APIs

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com
```

## Step 3: Deploy

From the `StoryEngine/` directory:

```bash
cd /Users/thanhle/claude/westworld/StoryEngine

gcloud run deploy drama-engine \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

On first run, gcloud may prompt you to:
- Create an Artifact Registry repository — say **yes**
- Select a region — pick the same one (`us-central1`)

Wait for the build and deploy to finish (~2-3 minutes). It will print:

```
Service URL: https://drama-engine-XXXX-uc.a.run.app
```

That's your live URL. Share it with judges.

## Step 4: Verify

Open the URL in your browser. You should see:

1. The Drama Engine home screen
2. A Gemini API Key input field (since no key is baked in)
3. Paste your API key, click Save
4. The key is stored in the browser's localStorage — it persists across sessions

## Updating after code changes

Same command, run from `StoryEngine/`:

```bash
gcloud run deploy drama-engine \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

## Instructions for judges

Share this with anyone using the deployed app:

> 1. Open the app URL
> 2. Get a free Gemini API key at https://aistudio.google.com/apikey
> 3. Paste the key into the API Key field on the home screen and click Save
> 4. Describe a scenario and click "Design Game" — or click "Import Game File" to load a shared game

## Sharing games

- **Export:** From any game screen, click the **Export** button in the header to download a `.json` file
- **Import:** On the home screen, click **Import Game File** to load a `.json` file
- Games are also auto-saved in the browser (IndexedDB) and persist across sessions

## Optional: restrict your API key

If you want to share a pre-configured key with judges instead of having them create their own, lock it down:

1. Go to https://aistudio.google.com/apikey
2. Click on your key → Edit
3. Under **Application restrictions**, select **HTTP referrers**
4. Add your Cloud Run domain: `https://drama-engine-XXXX-uc.a.run.app/*`
5. Save

This ensures the key only works from your deployed app.

## Cleanup

To avoid charges when you're done:

```bash
# Delete the service
gcloud run services delete drama-engine --region us-central1

# Or delete the entire project
gcloud projects delete drama-engine-demo
```

## Troubleshooting

**Build fails with "npm ci" error:**
Make sure `package-lock.json` exists and is committed. Run `npm install` locally first if needed.

**"Permission denied" on deploy:**
Ensure billing is linked and the required APIs are enabled (Step 2).

**App loads but API calls fail:**
Check that the API key is valid and has access to Gemini models. Test it at https://aistudio.google.com.

**Region selection:**
`us-central1` is cheapest and closest to Google's AI APIs. Change it if you need a different region for latency reasons.
