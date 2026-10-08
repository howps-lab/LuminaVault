# Lumina Vault — Supabase Cloud Photo Storage & Gallery

A modern, responsive, and secure photo upload application powered by **Supabase Auth**, **Supabase Storage**, and **Supabase PostgreSQL**.

---

## 🚀 Features

- **Authentication**: Email & password signup and login via Supabase Auth.
- **Multi-Photo Upload**: Drag-and-drop or file browser with live image previews and dimension extraction ($W \times H$).
- **Collision-Safe Storage**: Images uploaded to private Supabase Storage bucket `photos` using `{user_id}/{uuid}-{sanitizedName}`.
- **Private Bucket & Signed URLs**: Media is never publicly exposed; time-limited signed URLs are generated via Supabase Storage API.
- **Postgres Metadata**: Stores file path, file name, size, MIME type, dimensions, and timestamps.
- **Strict Row Level Security (RLS)**: Users can only read, write, update, and delete their own photos.
- **Orphan File Cleanup**: Automatically deletes uploaded storage files if the database metadata insertion fails.
- **Synchronized Deletion**: Deleting a photo permanently deletes both the file in Supabase Storage and its database record in PostgreSQL.
- **Interactive Lightbox Viewer**: High-resolution viewer with previous/next navigation, keyboard controls (`←`, `→`, `Esc`), metadata drawer, and direct download.
- **Gallery Controls**: Real-time search by filename and sorting (Newest, Oldest, Largest, Smallest, Name).
- **Interactive In-App Supabase Setup**: Test connection, input keys dynamically, and copy SQL migration directly from the UI.
- **Instant Demo Mode**: Test all gallery, lightbox, and upload interactions immediately in-browser.

---

## 📦 Supabase Setup Instructions

### Step 1: Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create or open your project.
2. Note your **Project URL** and **anon public key** from **Project Settings → API**.

### Step 2: Run the Database & Storage Migration
1. In your Supabase Dashboard, click on **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Copy the entire contents of `supabase/schema.sql` (or copy directly from the in-app "Database & RLS" dialog) and paste it into the editor.
4. Click **Run**.

This migration script will:
- Create the `photos` table with foreign key to `auth.users(id) ON DELETE CASCADE`.
- Add performance indexes on `user_id` and `created_at`.
- Enable Row Level Security (RLS) on `photos` with strict isolation policies.
- Create the private `photos` storage bucket (10MB file limit, restricted to image MIME types).
- Configure storage access policies on `storage.objects` so users can only access their own `{user_id}/` folder.

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:

```env
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
```

*Note: You can also click the "Database & RLS" or "Supabase (Status)" button in the top navigation bar within the web application to input your credentials and test the connection live without restarting.*

---

## 🛡️ Security Architecture

| Layer | Policy / Mechanism |
|---|---|
| **Database RLS** | `auth.uid() = user_id` for SELECT, INSERT, UPDATE, DELETE |
| **Storage Isolation** | `auth.uid()::text = (storage.foldername(name))[1]` for all storage operations |
| **Storage Privacy** | Bucket `photos` is private (`public: false`); accessed exclusively via signed URLs |
| **Credential Safety** | Frontend uses `anon` public key only; service-role key is never exposed |
| **Orphan Prevention** | Catches PostgreSQL transaction failures and rolls back Storage file uploads |
