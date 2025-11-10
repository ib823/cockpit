# Keystone

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
- **Performance Optimizations**: Redis caching (40x speedup), virtual scrolling, code splitting

## Performance

The application includes comprehensive performance optimizations:

- **Redis Caching Layer**: Stale-while-revalidate pattern for 90%+ query reduction
- **React Query**: Client-side caching with 5-minute stale time
- **Database Connection Pooling**: Optimized Prisma client with query monitoring
- **Virtual Scrolling**: Efficient rendering of 10,000+ items
- **Code Splitting**: Automatic lazy loading of large components
- **Edge Caching**: Service worker with cache-first strategies

See `docs/performance/PERFORMANCE_OPTIMIZATION_SUMMARY.md` for detailed documentation.

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

### Quick Testing

For local development testing:

```bash
# Create test users (admin@test.com / Admin123!, user@test.com / User123!)
pnpm tsx scripts/create-test-admin.ts

# Generate magic link tokens for passkey registration
pnpm tsx scripts/create-email-approvals.ts
```

See `docs/testing/TEST_CREDENTIALS.md` for complete testing guide.

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
│   ├── cache/            # Redis & memory caching layer
│   ├── db.ts             # Prisma client singleton with query monitoring
│   └── react-query.ts    # Client-side caching configuration
├── middleware.ts          # Edge middleware (auth, rate limiting, security headers)
├── stores/               # Zustand stores
└── types/                # TypeScript type definitions

docs/                      # Organized documentation
├── developer/            # Developer guides and codebase overview
├── authentication/       # Auth setup and security guides
├── deployment/           # Deployment checklists and configurations
├── testing/             # Testing guides and credentials
├── features/            # Feature-specific documentation
├── performance/         # Performance optimization guides
└── architecture/        # System architecture documentation

prisma/
└── schema.prisma         # Database schema

scripts/                  # Utility scripts
├── create-test-admin.ts # Create test users
└── rotate-secrets.ts    # Secret rotation utility
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

## Documentation

All documentation is organized in the `/docs` directory:

- **Getting Started**: `docs/developer/QUICK_START_GUIDE.md`
- **Authentication Setup**: `docs/authentication/PASSKEY_AUTH_SETUP.md`
- **Deployment Guide**: `docs/deployment/VERCEL_DEPLOY_CHECKLIST.md`
- **Testing Guide**: `docs/testing/TEST_CREDENTIALS.md`
- **Performance Guide**: `docs/performance/PERFORMANCE_OPTIMIZATION_SUMMARY.md`
- **Architecture**: `docs/architecture/COMPREHENSIVE_SOLUTION_OVERVIEW.md`

## Contributing

See `SECURITY.md` for vulnerability disclosure policy and security guidelines.

## License

Proprietary - Internal tool for SAP implementations
