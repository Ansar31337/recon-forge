# recon-forge

**CSC 4182 — Advanced Web Technologies** — Final Project

Multi-Source Passive Subdomain Intelligence and Attack Surface Discovery Platform

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Dependency Injection Pattern](#dependency-injection-pattern)
4. [Modules](#modules)
5. [API Endpoints](#api-endpoints)
6. [Entity Model](#entity-model)
7. [Scan Pipeline](#scan-pipeline)
8. [User Roles](#user-roles)
9. [Setup](#setup)
10. [Team](#team)

---

## Overview

recon-forge is a full-stack web application that performs passive subdomain intelligence gathering and attack surface discovery. It implements a two-phase scanning pipeline with role-based access control, configurable scan modules, and enterprise-grade CVE matching.

The system supports three user roles:

- **Superadmin** — manages users, credits, and system-wide settings
- **Enterprise** — full scanning capabilities including IP/CIDR/CVE
- **Regular** — domain/subdomain scanning with limited scope

---

## Architecture

```
Frontend (Next.js 15 App Router + Tailwind CSS)
    ↓ Axios
API Routes (Next.js Route Handlers)
    ↓ TypeORM Repository
PostgreSQL 18
    │
    └── Data Flow:
        1. Frontend sends request via Axios
        2. Route handler validates auth + role + ownership
        3. TypeORM repository executes query
        4. PostgreSQL returns result
        5. Sanitized response returned to frontend
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS (dark cyan-glow theme) |
| Database | PostgreSQL 18 |
| ORM | TypeORM (synchronize: true) |
| Auth | JWT in HTTP-only cookie, bcryptjs |
| HTTP Client | Axios |
| Port Scanner | Node.js `net.Socket` (no nmap) |
| Passive Recon | IPTHC API (download endpoint) |
| CVE Source | NVD API 2.0 |

---

## Dependency Injection Pattern

This project follows a layered architecture that mirrors dependency injection principles:

| Pattern | Implementation |
|---------|---------------|
| **Intra-Module** | Route handler depends on feature function within same module (e.g., `requireUser` used inside auth routes) |
| **Inter-Module** | Scan route depends on credit service via `resolveLimit()` and `checkAndConsume()` — cross-module injection through imports |
| **Service Layer** | Feature files (`features/auth/`, `features/scans/`, `features/credits/`) act as injectable services consumed by route handlers |

### Module Dependency Graph

```
app/api/auth/*        → features/auth/* (self-contained)
app/api/admin/*       → features/auth/requireUser
app/api/scans/*       → features/scans/* + features/credits/creditService
app/api/credits/me    → features/credits/creditService
app/api/messages      → features/messages/messageService
```

---

## Modules

### Auth Module (`app/api/auth/*`)
- `signup` — Create user with bcrypt hashing, inactive by default
- `login` — Password verification, JWT signing, HTTP-only cookie
- `me` — Cookie + JWT verification, PostgreSQL reload
- `logout` — Cookie clearance
- `forgot-password` — PasswordResetRequest creation
- `change-password` — Old password verification, new password hashing

### Admin Module (`app/api/admin/*`)
- `users` — CRUD operations, activation, role changes
- `credits` — Role default and per-user credit limit management
- `scans` — Cross-user scan viewing and cancellation
- `messages` — Support/upgrade message viewing and admin replies
- `password-reset-requests` — Password reset approval and execution
- `stats` — Aggregate system statistics (12 real-time counters)

### Scan Module (`app/api/scans/*`)
- Phase 1 — Subdomain discovery (PostgreSQL + IPTHC)
- Phase 2 — Selected subdomain scanning with 9 configurable modules

### Credit Module (`app/api/credits/me`)
- Daily scan limit tracking
- Monthly host download limit tracking
- User override resolution

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create new user (enterprise or regular) |
| POST | `/api/auth/login` | Authenticate and set JWT cookie |
| GET | `/api/auth/me` | Get current authenticated user |
| POST | `/api/auth/logout` | Clear authentication cookie |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/change-password` | Change authenticated user's password |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create new user |
| PATCH | `/api/admin/users/[id]` | Update user (activate/role) |
| DELETE | `/api/admin/users/[id]` | Delete user |
| POST | `/api/admin/users/[id]/reset-password` | Reset user password |
| GET | `/api/admin/credits` | Get credit defaults |
| PATCH | `/api/admin/credits` | Update credit defaults/overrides |
| GET | `/api/admin/scans` | List all scans with user info |
| POST | `/api/admin/scans/[id]/cancel` | Cancel running scan |
| GET | `/api/admin/messages` | List all support/upgrade messages |
| POST | `/api/admin/messages/[id]/reply` | Reply to message |
| GET | `/api/admin/stats` | Get system statistics |
| GET | `/api/admin/password-reset-requests` | List reset requests |
| PATCH | `/api/admin/password-reset-requests/[id]` | Update reset request |

### Scans

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scans` | List authenticated user's scans |
| POST | `/api/scans` | Create new scan (Phase 1 + auto Phase 2) |
| GET | `/api/scans/[id]` | Get scan detail with paginated results |
| POST | `/api/scans/[id]/cancel` | Cancel own running scan |
| POST | `/api/scans/[id]/run-selected` | Run Phase 2 on selected subdomains |
| GET | `/api/scans/[id]/progress` | Get scan progress events |
| GET | `/api/scans/[id]/export` | Export scan results (JSON/CSV/TXT) |
| GET | `/api/scans/[id]/subdomains-download` | Download host/subdomains |
| DELETE | `/api/scans/[id]` | Delete single scan |
| DELETE | `/api/scans/history` | Delete all user scans |

### Credits & Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/credits/me` | Get current user's credit usage |
| GET | `/api/messages` | Get user's messages |
| POST | `/api/messages` | Send support/upgrade message |

---

## Entity Model

The system uses 13 TypeORM entities synchronized with PostgreSQL:

| Entity | Table | Key Columns |
|--------|-------|-------------|
| `User` | `users` | id, name, email (unique), passwordHash, role, isActive |
| `RoleCreditDefault` | `role_credit_default` | role, dailyScanLimit, maxCrawlDepth, cveEnabled, monthlySubdomainDownloadLimit |
| `UserCreditOverride` | `user_credit_override` | userId, dailyScanLimit, maxCrawlDepth, cveEnabled, monthlySubdomainDownloadLimit |
| `ApiUsageLog` | `api_usage_log` | userId, scanId, action, creditsUsed, rowsUsed |
| `Scan` | `scans` | userId, inputMode, inputType, targetValue, status, 9 module toggles, cveEnabled |
| `Target` | `targets` | scanId, type, value, source |
| `ScanProgressEvent` | `scan_progress_events` | scanId, phase, message, percent, level |
| `HostResult` | `host_results` | scanId, host, displayTitle, pageTitle, ipAddress, statusCode, openPorts (jsonb), DNS records (jsonb) |
| `TechFingerprint` | `tech_fingerprints` | hostResultId, name, version, source, confidence |
| `Endpoint` | `endpoints` | hostResultId, url, path, method, statusCode, depth, keptByUro |
| `CveMatch` | `cve_matches` | hostResultId, techFingerprintId, cveId, severity, score, summary |
| `SupportMessage` | `support_messages` | fromUserId, category, subject, body, status, adminReply |
| `PasswordResetRequest` | `password_reset_requests` | email, userId, status, message, handledAt |

---

## Scan Pipeline

### Phase 1 — Discovery

```
POST /api/scans
  │
  ├─ Parse input (single target or TXT upload)
  ├─ Save Target rows
  ├─ Subdomain Discovery:
  │   ├─ Load existing subdomains from PostgreSQL
  │   └─ IPTHC subdomain lookup (download endpoint)
  ├─ Merge and deduplicate
  └─ Save HostResult rows
       │
       └─ If discoverOnly = true → status = "completed"
       └─ If discoverOnly = false → auto-run Phase 2
```

### Phase 2 — Module Execution

```
Auto Phase 2 (or POST /api/scans/[id]/run-selected)
  │
  ├─ DNS Helper (A, AAAA, CNAME, MX, NS, TXT)
  ├─ HTTP/HTTPS Probe + Website Title Extraction
  ├─ Port Scan (Node.js net.Socket, top100 or top1000)
  ├─ Technology Detection (Manual + Wappalyzer + WAF)
  ├─ Endpoint Crawler (60s per-host timeout, same-domain only)
  ├─ URO Filter (URL deduplication, normalization)
  └─ CVE Matching (NVD API 2.0, Enterprise only)
       │
       └─ Save results → status = "completed"
```

### Scan Module Toggles

Each scan stores its own module configuration:

| Toggle | Default | Enterprise | Regular |
|--------|---------|------------|---------|
| Subdomain Discovery | true | Visible | Visible |
| IPTHC Subdomain Lookup | true | Visible | Visible |
| DNS Helper | true | Visible | Visible |
| HTTP/HTTPS Probe | true | Visible | Visible |
| Website Title Extraction | true | Visible | Visible |
| Port Scan | true | top100 / top1000 | top100 only |
| Technology Detection | true | Visible | Visible |
| Endpoint Crawler | true | Visible | Visible |
| CVE Matching | false | Visible | Hidden |

---

## User Roles

### Superadmin
- User management (activate, deactivate, role change, delete)
- Credit limit configuration (role defaults + user overrides)
- Cross-user scan viewing and cancellation
- Support/upgrade message management with reply
- Password reset request handling
- System statistics dashboard (12 real-time counters)

### Enterprise (Company)
- Domain, subdomain, IP, and CIDR target scanning
- TXT bulk upload with mixed target types
- IPTHC subdomain, reverse IP, and CIDR lookups
- Top 100 and Top 1000 port scanning
- CVE matching from technology fingerprint version
- Selected subdomain scanning with 9 configurable modules
- Export with section selection (hosts, endpoints, tech, ports, DNS, WAF, CVE)
- Host/subdomain download (1,000,000 monthly limit)

### Regular (Hunter)
- Domain and subdomain target scanning only
- TXT upload with domain/subdomain targets only
- IPTHC subdomain lookup only (no reverse IP/CIDR)
- Top 100 port scanning only
- No CVE matching
- Support and upgrade request messaging
- Host/subdomain download (10,000 monthly limit)

---

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 18

### Database

```bash
psql -U postgres
```

```sql
CREATE DATABASE "recon-forge";
```

### Install

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

### Seed Data

The seed script creates:

- **Superadmin** user with full access
- **Enterprise** user with Company-level access
- **Regular** user with Hunter-level access
- **Credit defaults** for all three roles
- **Sample scan results** with host data, technologies, endpoints, and CVE matches

### Verification

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
SELECT email, role, "isActive" FROM "users";
SELECT role, "dailyScanLimit", "maxCrawlDepth", "cveEnabled", "monthlySubdomainDownloadLimit" FROM "role_credit_default";
```

---

## Project Structure

```
recon-forge/                                                    (157 source files)
│
├── .env.example                                  Ansar      Config template — DB, JWT, IPTHC, PortScan, Crawler
├── middleware.ts                                 Ansar      Role-based route protection and redirects
├── next.config.js                                Ansar      Next.js config
├── next-env.d.ts                                 Shared     Next.js TypeScript environment declarations
├── package.json                                  Shared     Dependencies and scripts
├── postcss.config.js                             Shared     PostCSS config for Tailwind
├── README.md                                     Shared     Setup, architecture, roles, psql verification
├── tailwind.config.ts                            Abdullah   Cyan-glow navy theme and custom shadows
├── tsconfig.json                                 Shared     TypeScript decorators, strict mode, path aliases
│
├── public/                                       Shared
│   └── wappalyzer-tech.json                      Shuvro     Technology detection reference data
│
├── scripts/                                      Ansar
│   └── seed.ts                                   Ansar      Create Superadmin, role defaults, demo users
│
├── lib/                                          Ansar
│   ├── data-source.ts                            Ansar      TypeORM DataSource with PostgreSQL and 13 entities
│   ├── db.ts                                     Ansar      Database singleton connection
│   ├── api-response.ts                           Ansar      Standard API success/error helpers
│   └── utils.ts                                  Shared     csvEscape, safeFilename, allowed field helpers
│
├── entities/                                     Shared     13 TypeORM entities
│   ├── User.ts                                   Ansar      User, role, passwordHash, active status
│   ├── RoleCreditDefault.ts                      Ansar      Default limits per role
│   ├── UserCreditOverride.ts                     Ansar      Per-user credit override
│   ├── ApiUsageLog.ts                            Shared     Usage logs for credits/download/export
│   ├── PasswordResetRequest.ts                   Ansar      Password reset request workflow
│   ├── Scan.ts                                   Shuvro     Scan status, input, module toggles
│   ├── Target.ts                                 Shuvro     Scan targets from manual/TXT input
│   ├── ScanProgressEvent.ts                      Shuvro     Scan progress timeline
│   ├── HostResult.ts                             Shared     Host, DNS, title, ports, selected scan fields
│   ├── TechFingerprint.ts                        Shuvro     Technology detection result
│   ├── Endpoint.ts                               Shuvro     Crawled endpoint result
│   ├── CveMatch.ts                               Shuvro     Enterprise CVE result
│   └── SupportMessage.ts                         Abdullah   Support and upgrade messages
│
├── features/
│   ├── auth/                                     Ansar
│   │   ├── jwt.ts                                Ansar      JWT sign/verify and cookie logic
│   │   ├── password.ts                           Ansar      bcrypt hash and compare
│   │   ├── requireUser.ts                        Ansar      Cookie, JWT, PostgreSQL active user check
│   │   ├── requireRole.ts                        Ansar      Role guard helper
│   │   └── sanitizeUser.ts                       Ansar      Remove passwordHash before response
│   │
│   ├── credits/                                  Ansar
│   │   └── creditService.ts                      Ansar      Role defaults, overrides, daily/monthly usage
│   │
│   ├── scans/                                    Shuvro
│   │   ├── scanValidation.ts                     Shuvro     Input, role, module toggle validation
│   │   ├── targetParser.ts                       Shuvro     Single/TXT target parser
│   │   ├── titleExtractor.ts                     Shuvro     displayTitle and detectedType generation
│   │   ├── runScanPipeline.ts                    Shuvro     Main scan pipeline with module toggles
│   │   ├── dnsHelper.ts                          Shuvro     DNS resolver
│   │   ├── ipThcLookup.ts                        Shuvro     IPTHC subdomain, reverse IP, CIDR lookup
│   │   ├── probe.ts                              Shuvro     HTTP/HTTPS probe and page title extraction
│   │   ├── portScan.ts                           Shuvro     Node net.Socket port scanner
│   │   ├── techDetect.ts                         Shuvro     Manual, Wappalyzer tech, WAF detection
│   │   ├── crawler.ts                            Shuvro     60s per-host same-host endpoint crawler
│   │   ├── uroFilter.ts                          Shuvro     URL deduplication and filtering
│   │   ├── cveMatch.ts                           Shuvro     Enterprise CVE matching
│   │   ├── cidrExpand.ts                         Shuvro     CIDR expansion helper
│   │   └── exportScan.ts                         Shuvro     JSON/CSV/TXT export with section filtering
│   │
│   └── messages/                                 Abdullah
│       └── messageService.ts                     Abdullah   Support and upgrade message logic
│
├── components/
│   ├── ui/                                       Shared
│   │   ├── Button.tsx                            Ansar      Button variants and loading state
│   │   ├── Input.tsx                             Ansar      Dark input with label and error
│   │   ├── Modal.tsx                             Ansar      Confirmation and form modal
│   │   ├── Table.tsx                             Ansar      Responsive data table
│   │   ├── Card.tsx                              Abdullah   Cyan-glow card wrapper
│   │   ├── Toast.tsx                             Abdullah   Toast messages
│   │   └── Badge.tsx                             Abdullah   Status badges
│   │
│   ├── layout/                                   Ansar
│   │   ├── Sidebar.tsx                           Ansar      Role-based navigation
│   │   ├── TopBar.tsx                            Ansar      Dashboard header
│   │   └── UserMenu.tsx                          Ansar      User role, email, logout
│   │
│   ├── auth/                                     Ansar
│   │   ├── LoginForm.tsx                         Ansar      Login with remember-me
│   │   ├── SignupForm.tsx                        Ansar      Enterprise/Regular signup
│   │   ├── ForgotPasswordForm.tsx                Ansar      Password reset request
│   │   └── ChangePasswordForm.tsx                Ansar      Change password form
│   │
│   ├── admin/                                    Ansar
│   │   ├── UserTable.tsx                         Ansar      User CRUD table
│   │   ├── AddUserModal.tsx                      Ansar      Add user modal
│   │   ├── CreditTable.tsx                       Ansar      Role defaults and overrides
│   │   └── MessageTable.tsx                      Ansar      Admin message table
│   │
│   ├── scans/                                    Shared
│   │   ├── ScanForm.tsx                          Shuvro     Enterprise scan form
│   │   ├── BasicScanForm.tsx                     Abdullah   Regular/Hunter scan form
│   │   ├── SubdomainSelectionPanel.tsx           Shuvro     Select subdomains and run modules
│   │   ├── ProgressRibbon.tsx                    Shuvro     Scan progress display
│   │   ├── HostCard.tsx                          Shared     Host result card
│   │   ├── TechCard.tsx                          Shuvro     Technology result card
│   │   ├── WafBadge.tsx                          Shuvro     WAF/CDN badge
│   │   ├── EndpointList.tsx                      Shuvro     Crawled endpoint table
│   │   ├── CveCard.tsx                           Shuvro     Enterprise CVE card
│   │   └── ExportPanel.tsx                       Shared     Export and download controls
│   │
│   └── messages/                                 Abdullah
│       ├── SupportForm.tsx                       Abdullah   Support/upgrade form
│       └── MessageThread.tsx                     Abdullah   User messages and admin replies
│
├── app/
│   ├── layout.tsx                                Ansar      Root layout
│   ├── globals.css                               Abdullah   Cyan-glow dark global styles
│   ├── page.tsx                                  Abdullah   Public home page
│   ├── login/page.tsx                            Ansar      Login page
│   ├── signup/page.tsx                           Ansar      Signup page
│   ├── forgot-password/page.tsx                  Ansar      Forgot password page
│   ├── change-password/page.tsx                  Ansar      Change password page
│   │
│   ├── super-admin/                              Ansar
│   │   ├── layout.tsx                            Ansar      Superadmin layout
│   │   ├── page.tsx                              Ansar      Superadmin stats dashboard
│   │   ├── users/page.tsx                        Ansar      User CRUD
│   │   ├── credits/page.tsx                      Ansar      Credit management
│   │   ├── scans/page.tsx                        Ansar      All scans and cancel action
│   │   ├── messages/page.tsx                     Ansar      Messages and replies
│   │   └── password-reset/page.tsx               Ansar      Password reset request handling
│   │
│   ├── dashboard/                                Shuvro
│   │   ├── layout.tsx                            Shuvro     Enterprise layout
│   │   ├── page.tsx                              Shuvro     Enterprise dashboard
│   │   ├── new-scan/page.tsx                     Shuvro     Enterprise scan creation
│   │   ├── scans/page.tsx                        Shuvro     Enterprise scan history
│   │   ├── scans/[id]/page.tsx                   Shuvro     Enterprise scan detail, CVE, export
│   │   ├── credits/page.tsx                      Shuvro     Enterprise usage/credits
│   │   └── support/page.tsx                      Shuvro     Enterprise support
│   │
│   ├── regular/                                  Abdullah
│   │   ├── layout.tsx                            Abdullah   Regular/Hunter layout
│   │   ├── page.tsx                              Abdullah   Regular dashboard
│   │   ├── new-scan/page.tsx                     Abdullah   Basic scan creation
│   │   ├── scans/page.tsx                        Abdullah   Regular scan history
│   │   ├── scans/[id]/page.tsx                   Abdullah   Regular scan detail without CVE
│   │   ├── credits/page.tsx                      Abdullah   Regular usage/credits
│   │   └── account/page.tsx                      Abdullah   Account, support, upgrade request
│   │
│   └── api/
│       ├── auth/                                 Ansar
│       │   ├── signup/route.ts                   Ansar      Create inactive user
│       │   ├── login/route.ts                    Ansar      Login, JWT cookie
│       │   ├── me/route.ts                       Ansar      Current user from PostgreSQL
│       │   ├── logout/route.ts                   Ansar      Clear cookie
│       │   ├── forgot-password/route.ts          Ansar      Create reset request
│       │   └── change-password/route.ts          Ansar      Change own password
│       │
│       ├── admin/                                Ansar
│       │   ├── users/route.ts                    Ansar      List/create users
│       │   ├── users/[id]/route.ts               Ansar      Update/delete user
│       │   ├── users/[id]/reset-password/route.ts Ansar     Reset user password
│       │   ├── credits/route.ts                  Ansar      Credit defaults/overrides
│       │   ├── stats/route.ts                    Ansar      Superadmin stats
│       │   ├── scans/route.ts                    Ansar      All scans
│       │   ├── scans/[id]/cancel/route.ts        Ansar      Cancel any scan
│       │   ├── messages/route.ts                 Ansar      All messages
│       │   ├── messages/[id]/reply/route.ts      Ansar      Admin reply
│       │   ├── password-reset-requests/route.ts   Ansar      Reset request list
│       │   └── password-reset-requests/[id]/route.ts Ansar  Handle reset request
│       │
│       ├── scans/                                Shuvro
│       │   ├── route.ts                          Shuvro     Phase 1 scan discovery, own scan list
│       │   ├── [id]/route.ts                     Shuvro     Scan detail with pagination and counts
│       │   ├── [id]/progress/route.ts            Shuvro     Progress events
│       │   ├── [id]/cancel/route.ts              Shuvro     Cancel own scan
│       │   ├── [id]/export/route.ts              Shuvro     Export sections
│       │   ├── [id]/run-selected/route.ts         Shuvro     Phase 2 selected subdomain scan
│       │   ├── [id]/subdomains-download/route.ts  Shuvro     Host/subdomain download
│       │   └── history/route.ts                  Shuvro     Delete all own scan history
│       │
│       ├── credits/me/route.ts                   Shared     Current user credit summary
│       └── messages/route.ts                     Abdullah   User messages and admin replies
│
└── .gitignore                                     Shared     Node, Next.js, env, IDE
```

---

## License

This project is for academic purposes.
