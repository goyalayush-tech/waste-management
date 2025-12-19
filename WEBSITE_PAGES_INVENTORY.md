# Website Pages & Routes Inventory

**Last Updated**: December 19, 2025

---

## 📍 Website Structure Overview

Your website has a multi-layered routing structure with public pages, authentication pages, and application pages.

---

## 🏠 Public Pages (No Authentication Required)

### 1. **Landing Page** (`/`)
- **Route**: `/` or `/landing`
- **Component**: `ClaimCleanLandingPage.tsx`
- **Purpose**: Main entry point with hero section, feature overview, CTA buttons
- **Features**:
  - Hero section with gradient background
  - Feature cards
  - Call-to-action buttons (Sign In / Create Account)
  - Navigation to login/signup

---

## 🔐 Authentication Pages (Public, No Auth Required)

### 2. **Login Page** (`/auth/login`)
- **Route**: `/auth/login`
- **Component**: `LoginPage.tsx`
- **Purpose**: User login with email/password
- **Features**:
  - Email and password form
  - Remember me checkbox
  - Forgot password link
  - Social login options (Google, LinkedIn)
  - Link to signup page

### 3. **Signup Page** (`/auth/signup`)
- **Route**: `/auth/signup`
- **Component**: `SignupPage.tsx`
- **Purpose**: New user registration
- **Features**:
  - Full name, email, phone inputs
  - Company and role selection
  - Password with confirmation
  - Terms & conditions checkbox
  - Social signup options
  - Link to login page

---

## 🎯 Application Pages (Authentication Required)

All pages under `/app` require authentication and are wrapped with `AppLayout`.

### Main Dashboard

#### 4. **ClaimClean Dashboard** (`/app/claimclean/dashboard`)
- **Route**: `/app/claimclean/dashboard`
- **Component**: `ClaimCleanDashboard.tsx`
- **Purpose**: Main application dashboard after login
- **Features**:
  - Real-time statistics
  - Recent claims overview
  - Quick action buttons
  - Key metrics display

---

### 📋 Claims Management Section

#### 5. **Claims List** (`/app/claimclean/claims`)
- **Route**: `/app/claimclean/claims`
- **Component**: `ClaimList.tsx`
- **Purpose**: View all waste claims
- **Features**:
  - Paginated list of claims
  - Filter and sort options
  - Claim status indicators
  - Quick view/edit access

#### 6. **New Claim Form** (`/app/claimclean/claims/new`)
- **Route**: `/app/claimclean/claims/new`
- **Component**: `ClaimNew.tsx`
- **Purpose**: Submit new waste verification claim
- **Features**:
  - Multi-step claim form
  - Image upload
  - Document upload (weight certificates, etc.)
  - Material type selection
  - Weight entry
  - Form validation

#### 7. **Claim Detail Page** (`/app/claimclean/claims/:claimId`)
- **Route**: `/app/claimclean/claims/:claimId`
- **Component**: `ClaimDetail.tsx`
- **Purpose**: View individual claim details
- **Features**:
  - Full claim information
  - Uploaded documents
  - AI verification results
  - ClaimClean Score display
  - Audit notes
  - Status history

---

### 🔍 Audits & Verification Section

#### 8. **Auditor Console** (`/app/claimclean/audits/console`)
- **Route**: `/app/claimclean/audits/console`
- **Component**: `AuditorConsole.tsx`
- **Purpose**: Auditor interface for reviewing claims
- **Features**:
  - Claims requiring review (flagged high-risk)
  - ClaimClean Score breakdown
  - Approval/rejection interface
  - Audit note entry
  - Digital signature capability

#### 9. **Field Audits** (`/app/claimclean/audits/field`)
- **Route**: `/app/claimclean/audits/field`
- **Component**: `FieldAudits.tsx`
- **Purpose**: On-site audit tracking
- **Features**:
  - Field audit schedule
  - GPS location tracking
  - Photo capture
  - Audit checklist
  - Real-time sync

---

### 📊 Reports & Analytics Section

#### 10. **Reports** (`/app/claimclean/reports`)
- **Route**: `/app/claimclean/reports`
- **Component**: `Reports.tsx`
- **Purpose**: Generate and view compliance reports
- **Features**:
  - Form-1 (Producer aggregation) generation
  - Form-4 (Recycler) submission proof
  - CPCB compliance reports
  - Export to PDF/Excel
  - Date range filtering
  - Blockchain proof-of-submission

---

### ⚙️ Admin & Management Section

#### 11. **ClaimClean Admin Dashboard** (`/app/claimclean/admin`)
- **Route**: `/app/claimclean/admin`
- **Component**: `AdminDashboard.tsx`
- **Purpose**: System administration and configuration
- **Features**:
  - User management
  - Recycler verification
  - Rate limiting / threshold configuration
  - System health monitoring
  - Audit log access
  - ClaimClean Score parameter tuning

