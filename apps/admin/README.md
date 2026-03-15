# Admin Panel - Multi-Tenant SaaS

Admin panel for managing all tenants and leads in the multi-tenant SaaS application.

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Database (if not done)

```bash
cd ../../packages/database
pnpm prisma migrate dev
pnpm prisma db seed  # Seeds the 5 tenants
```

### 3. Start the Admin Panel

```bash
cd apps/admin
pnpm dev
```

The admin panel will run on **http://localhost:3001**

### 4. Login

- Navigate to http://localhost:3001/login
- Default password: `admin123`
- (Change this via `ADMIN_PASSWORD` environment variable)

## Features

### 📊 Dashboard

- Overview of all tenants and leads
- Global statistics (total tenants, leads, conversion rate)
- Quick access to tenant details

### 🏢 Tenant Management

- View all tenants in a table
- Create new tenants
- Edit existing tenants (name, slug, domain)
- Delete tenants (with confirmation)
- Full CRUD operations

### 📝 Leads Management

- View leads across all tenants
- Filter leads by specific tenant
- See lead status (Open, Follow-Up, Converted, Lost)
- Lead statistics by status
- View lead contact information

### 📈 Analytics

- Performance metrics across all tenants
- Tenant-wise conversion tracking
- Lead pipeline visualization
- Conversion rate progress bars

## The 5 Tenants

1. **JB Interior Curtains** - Interior design and curtains business
2. **Aluminium Doors and Windows** - Construction materials supplier
3. **SMart Wholesale Mart** - Wholesale distribution
4. **WhatsApp Business 1** - TBD business type
5. **WhatsApp Business 2** - TBD business type

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Variables + Inline Styles
- **Icons**: Lucide React
- **Authentication**: Simple password-based (localStorage)
- **API**: REST API (http://localhost:4000)

## Project Structure

```
apps/admin/
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx          # Dashboard layout with sidebar
│   │   ├── page.tsx             # Dashboard overview
│   │   ├── tenants/
│   │   │   └── page.tsx         # Tenant CRUD interface
│   │   ├── leads/
│   │   │   └── page.tsx         # Leads management
│   │   └── analytics/
│   │       └── page.tsx         # Analytics dashboard
│   ├── login/
│   │   └── page.tsx             # Login page
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/
│   └── require-auth.tsx         # Auth guard component
├── lib/
│   ├── auth.ts                  # Authentication utilities
│   └── api-client.ts            # API client for backend
├── package.json
├── tsconfig.json
└── next.config.js
```

## API Endpoints Used

The admin panel communicates with the backend API:

- `GET /api/tenants` - List all tenants
- `POST /api/tenants` - Create a tenant
- `PUT /api/tenants/:id` - Update a tenant
- `DELETE /api/tenants/:id` - Delete a tenant
- `GET /api/tenants/:id/leads` - Get leads for a tenant

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API=http://localhost:4000
ADMIN_PASSWORD=admin123
```

## Development Notes

- The admin panel is a separate Next.js app running on port 3001
- The web app runs on port 3000
- The API runs on port 4000
- Authentication is stored in localStorage (upgrade to sessions/JWT later)
- CSS warnings are disabled in project settings

## Future Enhancements

- [ ] Role-based access control (Super Admin, Tenant Admin)
- [ ] JWT-based authentication
- [ ] Tenant-specific analytics charts
- [ ] Lead import/export functionality
- [ ] Email templates management
- [ ] Webhook configuration
- [ ] Activity logs and audit trail
- [ ] API rate limiting dashboard
