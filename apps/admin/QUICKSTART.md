# Admin Panel Quick Start Guide

Follow these steps to set up and run the admin panel for managing your 5 tenants.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# From project root
pnpm install
```

### 2. Seed the 5 Tenants

```bash
# From project root
cd packages/database
pnpm db:seed
```

This will create:

- JB Interior Curtains (slug: `jb-interior-curtains`)
- Aluminium Doors and Windows (slug: `aluminium-doors-windows`)
- SMart Wholesale Mart (slug: `smart-wholesale-mart`)
- WhatsApp Business 1 (slug: `whatsapp-business-1`)
- WhatsApp Business 2 (slug: `whatsapp-business-2`)

### 3. Start the Backend API

```bash
# From project root
cd apps/api
pnpm dev
```

API will run on **http://localhost:4000**

### 4. Start the Admin Panel

```bash
# From project root
cd apps/admin
pnpm dev
```

Admin panel will run on **http://localhost:3001**

### 5. Login

- Open http://localhost:3001/login
- Enter password: `admin123`
- Click "Sign In"

## 📋 What You Can Do

Once logged in, you can:

1. **Dashboard** - View overview of all tenants and leads
2. **Tenants** - Create, edit, delete tenants (manage all 5 businesses)
3. **Leads** - View and filter leads across all tenants
4. **Analytics** - See performance metrics and conversion rates

## 🔧 Troubleshooting

**Can't see tenants?**

- Make sure you ran `pnpm db:seed` in packages/database
- Check that the API is running on port 4000

**Authentication not working?**

- Clear browser localStorage
- Refresh the page and try logging in again

**Port already in use?**

- Admin uses port 3001 (web app uses 3000)
- API uses port 4000
- Close any processes using these ports

## 📱 Testing with Web App

To test a tenant's public page:

1. Start the web app: `cd apps/web && pnpm dev`
2. Visit: http://localhost:3000/jb-interior-curtains
3. Fill out the lead form to test lead capture
4. Check admin panel to see the new lead appear

## Next Steps

- Add more tenants via the admin panel
- Customize tenant slugs and domains
- Monitor lead conversion rates in analytics
- Export lead data for follow-up

---

**Need help?** Check the full README.md for detailed documentation.
