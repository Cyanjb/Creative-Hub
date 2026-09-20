# Pushing the V1 app to GitHub

The app lives only at `C:\Users\cyanj\Creative Hub` and has never been pushed. One disk failure
loses it. This is the fix.

**Read the warning first. It is the only step that can do damage.**

---

## The warning

The app keeps API keys in a file called `.env`, and the Express proxy reads them from there. That
is the correct design and it is why the browser never sees a key.

**If `.env` gets committed and pushed, those keys are published.** Deleting the file afterwards
does not undo it, because git keeps history. The keys would have to be revoked and reissued on
Higgsfield, Runway, OpenArt and anywhere else.

The `.gitignore` at the root of this repo already blocks `.env`, `node_modules` and build output.
Step 3 below puts it in place before anything is committed, and step 5 is a check that it worked.
Do not skip step 5.

---

## The steps

Open PowerShell. Work through these in order.

### 1. Get a fresh copy of this repo

```powershell
cd C:\Users\cyanj
git clone https://github.com/Cyanjb/Creative-Hub.git Creative-Hub-repo
cd Creative-Hub-repo
```

You now have two folders side by side: `Creative Hub` (the app) and `Creative-Hub-repo` (this
repo). Nothing has been changed yet.

### 2. Make a branch

```powershell
git checkout -b add-v1-app
```

Working on a branch means nothing touches `main` until you are happy.

### 3. Copy the app in, without the junk

```powershell
robocopy "C:\Users\cyanj\Creative Hub" "C:\Users\cyanj\Creative-Hub-repo\app" /E /XD node_modules dist build .git .vite /XF .env
```

`/XD` excludes those folders. `/XF .env` excludes the secrets file. `robocopy` reports a number
at the end: anything under 8 means it worked.

### 4. Stage everything

```powershell
git add -A
```

### 5. CHECK BEFORE YOU COMMIT

```powershell
git status
```

**Read the list. If you see any of these, stop and ask before going further:**

- `.env` or anything starting with `.env`
- `node_modules`
- any file ending `.key` or `.pem`
- anything with "secret", "token" or "credential" in the name

To be sure, run this. It should print nothing at all:

```powershell
git diff --cached --name-only | Select-String -Pattern "\.env|node_modules|\.key$|\.pem$|secret"
```

**Nothing printed means you are safe to continue. Anything printed means stop.**

### 6. Commit and push

```powershell
git commit -m "Add the V1 Creative Hub app"
git push -u origin add-v1-app
```

### 7. Merge it

Open the repo on GitHub. It will offer to open a pull request for `add-v1-app`. Open it, look at
the file list one more time, and merge it into `main`.

---

## Afterwards

- **Check the app still runs** from its original folder. Nothing in these steps touched it, but
  confirm rather than assume.
- **Keep working in the original folder** for now, or switch to the repo copy and delete the
  original once you trust it. Do not edit both.
- **Your `.env` is still only on your machine.** That is correct. Write down somewhere safe which
  keys it holds, so it can be rebuilt if the disk dies. A password manager is the right place,
  not a document.
- **Update Craft doc 5.** The state table says the app is local only. Change that row, and tick
  the action item.

---

## If you would rather keep them separate

A second repository is a reasonable choice. The trade is that you then have two places to look,
which is the problem you are currently trying to solve. If you do it anyway:

```powershell
cd "C:\Users\cyanj\Creative Hub"
git init
copy C:\Users\cyanj\Creative-Hub-repo\.gitignore .
git add -A
git status          # same check as step 5, do not skip it
git commit -m "Initial commit of the V1 Creative Hub app"
```

Then create an empty repo on GitHub and follow the push instructions it gives you.

**One extra check in this case.** If that folder already has a `.git` folder from earlier
experiments, `.env` may already be in its history where a new `.gitignore` cannot reach it. Run:

```powershell
git log --all --oneline -- .env
```

Nothing printed means clean. Anything printed means the history holds the file, and the simplest
safe answer is to delete the `.git` folder and start the history fresh.
