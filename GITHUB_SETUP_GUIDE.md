# 🚀 GitHub Repository Setup Guide

This guide helps you prepare the JELITA Microservices project for GitHub publication.

## ✅ Pre-Push Checklist

### 1. Verify .gitignore is Correct
```powershell
# Check what will be committed
git status

# Should see these important files:
# ✅ All service code (layanan-*)
# ✅ Docker configs (docker-compose.yml, Dockerfile)
# ✅ Test scripts (loadtest/)
# ✅ Reports (reports/, Report-*.md)
# ✅ Documentation (README.md, *_GUIDE.md)
# ✅ Database schemas (docker/init-db/)

# Should NOT see these:
# ❌ node_modules/
# ❌ .env files
# ❌ mysql-data/
# ❌ test-results/**/*.json (raw data)
# ❌ DAY*_*.md (sprint tracking)
```

### 2. Create .env.example (Already Done ✅)
File `.env.example` has been created with all required environment variables.

### 3. Verify Secrets are NOT in Code
```powershell
# Search for potential secrets
git grep -i "password\s*=\s*['\"]" -- "*.js" "*.ts" "*.json"
git grep -i "jwt.*secret\s*=\s*['\"]" -- "*.js" "*.ts"
git grep -i "api[_-]key\s*=\s*['\"]" -- "*.js" "*.ts"

# Should return NO results from actual code files
```

### 4. Sensitive Files to Check Manually
Review these files before pushing:
- [ ] `docker-compose.yml` - Ensure no hardcoded passwords
- [ ] `docker-compose.scaleout.yml` - Check MYSQL_ROOT_PASSWORD uses env var
- [ ] All `*.js` files in services - No API keys or tokens
- [ ] Test scripts - Mock credentials only

## 📂 What Will Be Pushed (Included)

### Core Application Code
```
✅ layanan-manajemen-pengguna/    (Auth Service)
✅ layanan-pendaftaran/           (Registration Service)
✅ layanan-alur-kerja/            (Workflow Service)
✅ layanan-survei/                (Survey Service)
✅ layanan-arsip/                 (Archive Service)
✅ jelita-monolith/               (Monolith baseline)
✅ mock-oss-rba/                  (Mock external service)
```

### Infrastructure & Deployment
```
✅ docker-compose.yml             (Standard deployment)
✅ docker-compose.scaleout.yml    (Horizontal scaling)
✅ docker/init-db/                (Database schemas)
✅ docker/nginx/                  (Load balancer config)
✅ docker/setup-databases.ps1     (DB setup script)
```

### Testing & Validation
```
✅ loadtest/k6/                   (All test scripts)
✅ reports/                       (Comprehensive analysis reports)
✅ Report-baseline-stress-user-count-jelita.md
✅ SPBE_COMPLIANCE_CHECKLIST.md
✅ TESTING_EXECUTION_GUIDE.md
✅ SCALE_OUT_TEST_GUIDE.md
✅ INTEROPERABILITY_TESTING_GUIDE.md
```

### Documentation
```
✅ README.md                      (Main documentation)
✅ CONTRIBUTING.md                (Contribution guide)
✅ LICENSE                        (Project license)
✅ SECURITY.md                    (Security policy)
✅ .env.example                   (Environment template)
```

### Automation Scripts
```
✅ run-scaleout-test.ps1
✅ run-interoperability-tests.ps1
✅ translate-reports.ps1
```

## 🚫 What Will NOT Be Pushed (Excluded)

### Dependencies & Build Artifacts
```
❌ node_modules/                  (50MB+ per service)
❌ package-lock.json              (Auto-generated)
❌ dist/                          (Build outputs)
❌ coverage/                      (Test coverage data)
```

### Sensitive Data
```
❌ .env                           (Environment secrets)
❌ **/.env                        (Service-specific secrets)
❌ secrets/                       (Keys, certificates)
```

### Runtime Data
```
❌ mysql-data/                    (Database volumes)
❌ logs/                          (Runtime logs)
❌ *.log                          (Log files)
❌ .pm2/                          (Process manager data)
```

### Test Results (Raw Data)
```
❌ test-results/**/*.json         (500KB+ each run)
❌ test-results/**/*.html         (Generated reports)
❌ test-results/temp/             (Temporary test data)

✅ Reports are INCLUDED (analysis summaries)
```

### Internal Working Documents
```
❌ DAY*_*.md                      (Sprint tracking)
❌ TESTING_DAY*.md                (Daily progress)
❌ REVIEWER_COMMENTS_ANALYSIS.md  (Internal notes)
❌ QUICK_STATUS.md                (Status tracking)
❌ *_BACKUP.md                    (Backup files)
```

### IDE & OS Files
```
❌ .vscode/                       (VS Code settings)
❌ .idea/                         (IntelliJ settings)
❌ .DS_Store                      (Mac OS)
❌ Thumbs.db                      (Windows)
```

## 🔧 Initial Git Setup