---

### 🔎 Search Section

#### 12. **Search Results** (`/app/search`)
- **Route**: `/app/search`
- **Component**: `SearchResults.tsx`
- **Purpose**: Search across claims, documents, audits
- **Features**:
  - Full-text search
  - Results filtering
  - Result type indicators
  - Pagination

#### 13. **Advanced Search** (`/app/search/advanced`)
- **Route**: `/app/search/advanced`
- **Component**: `AdvancedSearch.tsx`
- **Purpose**: Complex search with multiple criteria
- **Features**:
  - Date range filtering
  - Material type filters
  - Recycler filters
  - Weight range filters
  - Status filters
  - Saved search templates

---

## 📂 Additional Pages (Not Currently Routed)

The following pages exist in your codebase but may not be active in current routing:

### Legacy/Future Pages

#### WasteAnalysis Section
- `WasteAnalysis.tsx` - Main waste analysis view
- `SensorCalibration.tsx` - Sensor configuration
- `RealTimeMonitoring.tsx` - Real-time monitoring dashboard
- `AnalysisResults.tsx` - Analysis results display
- `AnalysisHistory.tsx` - Historical analysis data

#### Contamination Detection
- `ContaminationDetectionPage.tsx` - Contamination detection interface

#### Blockchain Integration
- `BlockchainPage.tsx` - Blockchain certificate explorer

#### DigitalTwins
- `DigitalTwins.tsx` - Digital twin visualization
- `QuantumAndTwinsDemo.tsx` - Demo page

#### EPR Integration (Legacy)
- `CompliancePage.tsx` - EPR compliance overview
- `ComplianceDashboard.tsx` - Compliance dashboard
- `DocumentDetail.tsx` - Document detail view
- `ClientsPage.tsx` - Clients list

#### Other
- `Settings.tsx` - User settings
- `ToolsLandingPage.tsx` - Tools landing
- `NotFound.tsx` - 404 error page
- `TestPage.tsx` - Testing page

---

## 🔄 Route Hierarchy Map

```
/
├── / (Landing Page - ClaimCleanLandingPage)
├── /landing (Landing Page - ClaimCleanLandingPage)
│
├── /auth
│   ├── /login (LoginPage)
│   └── /signup (SignupPage)
│
└── /app (AppLayout - Requires Authentication)
    ├── /claimclean
    │   ├── / or /dashboard (ClaimCleanDashboard)
    │   ├── /claims (ClaimList)
    │   ├── /claims/new (ClaimNew)
    │   ├── /claims/:claimId (ClaimDetail)
    │   ├── /audits
    │   │   ├── /console (AuditorConsole)
    │   │   └── /field (FieldAudits)
    │   ├── /reports (Reports)
    │   └── /admin (AdminDashboard)
    │
    ├── /search (SearchResults)
    └── /search/advanced (AdvancedSearch)

404 Error Handling: NotFound page
```

---

## 📱 Page Categories by Function

### **User-Facing Pages (3)**
1. Landing Page
2. Login Page
3. Signup Page

### **Recycler Pages (4)**
1. ClaimClean Dashboard (overview)
2. Claims List (view all)
3. New Claim Form (submit)
4. Claim Detail (view specific)

### **Auditor Pages (3)**
1. Auditor Console (review claims)
2. Field Audits (on-site tracking)
3. Claim Detail (examine claim)

### **Producer/PIBO Pages (2)**
1. Reports (Form-1 generation)
2. Admin Dashboard (user management)

### **Utility Pages (3)**
1. Search Results
2. Advanced Search
3. 404 Not Found

---

## 🔑 Key Features by Page

| Page | Key Features |
|------|--------------|
| **Landing** | Hero, Features, CTA buttons |
| **Login** | Email/password, Remember me, Social login |
| **Signup** | Registration, Role selection, Terms |
| **Dashboard** | Statistics, Recent claims, Quick actions |
| **Claims List** | Pagination, Filter, Sort, Status |
| **New Claim** | Multi-step form, Image upload, Validation |
| **Claim Detail** | Full info, Documents, AI results, Score |
| **Auditor Console** | Flagged claims, Score breakdown, Approval |
| **Field Audits** | Schedule, GPS, Photos, Checklist |
| **Reports** | Form-1/4, CPCB export, PDF/Excel |
| **Admin** | User mgmt, Recycler verification, Monitoring |
| **Search** | Full-text, Results, Pagination |
| **Advanced Search** | Date range, Filters, Templates |

---

## 🔐 Authentication & Access Control

### Public Access (No Login Required)
- Landing page (`/`)
- Login page (`/auth/login`)
- Signup page (`/auth/signup`)

