# Mahi Handcraft — Production-Ready E-Commerce Platform

Mahi Handcraft is a database-driven e-commerce application built using **React**, **TypeScript**, and **Vite** on the frontend, integrating seamlessly with **Firebase** (Hosting, Auth, Firestore, Storage) as a serverless backend.

The storefront is styled with custom warm artisan design aesthetics, featuring serif typography, terracotta accents, natural fiber imagery, and smooth UX transitions.

---

## 🛠️ Technology Stack

* **Frontend Framework**: React 19 (TypeScript)
* **Build Bundler**: Vite 8
* **Styling**: Vanilla CSS (Artisan design system variables)
* **Backend Database & Storage**: Cloud Firestore & Firebase Storage
* **Authentication**: Firebase Authentication
* **Hosting**: Firebase Hosting (SPA rewrites enabled)
* **Icons**: Lucide React

---

## 📁 Key File Structure

```text
src/
├── assets/          # Static logos and boilerplate assets
├── components/      # Reusable UI elements (Icons, badges)
├── context/         # AuthContext and CartContext (with Auth / Cart logic)
├── layouts/         # StoreLayout (Announcements, Search, Navigation) and AdminLayout (Sidebar controls)
├── lib/             # Firebase SDK client initializer
├── pages/           # Storefront pages (Home, Shop, Details, Cart, Checkout, Profile) & Admin Console
├── services/        # Service layer (Firestore transactions, file uploads)
├── types/           # Core TypeScript declarations
├── App.tsx          # Router configuration table
├── index.css        # Global CSS variables & layout utilities
└── main.tsx         # Document React mount point
```

---

## ⚡ Setup & Local Development

### 1. Installation
Install the project dependencies using npm:
```bash
npm install
```

### 2. Configure Firebase Environment Variables
Create a file named `.env.local` in the root of your project (this file is excluded from git in `.gitignore`). Copy the keys from `.env.example` and paste your actual Firebase Project config details:
```ini
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Launch Development Server
To launch Vite's hot-reload local development server:
```bash
npm run dev
```
Open the provided local URL (typically `http://localhost:5173`) in your web browser.

---

## 🛡️ Step-by-Step Initial Admin Account Setup

To secure the platform, **all** public registrations default to the `CUSTOMER` role. Promoting the initial account to an administrator must be done securely via the Firebase Console:

1. Launch the local development server and navigate to `/login`.
2. Register a new account under **Create Account** using your admin email.
3. Upon registration, your profile is created under `CUSTOMER` permissions, and you are redirected to the customer portal `/account`.
4. Open the [Firebase Console](https://console.firebase.google.com/) for your project.
5. In the left navigation, select **Firestore Database**.
6. Find the **`users`** collection.
7. Click the document whose ID matches your user UID (which is shown in Auth or on the profile document).
8. Edit the field **`role`**, changing it from `"CUSTOMER"` to **`"ADMIN"`**.
9. Click **Update** to save the changes in Firestore.
10. Log out of the e-commerce website and log back in.
11. You will now see the **Admin** link in the navigation header, and the `/admin` portal will be fully accessible.

---

## 🌱 Seeding Demo Products

Once your admin account has been promoted:
1. Navigate to the **Admin Portal** `/admin`.
2. On the **Dashboard**, click the **Seed Demo Products** button under the database utilities card.
3. The platform will automatically seed the collections with three artisan categories (Handbags, Home Accessories, Traditional Items) and five high-quality initial products (e.g. *Multicolor Ruffled Hand Fan*, *Artisan Market Tote*) complete with high-resolution imagery and default stock levels.
4. The seed operation is idempotent; it checks for existing slugs before writing to prevent duplicate entries.

---

## 🚀 Building & Deploying to Firebase Hosting

Vite compiles code into a highly optimized, minified Single Page Application bundle stored inside the `dist/` folder. This is served securely by Firebase Hosting.

### 1. Initialize Firebase CLI (If running first time)
If you haven't logged in or initialized Firebase in this folder, run:
```bash
npx firebase login
npx firebase use --add your-project-id
```

### 2. Deploy rules and hosting
Build the application and deploy hosting and rules to Firebase:
```bash
# Compile and build production assets
npm run build

# Deploy Hosting, Firestore rules, Storage rules, and Indexes
npx firebase deploy
```

If you only want to deploy frontend changes (without updating database security rules):
```bash
npm run build
npx firebase deploy --only hosting
```

---

## 🔒 Security Architecture Highlights

* **Pricing Trust Boundaries**: Checkout calculations do **not** trust client prices. The order creation service fetches current product documents inside a Firestore transaction to compute totals, verifying quantities, stock availability, and prices authoritatively on the database server.
* **Concurrency Protection**: Inventory updates utilize Firestore Transactions to prevent race-condition overselling. If two checkouts occur simultaneously, the second check is queued and re-read before decrementing.
* **Role-Based Security**: Handled natively by `/firestore.rules` and `/storage.rules`. Even if a user inspects JavaScript or bypasses routes, they cannot write, modify, or delete products, categories, settings, or other users' orders without matching Firebase Auth claims.
