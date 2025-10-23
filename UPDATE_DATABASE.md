# Update Database Connection - Step by Step Guide

## Current Status
❌ Your Neon database is unreachable. You need new credentials.

## Steps to Fix

### 1. Go to Neon Dashboard
Visit: https://console.neon.tech

- Log in to your account
- Check if project `ep-noisy-term-a171r0le` exists
- If deleted/missing, create a NEW project

### 2. Get Connection Strings

In your Neon project dashboard:

1. Click on **"Connection Details"** or **"Connection String"**
2. You'll see something like:

```
Pooled Connection:
postgresql://username:password@ep-xxx-yyy.region.aws.neon.tech/dbname?sslmode=require

Direct Connection:
postgresql://username:password@ep-xxx-yyy.region.aws.neon.tech/dbname?sslmode=require
```

### 3. Update .env File

Open `/workspaces/cockpit/.env` and replace these lines:

**Find these OLD lines:**
```env
DATABASE_URL="postgresql://neondb_owner:npg_FgOv1WMr2jcb@ep-noisy-term-a171r0le-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:npg_FgOv1WMr2jcb@ep-noisy-term-a171r0le.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

**Replace with NEW credentials from Neon:**
```env
DATABASE_URL="YOUR_POOLED_CONNECTION_STRING_HERE"
DATABASE_URL_UNPOOLED="YOUR_DIRECT_CONNECTION_STRING_HERE"
```

### 4. Initialize Database

After updating .env, run:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to new database
npx prisma db push

# Test connection
npx tsx scripts/test-db-connection.ts
```

### 5. Seed Database (Optional)

If you have seed data:
```bash
npx prisma db seed
```

## Alternative: Use Local PostgreSQL

If you don't want to use Neon, you can use a local PostgreSQL database:

```bash
# Install PostgreSQL (in Codespace)
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo service postgresql start

# Create database
sudo -u postgres createdb cockpit_dev

# Update .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cockpit_dev"
DATABASE_URL_UNPOOLED="postgresql://postgres:postgres@localhost:5432/cockpit_dev"

# Initialize
npx prisma db push
```

## Need Help?

Run the test script to verify connection:
```bash
npx tsx scripts/test-db-connection.ts
```

If successful, you'll see:
✅ Connection successful!
📊 Database contains X users
