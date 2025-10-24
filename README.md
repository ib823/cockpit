# SAP Implementation Cockpit

Enterprise-grade project management platform for SAP implementations with WebAuthn authentication, role-based access control, and advanced timeline visualization.

## Tech Stack

- **Framework**: Next.js 15.5 (App Router)
- **Runtime**: React 19.1
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS + Ant Design + Custom UI Components
- **State Management**: Zustand 5.0
- **Database**: PostgreSQL + Prisma ORM 6.16
- **Authentication**: NextAuth 4.24 + WebAuthn (Passkeys)
- **Password Hashing**: bcryptjs
- **Email**: Resend
- **Rate Limiting**: Upstash Redis (production) / In-memory (development)
- **Testing**: Vitest + @testing-library/react
- **Package Manager**: pnpm 10.x

## Features

- **Multi-mode Workflow**: Capture → Decide → Plan → Present
- **WebAuthn/Passkeys**: Passwordless authentication with biometric support
- **Role-Based Access Control**: USER, MANAGER, ADMIN roles with audit logging
- **Timeline Visualization**: Gantt-style project timelines with critical path analysis
- **Export Options**: Excel, PDF, PowerPoint exports
- **Security Hardening**: CSRF protection, rate limiting, security headers (CSP, HSTS)
- **Real-time Updates**: React Query with optimistic updates
- **Responsive Design**: Mobile-first UI with desktop optimization

## Getting Started

### Prerequisites

- Node.js 20+ (specified in `.nvmrc`)
- pnpm 10.x
- PostgreSQL database

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file and configure
cp .env.example .env.local
# Edit .env.local with your database credentials and secrets

# Set up database
pnpm prisma db push

# Run development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Variables

See `.env.example` for all required and optional environment variables. Critical variables:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Minimum 32 characters for JWT signing
- `NEXTAUTH_URL`: Application URL (http://localhost:3000 for dev)

### Available Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm typecheck        # Run TypeScript type checking
pnpm test             # Run unit tests
pnpm test:coverage    # Run tests with coverage
pnpm format           # Format code with Prettier
pnpm format:check     # Check code formatting
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # REST API endpoints
│   ├── project/           # Main application routes (capture, decide, plan, present)
│   ├── admin/             # Admin dashboard (ADMIN role only)
│   └── _components/       # Page-level components
├── components/            # Shared React components
├── lib/                   # Core utilities and configuration
│   ├── auth.ts           # NextAuth configuration
│   ├── nextauth-helpers.ts # Session management helpers
│   ├── db.ts             # Prisma client singleton
│   └── env.ts            # Environment validation (Zod)
├── middleware.ts          # Edge middleware (auth, rate limiting, security headers)
├── stores/               # Zustand stores
└── types/                # TypeScript type definitions

prisma/
└── schema.prisma         # Database schema
```

## Authentication Flow

1. **WebAuthn/Passkeys** (primary): Biometric authentication using platform authenticators
2. **Magic Links** (fallback): Email-based passwordless authentication
3. **Password Login** (legacy): Bcrypt-hashed passwords for backward compatibility

All authentication methods create NextAuth JWT sessions stored in secure HTTP-only cookies.

## Security Features

- **Rate Limiting**: 60 requests/minute globally, 5 login attempts per 5 minutes
- **CSRF Protection**: SameSite cookies + NextAuth CSRF tokens
- **Security Headers**: CSP, X-Frame-Options, HSTS (production)
- **SQL Injection Protection**: Parameterized queries via Prisma
- **XSS Protection**: React automatic escaping + DOMPurify for HTML
- **Audit Logging**: All admin access and security events logged to database

## Database Schema

Key models:
- `User`: Authentication and user profiles
- `Project`: SAP implementation projects
- `Phase`: Project phases (design, build, deploy)
- `Milestone`: Phase milestones with dates and status
- `Dependency`: Cross-project dependencies
- `AuditEvent`: Security audit trail

See `prisma/schema.prisma` for complete schema.

## Deployment

### Vercel (Recommended)

1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker

```bash
docker build -t cockpit .
docker run -p 3000:3000 --env-file .env.local cockpit
```

### Environment Requirements

- **Database**: PostgreSQL 14+ (Neon, Supabase, or self-hosted)
- **Redis**: Upstash Redis for rate limiting (production only)
- **Email**: Resend API key for transactional emails

## Contributing

See `SECURITY.md` for vulnerability disclosure policy and security guidelines.

## License

Proprietary - Internal SAP implementation tool

<!-- Auto-deployment test 2025-10-24-00-00-18 -->
