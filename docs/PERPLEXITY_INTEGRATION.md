# Perplexity Job Search Integration

This integration allows you to fetch job data using Perplexity AI and store it into your `discovered_jobs` table.

## Features
- **Pull Mode**: Automatically triggers a Perplexity search (requires API Key).
- **Push Mode**: Accepts a JSON payload of jobs from an external source (e.g., Perplexity Manual Task + Intermediary).

## Setup

1. **Environment Variables**
   Ensure you have the following in your Supabase Edge Functions environment (or `.env` locally):
   ```
   PERPLEXITY_API_KEY=pplx-xxxxxxxx...
   ```

2. **Deploy Function**
   ```bash
   supabase functions deploy perplexity-search
   ```

## Usage

### Method 1: Automated Search (Pull)
Call the endpoint without a `jobs` payload to trigger the AI search.

**Request:**
```bash
curl -X POST https://[YOUR_REF].supabase.co/functions/v1/perplexity-search \
  -H "Authorization: Bearer [SUPABASE_ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{ "role": "Python / Django / AI" }'
```

**Perplexity Prompt Used:**
The function sends a specialized system prompt to Perplexity asking for a JSON array of remote jobs (Python, AI, etc.) from the last 10 days.

### Method 2: Direct Data Push (Push)
If you manually run a task in Perplexity or have another scraper, you can push the results directly.

**Request:**
```bash
curl -X POST https://[YOUR_REF].supabase.co/functions/v1/perplexity-search \
  -H "Authorization: Bearer [SUPABASE_ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "jobs": [
      {
        "title": "Senior Python Engineer",
        "company": "Tech Corp",
        "location": "Remote",
        "url": "https://example.com/job/123",
        "source": "Manual",
        "date_posted": "2024-01-01",
        "salary_range": "$120k - $160k",
        "technologies": ["Python", "Django"]
      }
    ]
  }'
```

## Database
Jobs are inserted into `discovered_jobs` with `onConflict: 'external_id'` to prevent duplicates.