### If Starting Fresh
```powershell
# Initialize repository
git init

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/jelita-microservices.git

# Stage all files (respecting .gitignore)
git add .

# Check what will be committed
git status

# First commit
git commit -m "Initial commit: JELITA Microservices Platform

- Complete microservices architecture (5 services)
- Monolith baseline for comparison
- Comprehensive testing (22+ hours validation)
- Full documentation and guides
- Docker deployment configurations
- Load testing framework (k6)
- SPBE compliance verification
"

# Push to GitHub
git push -u origin main
```

### If Repository Already Exists
```powershell
# Pull latest
git pull origin main

# Add files
git add .

# Commit with descriptive message
git commit -m "Update: Add comprehensive testing reports and documentation"

# Push
git push origin main
```

## 📊 Repository Statistics (Expected)

After pushing, your repository should contain approximately:

- **Total Files**: ~300-400 files
- **Code Files**: ~150 JavaScript files
- **Documentation**: ~20 Markdown files
- **Test Scripts**: ~15 k6 scripts
- **Size**: ~5-10 MB (without node_modules)

## 🔐 Security Verification

### Before First Push - Critical Checks

1. **No Real Passwords**
```powershell
# Verify docker-compose uses env vars
grep -n "MYSQL_ROOT_PASSWORD" docker-compose*.yml
# Should show: ${MYSQL_ROOT_PASSWORD:-default_dev_password}
```

2. **No JWT Secrets**
```powershell
# Check for hardcoded JWT secrets
git grep -n "jwt.*secret.*=" -- "*.js" | grep -v ".env.example"
# Should show only process.env.JWT_SECRET references
```

3. **No API Keys**
```powershell
# Search for potential API keys
git grep -i "api[_-]key" -- "*.js" "*.json"
# Should only find references in .env.example or comments
```

## 📝 Recommended Commit Messages

Use conventional commit format:

```
feat: Add horizontal scaling configuration
fix: Resolve database connection pool exhaustion
docs: Update README with testing methodology
test: Add interoperability contract tests
perf: Optimize Registration service bottleneck
refactor: Restructure Workflow service routing
chore: Update dependencies to latest stable
```

## 🌐 GitHub Repository Settings

### After First Push

1. **Add Repository Description**
   ```
   Microservices-based licensing platform for Indonesian government services.
   Comprehensive research implementation with 22+ hours performance testing,
   SPBE compliance verification, and quantitative monolith comparison.
   ```

2. **Add Topics/Tags**
   - `microservices`
   - `nodejs`
   - `docker`
   - `performance-testing`
   - `k6`
   - `scalability`
   - `interoperability`
   - `spbe-compliance`
   - `government-services`
   - `research`

3. **Enable Issues & Discussions**
   - Issues: For bug reports and feature requests
   - Discussions: For Q&A and research collaboration

4. **Create GitHub Actions Workflow** (Optional)
   File `.github/workflows/ci-tests.yml` already included

5. **Add Branch Protection** (Recommended)
   - Require pull request reviews
   - Require status checks to pass
   - Require branches to be up to date

## 📢 Post-Push Actions

### 1. Create Initial Release
```
Tag: v1.0.0
Title: JELITA Microservices Platform - Research Implementation

Description:
First stable release of the JELITA microservices platform.

Key Features:
- 5 microservices with horizontal scaling
- 22+ hours comprehensive testing validation
- 100% contract conformance & 98-100% data exchange success
- 59% SPBE compliance (research prototype)
- Complete documentation and reproducible test framework

Research Highlights:
- 52.8% latency improvement vs monolith (under stress)
- 10-hour soak tests with 0% error rate
- Production data-driven VU selection methodology
```

### 2. Update README Badges (Optional)
Add to README.md:
```markdown
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)
![k6](https://img.shields.io/badge/k6-Load%20Testing-7D64FF?logo=k6)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
```

### 3. Add Citation File (CITATION.cff)
Create `CITATION.cff` for academic citations (optional)

## ✅ Final Verification

Before announcing publicly:

- [ ] Clone to fresh directory and verify setup works
- [ ] Run `docker-compose up` and ensure all services start
- [ ] Execute `.\docker\setup-databases.ps1` successfully
- [ ] Verify health endpoints respond
- [ ] Run one baseline test: `k6 run loadtest/k6/baseline-test.js`
- [ ] Confirm no secrets in committed files
- [ ] README.md renders correctly on GitHub
- [ ] All links in documentation work

## 🆘 Troubleshooting

### "Large files warning"
If Git warns about large files:
```powershell
# Find large files
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | awk '/^blob/ {print substr($0,6)}' | sort -n -k2 | tail -n 10

# Remove from history if needed
git filter-branch --tree-filter 'rm -rf path/to/large/file' HEAD
```

### "Permission denied" on scripts
```powershell
# Fix script permissions (Linux/Mac)
chmod +x docker/setup-databases.sh
chmod +x run-scaleout-test.ps1

# Commit permission changes
git add --chmod=+x docker/setup-databases.sh
git commit -m "fix: Set executable permissions on scripts"
```

## 📧 Contact

For questions about contributing or repository setup:
- Open an issue on GitHub
- Check CONTRIBUTING.md for guidelines
- Review SECURITY.md for security concerns

---

**Last Updated**: December 22, 2025  
**Repository Status**: Ready for Public Release ✅