### Protected Access (Login Required)
- All `/app/*` routes
- Protected by `ProtectedRoute` wrapper component
- Redirects unauthenticated users to `/auth/login`

### Role-Based Access (Planned)
- **Recycler**: View own claims, submit new claims, view scores
- **Auditor**: View all claims, approve/reject, field audits
- **Producer (PIBO)**: View reports, manage recyclers
- **Admin**: All features + system configuration

---

## 📊 Page Statistics

| Category | Count |
|----------|-------|
| **Public Pages** | 3 (Landing, Login, Signup) |
| **App Pages (Active)** | 10 (Dashboard, Claims, Audits, Reports, Admin, Search) |
| **Legacy/Future Pages** | 15+ (WasteAnalysis, Blockchain, DigitalTwins, etc.) |
| **Total TSX Files** | 38+ |

---

## 🚀 Navigation Flow

### New User Journey
```
1. Land on: `/` (Landing Page)
2. Click "Create Account" → `/auth/signup` (Signup)
3. Submit → Auto-redirect to `/app/claimclean/dashboard` (Dashboard)
```

### Returning User Journey
```
1. Land on: `/auth/login` (Login Page)
2. Submit credentials → `/app/claimclean/dashboard` (Dashboard)
```

### Claim Submission Journey
```
1. Start at: `/app/claimclean/dashboard`
2. Click "New Claim" → `/app/claimclean/claims/new`
3. Submit → Auto-redirect to `/app/claimclean/claims/:claimId`
```

### Auditor Review Journey
```
1. Navigate to: `/app/claimclean/audits/console`
2. View flagged claims
3. Review score breakdown
4. Approve/Reject → Claim marked as reviewed
```

### Report Generation Journey
```
1. Navigate to: `/app/claimclean/reports`
2. Select date range & format
3. Generate Form-1/Form-4
4. Download as PDF or submit to CPCB
```

---

## 🔧 Component Files

### Page Components Location
```
frontend/src/pages/
├── Auth/
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   ├── LoginPage.module.css
│   └── SignupPage.module.css
│
├── Landing/
│   ├── ClaimCleanLandingPage.tsx
│   ├── LandingPage.tsx
│   └── SimpleLandingPage.tsx
│
├── NotFound/
│   └── NotFound.tsx
│
└── [Other legacy pages]
```

### ClaimClean Views Location
```
frontend/src/features/claimclean/views/
├── ClaimCleanDashboard.tsx
├── ClaimList.tsx
├── ClaimNew.tsx
├── ClaimDetail.tsx
├── AuditorConsole.tsx
├── FieldAudits.tsx
├── Reports.tsx
└── AdminDashboard.tsx
```

### Routes Configuration
```
frontend/src/routes/
└── index.tsx (Main router)

frontend/src/features/claimclean/
└── routes.tsx (ClaimClean sub-routes)
```

---

## 📝 Quick Reference Table

| Route | Component | Auth Required | Purpose |
|-------|-----------|---|---------|
| `/` | ClaimCleanLandingPage | No | Landing page |
| `/auth/login` | LoginPage | No | User login |
| `/auth/signup` | SignupPage | No | User registration |
| `/app/claimclean/dashboard` | ClaimCleanDashboard | Yes | Main dashboard |
| `/app/claimclean/claims` | ClaimList | Yes | View all claims |
| `/app/claimclean/claims/new` | ClaimNew | Yes | Submit new claim |
| `/app/claimclean/claims/:claimId` | ClaimDetail | Yes | View claim detail |
| `/app/claimclean/audits/console` | AuditorConsole | Yes | Auditor review |
| `/app/claimclean/audits/field` | FieldAudits | Yes | Field audits |
| `/app/claimclean/reports` | Reports | Yes | Generate reports |
| `/app/claimclean/admin` | AdminDashboard | Yes | System admin |
| `/app/search` | SearchResults | Yes | Search |
| `/app/search/advanced` | AdvancedSearch | Yes | Advanced search |

---

## 🎯 Next Steps to Consider

### Pages to Activate (From Legacy)
- [ ] WasteAnalysis pages (real-time monitoring dashboard)
- [ ] Blockchain integration (certificate explorer)
- [ ] DigitalTwins (visualization)
- [ ] Settings page (user preferences)

### Pages to Create
- [ ] User Profile page
- [ ] Notifications center
- [ ] Recycler verification page
- [ ] CPCB integration dashboard
- [ ] Analytics dashboard

### Pages to Enhance
- [ ] Dashboard - add more KPIs
- [ ] Reports - add more export formats
- [ ] Admin - add more configuration options

---

**Document Version**: 1.0  
**Last Updated**: December 19, 2025  
**Status**: Complete inventory of all website pages
