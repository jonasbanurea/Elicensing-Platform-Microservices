# 🔧 Scripts Directory

Utility and automation scripts for the JELITA Microservices Platform.

---

## 📂 Contents

### Testing Scripts

#### `run-interoperability-tests.ps1`
**Purpose**: Execute comprehensive interoperability tests between microservices

**Features**:
- Tests all inter-service communication
- Validates API contracts
- Checks data exchange formats
- Generates detailed reports
- SPBE compliance verification

**Usage**:
```powershell
.\scripts\run-interoperability-tests.ps1
```

**Output**: 
- `test-results/data-exchange-results.json`
- `test-results/data-exchange-summary.txt`
- Console report with pass/fail status

---

#### `run-interoperability-tests-simple.ps1`
**Purpose**: Quick interoperability smoke tests

**Features**:
- Simplified test suite
- Faster execution (subset of full tests)
- Basic contract validation
- Quick health checks

**Usage**:
```powershell
.\scripts\run-interoperability-tests-simple.ps1
```

**When to Use**: 
- Quick validation after code changes
- Pre-commit checks
- CI/CD pipeline integration

---

#### `run-scaleout-test.ps1`
**Purpose**: Execute horizontal scaling tests

**Features**:
- Tests scale-out configurations
- Validates load distribution
- Monitors performance under scaling
- Generates scaling reports

**Usage**:
```powershell
.\scripts\run-scaleout-test.ps1
```

**Requirements**:
- Docker Compose with scale-out configuration
- k6 load testing tool installed
- See [SCALE_OUT_TEST_GUIDE.md](../docs/testing/SCALE_OUT_TEST_GUIDE.md)

**Output**: Test results in `test-results/` directory

---

### Utility Scripts

#### `submit-to-github.ps1`
**Purpose**: Automated GitHub push workflow

**Features**:
- Pre-push validation checks
- Security scanning
- Automatic staging of changes
- Commit with standardized message format
- Push to remote repository

**Usage**:
```powershell
.\scripts\submit-to-github.ps1
```

**Safety Features**:
- Checks for hardcoded secrets
- Validates .gitignore rules
- Confirms large file sizes
- Prompts for confirmation before push

**See Also**: [GITHUB_SETUP_GUIDE.md](../docs/setup/GITHUB_SETUP_GUIDE.md)

---

#### `translate-reports.ps1`
**Purpose**: Translate test reports between languages

**Features**:
- Converts reports between English/Indonesian
- Maintains markdown formatting
- Preserves technical terms
- Batch processing support

**Usage**:
```powershell
.\scripts\translate-reports.ps1 -InputFile "report.md" -TargetLanguage "id"
```

**Supported Languages**:
- `en` - English
- `id` - Bahasa Indonesia

---

## 🚀 Quick Start

### Run All Tests
```powershell
# Full interoperability suite
.\scripts\run-interoperability-tests.ps1

# Quick smoke tests
.\scripts\run-interoperability-tests-simple.ps1

# Scale-out validation (requires scale-out deployment)
.\scripts\run-scaleout-test.ps1
```

### GitHub Workflow
```powershell
# Stage, commit, and push changes
.\scripts\submit-to-github.ps1
```

### Report Translation
```powershell
# Translate report to Indonesian
.\scripts\translate-reports.ps1 -InputFile "docs/reports/my-report.md" -TargetLanguage "id"
```

---

## 📋 Prerequisites

### For Testing Scripts
- **Docker & Docker Compose**: Services must be running
- **k6**: Load testing tool (`choco install k6` or download from k6.io)
- **PowerShell 5.1+**: Built-in on Windows
- **Network Access**: Services on ports 3001-3040

### For Utility Scripts
- **Git**: Version control (`git --version`)
- **GitHub Account**: With repository access
- **PowerShell 5.1+**: Built-in on Windows

---

## 🔍 Script Details

### Testing Scripts Location
All test scripts are designed to be run from the **project root directory**:
```powershell
cd "d:\KULIAH\TESIS\prototype_eng V2"
.\scripts\run-interoperability-tests.ps1
```

### Output Locations
- **Test Results**: `test-results/` directory
- **Test Logs**: Console output (can redirect to file)
- **Reports**: Generated in `reports/` or `test-results/`

### Error Handling
All scripts include:
- ✅ Pre-flight checks (Docker, k6, Git availability)
- ✅ Error detection and reporting
- ✅ Exit codes (0 = success, 1+ = failure)
- ✅ Detailed error messages

---

## 📖 Documentation References

### Testing
- [TESTING_EXECUTION_GUIDE.md](../docs/testing/TESTING_EXECUTION_GUIDE.md) - Complete testing instructions
- [INTEROPERABILITY_TESTING_GUIDE.md](../docs/testing/INTEROPERABILITY_TESTING_GUIDE.md) - Interop test details
- [SCALE_OUT_TEST_GUIDE.md](../docs/testing/SCALE_OUT_TEST_GUIDE.md) - Scaling test setup

### Setup & Deployment
- [GITHUB_SETUP_GUIDE.md](../docs/setup/GITHUB_SETUP_GUIDE.md) - GitHub configuration
- [SECURITY_BEFORE_PUSH.md](../docs/setup/SECURITY_BEFORE_PUSH.md) - Security checklist

### Results
- [test-results/README.md](../test-results/README.md) - Test data documentation

---

## 🛠️ Customization

### Modify Test Parameters
Edit script variables at the top of each file:
```powershell
# Example: run-interoperability-tests.ps1
$BASE_URL = "http://localhost:3001"
$TEST_TIMEOUT = 30  # seconds
$RETRY_COUNT = 3
```

### Add New Scripts
1. Create `.ps1` file in `scripts/` directory
2. Add execution policy bypass header:
   ```powershell
   # Requires -Version 5.1
   Set-StrictMode -Version Latest
   $ErrorActionPreference = "Stop"
   ```
3. Document in this README
4. Update `.gitignore` if script generates temp files

---

## 🐛 Troubleshooting

### "Execution Policy" Error
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### "k6 not found"
```powershell
# Install k6
choco install k6
# Or download from: https://k6.io/docs/getting-started/installation/
```

### "Docker not running"
```powershell
# Start Docker Desktop
# Or: Start-Service docker (Windows Server)
```

### Script Hangs
- Check if services are accessible (curl http://localhost:3001/health)
- Verify Docker containers are running (`docker ps`)
- Check for port conflicts

---

## 📝 Script Maintenance

### Best Practices
- ✅ Always include error handling
- ✅ Use `Set-StrictMode -Version Latest`
- ✅ Set `$ErrorActionPreference = "Stop"`
- ✅ Add comments for complex logic
- ✅ Test on fresh environment before committing

### Version Control
All scripts are tracked in Git. Follow commit message format:
```
scripts: Brief description of change

- Detailed point 1
- Detailed point 2
```

---

## 🆘 Need Help?

1. **Script Errors**: Check script output for detailed error messages
2. **Testing Issues**: See [TESTING_EXECUTION_GUIDE.md](../docs/testing/TESTING_EXECUTION_GUIDE.md)
3. **GitHub Issues**: https://github.com/jonasbanurea/Elicensing-Platform-Microservices/issues

---

**Last Updated**: December 22, 2025  
**Total Scripts**: 5 (3 testing, 2 utility)  
**PowerShell Version**: 5.1+
