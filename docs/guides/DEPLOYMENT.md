# Deployment Guide

## Overview

HS Code Finder is a static web application that can be deployed to any CDN or static hosting service. No server-side infrastructure is required.

## Deployment Options

### 1. Vercel (Recommended)

**Advantages**: Free tier, automatic deployments, edge functions, analytics

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Configure environment (optional)
# Create vercel.json:
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "headers": [
    {
      "source": "/data/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 2. Netlify

**Advantages**: Free tier, continuous deployment from Git, form handling

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist

# Or connect Git repository for automatic deployments
netlify init
```

**netlify.toml**:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/data/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.json"
  [headers.values]
    Content-Encoding = "gzip"
```

### 3. GitHub Pages

**Advantages**: Free, integrated with GitHub

```bash
# Build
npm run build

# Push dist/ to gh-pages branch
npm install -D gh-pages

# Add to package.json:
"deploy": "npm run build && gh-pages -d dist"

# Deploy
npm run deploy
```

Update `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/hs-code-finder/',  // your repo name
  // ... rest of config
})
```

### 4. AWS S3 + CloudFront

**Advantages**: Scalable, global CDN, custom domain

```bash
# Install AWS CLI
pip install awscli

# Build
npm run build

# Create S3 bucket
aws s3 mb s3://my-hs-code-finder

# Upload build files
aws s3 sync dist/ s3://my-hs-code-finder --delete

# Create CloudFront distribution
# Use AWS Console or AWS CDK
```

### 5. Azure Static Web Apps

**Advantages**: Azure ecosystem integration, serverless functions

```bash
# Install Azure CLI
# az login

# Create static web app
az staticwebapp create \
  --name hs-code-finder \
  --resource-group mygroup \
  --source . \
  --location eastus \
  --branch main \
  --app-location "." \
  --output-location "dist" \
  --app-build-command "npm run build"
```

### 6. Self-Hosted (Nginx/Apache)

```bash
# Build
npm run build

# Copy dist/ to web server
scp -r dist/* user@server:/var/www/hs-code-finder/

# Nginx configuration
server {
    listen 80;
    server_name hs-code-finder.com;
    
    root /var/www/hs-code-finder;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
    
    # Cache data files
    location /data/ {
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Pre-deployment Checklist

- [ ] Generate embeddings for at least one provider
  ```bash
  python scripts/generate-embeddings-openai.py
  ```

- [ ] Build application
  ```bash
  npm run build
  ```

- [ ] Test locally
  ```bash
  npm run preview
  ```

- [ ] Verify embedding files are included
  ```bash
  ls -lah public/data/*/
  ```

- [ ] Check build size
  ```bash
  npm run build && du -sh dist/
  ```

- [ ] Review .gitignore (especially `public/data/embeddings/`)

## Post-deployment Tasks

1. **Cache Configuration**
   - Embedding files: 1 year (immutable)
   - Bundle files: 1 year with integrity check
   - HTML: max 1 hour or no-cache

2. **CORS Headers** (if needed)
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, HEAD, OPTIONS
   ```

3. **Security Headers**
   ```
   X-Content-Type-Options: nosniff
   X-Frame-Options: SAMEORIGIN
   X-XSS-Protection: 1; mode=block
   Referrer-Policy: strict-origin-when-cross-origin
   ```

4. **Monitoring**
   - Set up error tracking (Sentry, Rollbar)
   - Monitor API usage (OpenAI, Cohere)
   - Track user analytics

5. **Domain Setup**
   - Add custom domain
   - Enable HTTPS/SSL
   - Configure DNS records

## Performance Optimization

### Build Size Reduction

```bash
# Analyze bundle
npm install -D rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from "rollup-plugin-visualizer"

plugins: [
  visualizer()
]

# Build and open stats.html
npm run build
open dist/stats.html
```

### Gzip Compression

Most hosting platforms automatically gzip `.js`, `.css`, `.json` files.

Enable Brotli compression for better compression:
```bash
# Netlify/Vercel automatically support Brotli
# For self-hosted, ensure server compression enabled
```

### Code Splitting

Already configured in `vite.config.ts`:
```typescript
output: {
  manualChunks: {
    'embedding-providers': [...],
    'vector-search': [...],
    'crypto': [...]
  }
}
```

This ensures:
- Unused providers not downloaded initially
- Parallel downloads of chunks
- Better caching

### Lazy Loading Data

```typescript
// Already implemented in services
// Embeddings loaded on-demand when provider selected
```

## Environment Variables

Create `.env.production` for production builds:

```env
# API endpoints (if using custom backend)
VITE_API_BASE=https://api.example.com

# Feature flags
VITE_ENABLE_BATCH_SEARCH=true
VITE_ENABLE_HISTORY=true

# Analytics
VITE_ANALYTICS_ID=G-XXXXX

# Default provider
VITE_DEFAULT_PROVIDER=openai-small
VITE_MAX_RESULTS=20
```

## Monitoring & Analytics

### Error Tracking
```typescript
// Add to App.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production"
});
```

### Usage Analytics
```typescript
// Track searches
gtag('event', 'search', {
  search_term: query,
  provider: selectedProvider,
  result_count: results.length
});
```

## Scaling Considerations

Current architecture scales horizontally:
- No server state to sync
- Each user completely independent
- Can handle unlimited concurrent users
- CDN handles traffic distribution

### Embedding File Size Management

For large HS code datasets:
1. Split embeddings by chapter
2. Load on-demand when user selects chapter filter
3. Use compression (gzip/brotli)
4. Consider quantizing embeddings (int8 vs float32)

## Backup & Recovery

- Store embeddings in version control (after generation)
- Backup generation scripts and raw HS codes data
- Document API key requirements
- Maintain changelog for data updates

## Updating Embeddings

```bash
# When HS codes data updates:
1. Update public/data/hs-codes-basic.json
2. Regenerate embeddings for all providers
3. Deploy new embedding files
4. No code changes needed
```

## Troubleshooting Deployments

### Embeddings not loading
```
✓ Check file paths in public/data/
✓ Verify CORS headers if loading from external CDN
✓ Check browser Network tab for 404 errors
```

### High latency on first search
```
✓ Embeddings file loading - expected ~2-5MB download
✓ Use CDN for distribution
✓ Consider splitting embeddings by provider
```

### API key issues
```
✓ Clear browser cache/localStorage
✓ Verify API key is valid for selected provider
✓ Check rate limits haven't been exceeded
```

## Support Resources

- Deployment docs: https://vitejs.dev/guide/static-deploy.html
- Vercel: https://vercel.com/docs
- Netlify: https://docs.netlify.com/
- AWS: https://docs.aws.amazon.com/
- Azure: https://learn.microsoft.com/en-us/azure/static-web-apps/