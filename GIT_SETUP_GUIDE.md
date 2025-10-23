# Git Repository Setup Guide

## ✅ Repository Initialized

Your HS Code Finder project is now a Git repository!

### Initial Commit
```
Commit: 956cea5 (HEAD -> master)
Files: 52 files changed, 11920 insertions
Message: Initial commit: HS Code Finder with Electron boilerplate
```

---

## 📦 What's Tracked

### Source Code
- React TypeScript components
- Electron main process and preload
- Services and hooks
- Type definitions

### Configuration
- package.json, tsconfig.json
- Vite configuration
- TypeScript build configs

### Documentation
- README files
- Setup guides
- API reference
- Implementation checklists
- Migration plans

### Data
- Sample HS codes (public/data/)
- Embedding examples

### Scripts
- Embedding generation scripts
- Sample data generators

---

## 📝 What's NOT Tracked (.gitignore)

✅ `node_modules/` - Dependencies (regenerated with npm install)  
✅ `dist/` - Build output  
✅ `.env` files - Secret keys and credentials  
✅ `package-lock.json` - Can be regenerated  
✅ IDE settings - `.vscode/`, `.idea/`  
✅ Logs - npm-debug.log, etc.  
✅ User data - userData directories  

---

## 🚀 Essential Git Commands

### Check Status
```powershell
git status
```
Shows modified files, staged changes, untracked files

### View Commit History
```powershell
git log                    # Full log
git log --oneline -10      # Last 10 commits, one line each
git log --graph --all      # Visual branch graph
```

### Make Changes
```powershell
git add <file>             # Stage specific file
git add .                  # Stage all changes
git commit -m "Message"    # Commit staged changes
```

### Branch Management
```powershell
git branch                 # List local branches
git branch <name>          # Create new branch
git checkout <branch>      # Switch branch
git checkout -b <name>     # Create and switch branch
```

### Sync with Remote
```powershell
git push origin master      # Push to GitHub
git pull origin master      # Pull from GitHub
git fetch                   # Download remote changes
```

---

## 🌳 Recommended Branch Strategy

### Main Branches
- **`master`** - Production-ready code
- **`develop`** - Development branch

### Feature Branches
Create for each phase:
- `feature/phase-1-setup`
- `feature/phase-2-integration`
- `feature/phase-3-features`
- `feature/phase-4-build`

### Example Workflow
```powershell
# Start Phase 1
git checkout -b feature/phase-1-setup

# Make changes
git add .
git commit -m "Phase 1: Setup dependencies and verify Electron"

# Finish feature
git checkout master
git merge feature/phase-1-setup
```

---

## 🔄 Workflow for This Project

### Phase 1: Setup
```powershell
git checkout -b feature/phase-1-setup
npm install
npm run dev
# Test that it works
git add .
git commit -m "Phase 1: Dependencies installed, Electron verified"
git checkout master
git merge feature/phase-1-setup
```

### Phase 2: Integration
```powershell
git checkout -b feature/phase-2-integration
# Update apiKeyManager.ts and other services
git add src/
git commit -m "Phase 2: Update services to use electronStorage"
git checkout master
git merge feature/phase-2-integration
```

### Phase 3: Features
```powershell
git checkout -b feature/phase-3-features
# Implement CSV import, history, export
git add src/
git commit -m "Phase 3: Add CSV import and search history"
git checkout master
git merge feature/phase-3-features
```

### Phase 4: Build & Package
```powershell
git checkout -b feature/phase-4-build
# Create icon, build production
npm run build
npm run dist:win
git add .
git commit -m "Phase 4: Production build and Windows packaging"
git tag v1.0.0
git checkout master
git merge feature/phase-4-build
```

---

## 🏷️ Version Tags

Create tags for releases:
```powershell
git tag v1.0.0-alpha          # Alpha release
git tag v1.0.0-beta           # Beta release
git tag v1.0.0                # Official release
git push origin v1.0.0         # Push tag to GitHub
```

---

## 📤 Setup GitHub Remote (Optional)

### Create GitHub Repository
1. Go to https://github.com/new
2. Name it: `hs-code-finder`
3. Don't initialize with README (already exists)
4. Click "Create repository"

### Connect Local to GitHub
```powershell
git remote add origin https://github.com/YOUR_USERNAME/hs-code-finder.git
git branch -M main
git push -u origin main
```

### Clone on Another Machine
```powershell
git clone https://github.com/YOUR_USERNAME/hs-code-finder.git
cd hs-code-finder
npm install
npm run dev
```

---

## 🔍 Useful Git Tricks

### Undo Last Commit (keep changes)
```powershell
git reset --soft HEAD~1
```

### Discard All Changes
```powershell
git reset --hard HEAD
```

### See What Changed in a Commit
```powershell
git show <commit-hash>
```

### Compare Branches
```powershell
git diff master develop
```

### Stash Changes Temporarily
```powershell
git stash                  # Save changes temporarily
git stash pop              # Apply stashed changes
git stash drop             # Discard stashed changes
```

---

## 📊 Git Configuration

### View Current Config
```powershell
git config --list
```

### Global Config (all projects)
```powershell
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

### Project Config (this project only)
```powershell
git config user.name "Project Name"
git config user.email "project@email.com"
```

Current config:
```
user.email = dev@hscodefinder.local
user.name = HS Code Finder Dev
```

---

## 🚫 Common Mistakes to Avoid

### ❌ Don't commit:
- `node_modules/` - Use `.gitignore`
- `.env` files - Use `.env.example` instead
- API keys - Use environment variables
- Build artifacts - Already in `.gitignore`
- IDE settings - User-specific, in `.gitignore`

### ✅ Do commit:
- Source code (.ts, .tsx, .js)
- Configuration (package.json, tsconfig.json)
- Documentation (.md files)
- Public data (public/data/)
- `.gitignore` and `.gitattributes`

### Good Commit Messages
```
✅ Good:
"Phase 1: Install dependencies and verify Electron app startup"
"Fix: Correct file path handling in electronStorage service"
"Add: CSV import functionality with validation"

❌ Bad:
"update"
"fixes"
"stuff"
"wip"
```

---

## 📈 Next Steps

### Now That Git Is Setup

1. **Start Phase 1**
   ```powershell
   git checkout -b feature/phase-1-setup
   npm install
   npm run dev
   ```

2. **Commit Your Progress**
   ```powershell
   git add .
   git commit -m "Phase 1: Setup and verification complete"
   ```

3. **Merge to Master**
   ```powershell
   git checkout master
   git merge feature/phase-1-setup
   ```

4. **Continue with Phases 2-5**

### Push to GitHub (Optional)
```powershell
git remote add origin https://github.com/YOUR_USERNAME/hs-code-finder.git
git push -u origin master
```

---

## 📚 Learning Resources

- **Git Basics**: https://git-scm.com/book/en/v2
- **Interactive Tutorial**: https://learngitbranching.js.org/
- **GitHub Guides**: https://guides.github.com/
- **Git Cheat Sheet**: https://github.github.com/training-kit/

---

## ✨ You're All Set!

Your project is now version controlled with Git. You can:
- ✅ Track changes over time
- ✅ Collaborate with others
- ✅ Revert to previous versions
- ✅ Branch for features
- ✅ Tag releases
- ✅ Publish to GitHub

**Next**: Start Phase 1 development and commit your progress! 🚀