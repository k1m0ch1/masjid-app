# Release Guide

## Overview

This project uses GitHub Actions to automatically build APK from PWA when you push a version tag.

**Workflow:** Push Tag → Build APK → Create GitHub Release → Attach APK

---

## Frontend Release

### Prerequisites

1. **PWA must be deployed** to production first
   - Deploy to: `https://masjid.daaralihsan.com`
   - Via Cloudflare Pages or manual deployment

2. **GitHub Secrets** (optional, not needed for APK build)
   - APK generation uses production URL
   - See `GITHUB_SECRETS.md` if building frontend in CI

### Quick Release (Recommended)

```bash
# 1. Commit your changes
git add -A
git commit -m "feat: new feature xyz"

# 2. Deploy PWA to production (Cloudflare Pages)
cd frontend
npm run deploy  # or your deployment method

# 3. Create and push tag
git tag frontend-v1.0.1
git push origin main
git push origin frontend-v1.0.1
```

**GitHub Action will automatically:**
- ✅ Generate APK from production PWA
- ✅ Create GitHub Release
- ✅ Attach APK file (`masjid-app-v1.0.1.apk`)
- ✅ Upload artifact for download

### Manual Release (Alternative)

If you need to manually trigger APK build:

1. Go to: **Actions** tab
2. Select: **Build APK** workflow
3. Click: **Run workflow**
4. Enter version number (e.g., `1.0.1`)
5. Click: **Run workflow**

This will build APK without creating a release.

### Download APK

After workflow completes:

1. Go to: **Releases** tab
2. Click on version (e.g., `Frontend v1.0.1`)
3. Download: `masjid-app-v1.0.1.apk`
4. Install on Android device

---

## Important Notes

### APK Generation Process

The workflow uses `sharadcodes/pwa-to-apk-action` which:
1. Fetches your PWA manifest from production URL
2. Generates Android APK from the PWA
3. Uses Trusted Web Activity (TWA) wrapper
4. Signs APK automatically

**No keystore needed!** APK is generated for testing/distribution.

For **Play Store release**, you may need to:
1. Download APK from GitHub release
2. Re-sign with your keystore (if required)
3. Upload to Play Console

### Version Format

- **Major**: `frontend-v2.0.0` - Breaking changes
- **Minor**: `frontend-v1.1.0` - New features
- **Patch**: `frontend-v1.0.1` - Bug fixes

### Examples

```bash
# Bug fix release
git tag frontend-v1.0.1
git push origin frontend-v1.0.1

# New feature release
git tag frontend-v1.1.0
git push origin frontend-v1.1.0

# Major version
git tag frontend-v2.0.0
git push origin frontend-v2.0.0
```

### Troubleshooting

**APK build failed?**
- Check if PWA is accessible: `https://masjid.daaralihsan.com`
- Verify manifest is valid: `https://masjid.daaralihsan.com/manifest.webmanifest`
- Check workflow logs in Actions tab

**APK won't install?**
- Enable "Install from unknown sources" on Android
- Or check if APK is corrupted

**APK installed but won't open?**
- Check PWA URL is accessible
- Verify SSL certificate is valid
- Check Android version compatibility

---

## Rollback

```bash
# Delete local tag
git tag -d frontend-v1.0.1

# Delete remote tag
git push --delete origin frontend-v1.0.1

# Delete GitHub release (manual via GitHub UI)
```

---

## Backend Release

TBD - Use similar pattern: `backend-v*.*.*`
