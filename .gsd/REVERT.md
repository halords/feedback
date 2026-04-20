# REVERT.md — Emergency Reversion Procedure

> [!IMPORTANT]
> Use this procedure ONLY if the new "Read Optimization" logic (Replacements) is critically broken and you need to restore the original stable logic immediately.

## Step 1: Restoration Command
Run the following command in your terminal to replace the experimental `src` logic with the frozen `legacyV2` snapshot:

```powershell
# 1. Remove the experimental src folder
Remove-Item -Recurse -Force src

# 2. Move the legacyV2 snapshot back to src
Move-Item src/legacyV2 src

# 3. Cleanup redundant sidebar links (Optional)
# This will require manual update of src/components/layout/Shell.tsx
```

## Step 2: Verification
1. Restart the dev server: `npm run dev`
2. Access the dashboard via the standard root path: `/dashboard`
3. Verify that all Firestore reads are functioning as they were before the optimization project started.

## Step 3: Notify Antigravity
Once reverted, inform the AI:
"I have executed REVERT.md. Please re-analyze the failures and suggest a safer approach."
