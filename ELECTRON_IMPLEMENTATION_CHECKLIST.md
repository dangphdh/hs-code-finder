# Electron Implementation Checklist

Use this checklist to track your progress as you implement the Electron desktop app.

## 📋 Phase 0: Preparation

- [ ] Read `ELECTRON_SETUP_GUIDE.md`
- [ ] Read `ELECTRON_INTEGRATION_GUIDE.md`
- [ ] Read `ELECTRON_BOILERPLATE_SUMMARY.md`
- [ ] Ensure Node.js 16+ is installed: `node --version`
- [ ] Backup your current code (git commit)

## 🚀 Phase 1: Setup (1-2 hours)

### Installation
- [ ] Run `npm install` to install all dependencies
- [ ] Verify Electron is installed: `npm ls electron`
- [ ] Verify electron-builder is installed: `npm ls electron-builder`

### Verify File Structure
- [ ] Check `electron/main.ts` exists
- [ ] Check `electron/preload.ts` exists
- [ ] Check `electron/tsconfig.json` exists
- [ ] Check `src/types/electron.ts` exists
- [ ] Check `src/hooks/useElectron.ts` exists
- [ ] Check `src/services/electronStorage.ts` exists
- [ ] Check `src/components/DesktopFeatures.tsx` exists

### Test Development Build
- [ ] Run `npm run dev`
- [ ] Electron app window should open
- [ ] DevTools should automatically open (Ctrl+Shift+I)
- [ ] Verify app loads React content
- [ ] Close app and server (Ctrl+C)

### Troubleshooting Phase 1
- [ ] If app doesn't start, check: `npm run dev:web` starts on port 5173
- [ ] If blank window, check DevTools console for errors
- [ ] If TypeScript errors, run: `npm run type-check`

---

## 🔌 Phase 2: Integration (2-4 hours)

### Update ApiKeyManager

**File**: `src/services/apiKeyManager.ts`

Current implementation uses `localStorage`. Update to support both:

```typescript
import { electronStorage } from './electronStorage';

export class ApiKeyManager {
  private storage = electronStorage; // Use electronStorage instead of localStorage
  
  async saveApiKey(provider: string, apiKey: string) {
    const encrypted = CryptoJS.AES.encrypt(apiKey, this.masterPassword).toString();
    await this.storage.setItem(`api-key-${provider}`, encrypted); // await added
  }
  
  async getApiKey(provider: string) {
    const encrypted = await this.storage.getItem(`api-key-${provider}`); // await added
    if (!encrypted) return null;
    return CryptoJS.AES.decrypt(encrypted, this.masterPassword).toString(CryptoJS.enc.Utf8);
  }
}
```

Tasks:
- [ ] Review current `ApiKeyManager.ts`
- [ ] Add `async/await` to methods
- [ ] Replace `localStorage` with `electronStorage`
- [ ] Test in web: `npm run dev:web`
- [ ] Test in desktop: `npm run dev`

### Update Other Services

**Files**: `src/services/vectorSearch.ts`, `src/services/fallbackSearch.ts`

- [ ] Check if they use `localStorage` directly
- [ ] If yes, replace with `electronStorage`
- [ ] Add `async/await` where needed

### Update Components

**Files**: `src/components/*.tsx`

- [ ] Check `ApiKeyManager.tsx` for `localStorage` usage
- [ ] Replace with `electronStorage` calls
- [ ] Handle promises with `async/await` or `.then()`

- [ ] Update `SearchForm.tsx` if needed
- [ ] Update `ResultsList.tsx` if needed

### Test Integration

- [ ] Run `npm run dev:web` - web version should work
- [ ] Run `npm run dev` - desktop version should work
- [ ] Verify API key storage works in both
- [ ] Verify search functionality works in both
- [ ] Check browser console (web) and DevTools (desktop) for errors

---

## ✨ Phase 3: New Features (4-8 hours)

### Feature 1: CSV Import

**File**: Update `src/components/DesktopFeatures.tsx`

Current code has placeholder. Enhance with:
- [ ] File dialog already works (use `useElectronDialogs`)
- [ ] Parse CSV content
- [ ] Validate HS code format
- [ ] Save to electronStorage
- [ ] Show import progress
- [ ] Handle errors

### Feature 2: Search History

**File**: Create `src/components/SearchHistory.tsx`

- [ ] Store searches in electronStorage
- [ ] Display last 10 searches
- [ ] Click to repeat search
- [ ] Delete individual searches
- [ ] Clear all history button

### Feature 3: Export Results

**File**: Update `src/components/ResultsList.tsx`

- [ ] Add "Export" button to results
- [ ] Support JSON and CSV formats
- [ ] Show save dialog
- [ ] Save file to user's location
- [ ] Show success message

### Feature 4: Offline Embeddings

- [ ] Pre-cache embeddings locally on first use
- [ ] Load from cache if available
- [ ] Show cache size
- [ ] Add "Clear Cache" button

### Test Features

- [ ] Test CSV import with sample file
- [ ] Test search history persists on app restart
- [ ] Test export creates valid JSON/CSV
- [ ] Test all in both web and desktop

---

## 🏗️ Phase 4: Build & Package (2-4 hours)

### Create App Icon

- [ ] Create 256x256 PNG image
- [ ] Save as `assets/icon.png`
- [ ] Ensure background transparency

### Production Build

