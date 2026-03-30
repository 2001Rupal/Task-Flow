# Deploying TaskFlow Pro for Free

Stack: MongoDB Atlas (DB) → Render (backend) → Vercel (frontend) → Cloudinary (files)

---

## Step 1 — MongoDB Atlas (database)

1. Go to https://cloud.mongodb.com and create a free account
2. Create a free **M0** cluster (512 MB, always free)
3. Under **Database Access** → Add a user with a strong password
4. Under **Network Access** → Add IP `0.0.0.0/0` (allow all — needed for Render)
5. Click **Connect** → **Drivers** → copy the connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/taskflow-pro?retryWrites=true&w=majority
   ```
   Save this — you'll need it in Step 2.

---

## Step 2 — Cloudinary (file storage)

1. Go to https://cloudinary.com and create a free account (25 GB free)
2. From the Dashboard, copy:
   - **Cloud name**
   - **API Key**
   - **API Secret**
3. Save these — you'll need them in Step 3.

---

## Step 3 — Render (backend)

1. Push your code to GitHub (the whole `TestProject/` folder)
2. Go to https://render.com → New → **Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Root Directory**: `TestProject/backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Add these **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `MONGODB_URI` | *(from Step 1)* |
   | `JWT_SECRET` | *(any long random string)* |
   | `JWT_EXPIRATION` | `24h` |
   | `EMAIL_HOST` | `smtp.gmail.com` |
   | `EMAIL_PORT` | `587` |
   | `EMAIL_USER` | *(your Gmail)* |
   | `EMAIL_PASSWORD` | *(Gmail App Password)* |
   | `CLOUDINARY_CLOUD_NAME` | *(from Step 2)* |
   | `CLOUDINARY_API_KEY` | *(from Step 2)* |
   | `CLOUDINARY_API_SECRET` | *(from Step 2)* |
   | `APP_URL` | *(your Vercel URL — fill in after Step 4)* |
   | `FRONTEND_URL` | *(your Vercel URL — fill in after Step 4)* |

6. Click **Deploy**. Once done, copy your Render URL:
   ```
   https://taskflow-pro-backend.onrender.com
   ```

> **Note**: Free Render instances spin down after 15 min of inactivity and take ~30s to wake up on first request. This is normal on the free tier.

---

## Step 4 — Vercel (frontend)

1. Go to https://vercel.com → New Project → import your GitHub repo
2. Settings:
   - **Root Directory**: `TestProject/frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add this **Environment Variable**:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://taskflow-pro-backend.onrender.com/api` |

4. Click **Deploy**. Copy your Vercel URL:
   ```
   https://taskflow-pro.vercel.app
   ```

---

## Step 5 — Update backend URLs

Go back to Render → your service → **Environment** and update:
- `APP_URL` → `https://taskflow-pro.vercel.app`
- `FRONTEND_URL` → `https://taskflow-pro.vercel.app`

Then click **Manual Deploy** → **Deploy latest commit**.

---

## Done

Your app is live at your Vercel URL. Total cost: **$0**.

### Free tier limits
| Service | Limit |
|---------|-------|
| MongoDB Atlas | 512 MB storage |
| Render | 750 hrs/month, sleeps after 15 min idle |
| Vercel | 100 GB bandwidth/month |
| Cloudinary | 25 GB storage, 25 GB bandwidth/month |
