# Phase 2 Integration Plan

**Objective**: Convert services to use `electronStorage` async API for both web and Electron support.

## Changes Required

### 1. ApiKeyManager - Convert to Async ✅ TODO

**Current**: Static methods with localStorage (synchronous)

**Changes**:
- Convert all methods to async
- Replace localStorage with electronStorage
- Keep same public interface (just async)

**Methods to update**:
- `saveApiKey(provider, apiKey)` → async
- `getApiKey(provider)` → async  
- `removeApiKey(provider)` → async
- `getAllProviders()` → async
- `hasApiKey(provider)` → async
- `clearAll()` → async

### 2. useHSCodeSearch Hook - Add Async/Await ✅ TODO

**Current**: Uses synchronous ApiKeyManager methods

**Changes**:
- Make search function async
- Update to use async ApiKeyManager
- Handle promises correctly

### 3. useEmbeddingProviders Hook - Add Async ✅ TODO

**Current**: Uses synchronous ApiKeyManager

**Changes**:
- Update to use async ApiKeyManager
- Add useEffect for loading

### 4. ApiKeyManager UI Component - Update Calls ✅ TODO

**File**: `src/components/ApiKeyManager.tsx`

**Changes**:
- Add await to saveApiKey calls
- Add await to deleteApiKey calls
- Handle promises

## Implementation Order

1. **Update ApiKeyManager.ts** (convert to async)
2. **Update useHSCodeSearch.ts** (add await/async)
3. **Update useEmbeddingProviders.ts** (add await/async)
4. **Update ApiKeyManager.tsx** (add await to calls)
5. **Test** (web + Electron)
6. **Commit** (with test results)

## Testing Strategy

### Web Testing
```powershell
npm run dev:web
# Open http://localhost:5173
# Test API key save/load
# Test search functionality
```

### Desktop Testing
```powershell
npm run dev
# Verify Electron window opens
# Test API key persistence
# Test search in desktop app
```

## Expected Outcomes

✅ Services work in both web and Electron  
✅ API keys persist in Electron filesystem  
✅ API keys persist in browser localStorage  
✅ Fallback search works in both  
✅ No TypeScript errors  
✅ Build passes  

## Time Estimate

- ApiKeyManager conversion: 10 min
- Hook updates: 10 min
- Component updates: 5 min
- Testing: 10 min
- Commit: 2 min
- **Total: ~35 minutes**