- [ ] Run `npm run build` to compile everything
- [ ] Check `dist/` folder has both `index.html` and `electron/main.js`
- [ ] Run `npm run start` to test production build
- [ ] Verify app works without dev server

### Package for Windows

- [ ] Run `npm run dist:win`
- [ ] Wait for build to complete (first time may take 2-3 minutes)
- [ ] Check `dist/` for:
  - [ ] `HS Code Finder Setup 1.0.0.exe` (installer)
  - [ ] `HS Code Finder 1.0.0.exe` (portable)

### Test Installer

- [ ] Copy `HS Code Finder Setup 1.0.0.exe` to clean directory
- [ ] Double-click to run installer
- [ ] Choose installation location
- [ ] Let installer create shortcuts
- [ ] Launch app from Start Menu
- [ ] Test basic functionality
- [ ] Uninstall and verify cleanup

### Test Portable

- [ ] Copy `HS Code Finder 1.0.0.exe` to clean directory
- [ ] Double-click executable
- [ ] Verify app works
- [ ] Close app
- [ ] Verify app.asar created in same directory (app data storage)

---

## 📝 Phase 5: Documentation & Distribution

### Documentation

- [ ] Create user guide for desktop features
- [ ] Document keyboard shortcuts
- [ ] Create troubleshooting guide
- [ ] Add screenshots to README

### Distribution

- [ ] Create GitHub Release
- [ ] Upload both `.exe` files
- [ ] Add release notes
- [ ] Create download link

### Version Management

- [ ] Update version in `package.json`: `1.0.0`
- [ ] Create git tag: `git tag v1.0.0`
- [ ] Push to GitHub

---

## 🧪 Testing Checklist

### Web Version Testing
- [ ] Navigate to app URL
- [ ] Add API key
- [ ] Perform search
- [ ] View results
- [ ] API key persists on page reload
- [ ] Works on different browsers (Chrome, Firefox, Safari)

### Desktop Version Testing

**Startup**
- [ ] App starts quickly
- [ ] Windows taskbar shows icon
- [ ] App title shows "HS Code Finder"

**Core Functionality**
- [ ] API key manager works
- [ ] Can add/remove API keys
- [ ] Search functionality works
- [ ] Results display correctly

**Desktop Features**
- [ ] CSV import dialog opens
- [ ] Can select and import CSV
- [ ] Export button opens save dialog
- [ ] Can export to JSON and CSV

**File Operations**
- [ ] Files saved to AppData directory
- [ ] Files persist after restart
- [ ] Can view stored files in Explorer

**Performance**
- [ ] App starts in < 2 seconds
- [ ] Searches complete in < 3 seconds
- [ ] No memory leaks (check Task Manager)

**Error Handling**
- [ ] Shows error for invalid API key
- [ ] Shows error for failed import
- [ ] Shows error for network issues
- [ ] Errors are helpful and actionable

---

## 🐛 Debugging Guide

### DevTools Access

**Desktop**: Press `Ctrl+Shift+I` to open DevTools
- [ ] Console tab: Check for errors
- [ ] Network tab: Check IPC messages
- [ ] Storage tab: Verify files exist

### Check Logs

**View App Data Directory**
```powershell
explorer "$env:APPDATA\hs-code-finder"
```

- [ ] Check `storage/` folder for saved data
- [ ] Check file contents
- [ ] Delete files to reset state

### Common Issues

**App won't start**
- [ ] Check DevTools console: `npm run dev`
- [ ] Verify port 5173 available: `netstat -ano | findstr 5173`
- [ ] Check main.ts compilation: `npm run build:electron`

**File operations fail**
- [ ] Verify IPC channel names match
- [ ] Check file paths use forward slashes
- [ ] Verify userData directory exists
- [ ] Check file permissions

**Search doesn't work**
- [ ] Verify API key is set correctly
- [ ] Check API key format for provider
- [ ] Test API key independently
- [ ] Check internet connection

---

## ✅ Final Verification

Before considering implementation complete:

- [ ] Web version works at deployment URL
- [ ] Desktop installer works on clean Windows 10 machine
- [ ] Desktop portable exe works standalone
- [ ] Both versions persist data correctly
- [ ] Both versions handle errors gracefully
- [ ] Documentation is complete and accurate
- [ ] All known issues are logged
- [ ] Version number is consistent everywhere

---

## 📊 Progress Tracking

Track your overall progress:

**Phase 0**: `□ □ □ □ □` (5 tasks)
**Phase 1**: `□ □ □ □ □ □ □` (7 tasks)
**Phase 2**: `□ □ □ □ □ □ □ □` (8 tasks)
**Phase 3**: `□ □ □ □ □ □ □ □` (8 tasks)
**Phase 4**: `□ □ □ □ □ □ □ □` (8 tasks)
**Phase 5**: `□ □ □ □ □ □` (6 tasks)
**Testing**: `□ □ □ □ □ □ □ □ □ □ □ □` (12 tasks)

**Total**: 54 tasks to complete full implementation

---

## 🎉 Completion

Once all checkboxes are checked:

1. ✅ You have a working Electron desktop app
2. ✅ You have a working web version
3. ✅ Both are production-ready
4. ✅ Both are distributable
5. ✅ You have an installer for users
6. ✅ You have complete documentation

**Estimated Total Time**: 10-18 hours

**Next Milestones**:
- [ ] Release v1.0.0 officially
- [ ] Collect user feedback
- [ ] Plan v1.1.0 features
- [ ] Implement auto-update system
- [ ] Add SQLite database (optional Phase 4)