# How to Update Secrets in Vercel - Step by Step

## Step 1: Go to Your Vercel Dashboard

1. Open: **https://vercel.com**
2. Log in to your account
3. Find your project: **cockpit** (or whatever your project is named)
4. Click on the project to open it

## Step 2: Navigate to Environment Variables

From your project dashboard:

```
Project → Settings (gear icon) → Environment Variables
```

**Exact path:**
1. Look at the top navigation bar
2. Click **"Settings"** tab (it has a gear icon ⚙️)
3. In the left sidebar, click **"Environment Variables"**

## Step 3: Update Each Secret

You'll see a list of environment variables. For each secret below:

### A. Find the Variable
- Scroll through the list or use the search box
- Look for the variable name (e.g., `NEXTAUTH_SECRET`)

### B. Edit It
- Click the **3-dot menu** (⋯) on the right side
- Select **"Edit"**
- Delete the old value
- Paste the new value (see below)
- Click **"Save"**

### C. Select Environments
Make sure it's checked for:
- ✅ **Production**
- ✅ **Preview** (optional)
- ✅ **Development** (optional)

---

## 🔐 New Secret Values to Copy

### 1. NEXTAUTH_SECRET
```
WqukjPDbeNi2fLO9gJlDFZxYAOAsAChL/rUup2iF9pU=
```

### 2. NEXT_PUBLIC_VAPID_PUBLIC_KEY
```
BMZ2SNpLpGmAHfqJTEIzjTZScG5ZxsCOAdBlxeJ6yJ-ry6WAaR0IxB_uzVmKGrtItqaIgLBDatPGD3kcMxIkr60
```

### 3. VAPID_PRIVATE_KEY
```
bYsWdXua81umWE6a9Ik5hT-ni89ZM7a7gkSlOVySaZs
```

---

## Step 4: Redeploy Your Application

After updating all secrets:

1. Go to **"Deployments"** tab
2. Find the latest deployment
3. Click the **3-dot menu** (⋯)
4. Select **"Redeploy"**
5. Check ✅ **"Use existing Build Cache"** (optional, makes it faster)
6. Click **"Redeploy"**

---

## Alternative: Direct Link

Try this direct link (replace with your team/project name):
```
https://vercel.com/[your-team-name]/cockpit/settings/environment-variables
```

Based on your .env file, it looks like your team is: **ikmals-projects-4ec38ef0**

So try:
```
https://vercel.com/ikmals-projects-4ec38ef0/cockpit/settings/environment-variables
```

---

## Troubleshooting

### "I don't see the Settings tab"
- Make sure you're in the **project view**, not the team/dashboard view
- Click on your project name first, then look for Settings

### "I can't edit the variables"
- You need **admin/owner permissions** on the project
- Ask the project owner to give you access

### "The variable doesn't exist"
- Click **"Add New"** button at the top right
- Enter the variable name
- Paste the value
- Select environments
- Click "Save"

---

## Visual Guide

```
Vercel Dashboard
    └── Your Projects
        └── cockpit (click here)
            └── Settings ⚙️ (top navigation)
                └── Environment Variables (left sidebar)
                    └── [List of variables]
                        └── NEXTAUTH_SECRET (click ⋯)
                            └── Edit
                                └── Paste new value
                                └── Save
```

---

## After Updating

✅ All secrets updated
✅ Redeployment triggered
⏰ Wait 2-3 minutes for deployment to complete
🎉 New secrets are live!

**Important:** Users will need to log in again after the new NEXTAUTH_SECRET is deployed.
