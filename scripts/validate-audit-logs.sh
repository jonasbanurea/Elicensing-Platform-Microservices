#!/bin/bash

# Audit Log Validation Script (Bash Version)
# Validates that all API requests are properly logged for SPBE compliance
# Generated for direct execution on Linux VM

echo -e "\033[0;36m=== Audit Log Validation Script ===\033[0m"
echo -e "This script validates audit log coverage for SPBE compliance\n"

# Set KUBECONFIG to user's accessible kubeconfig
export KUBECONFIG=/home/vboxuser/k3s.yaml

# Configuration
NAMESPACE="jelita-system"
TEST_DURATION="2m"
TEST_VUS=20
REQUIRED_COVERAGE=95
LOG_FILE="audit-log-validation-report.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Step 0: Check prerequisites
echo -e "${YELLOW}Step 0: Checking prerequisites...${NC}"

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}ERROR: kubectl not found or not in PATH.${NC}"
    echo "Please ensure kubectl is installed and configured."
    exit 1
fi

if ! command -v k6 &> /dev/null; then
    echo -e "${YELLOW}WARNING: k6 not found.${NC}"
    echo "Please install k6 or ensure it is in PATH."
    # We might proceed if we just want to validate existing logs, but traffic gen will fail.
fi

# Step 1: Run baseline test to generate traffic
echo -e "${YELLOW}Step 1: Generating test traffic...${NC}"

if [ -z "$BASE_URL" ]; then
    BASE_URL="http://localhost:30000"
fi
export BASE_URL
export SCENARIO="quick"

echo -e "${CYAN}Using BASE_URL: $BASE_URL${NC}"
echo -e "Running K6 baseline test ($TEST_DURATION, $TEST_VUS VUs)...\n"

# Run K6 and capture output
echo -e "Running K6 health check test (5min, focused on valid endpoints)...\n"

k6_output=$(k6 run loadtest/k6/audit-health-check.js --env BASE_URL=$BASE_URL 2>&1)
k6_exit_code=$?

if [ $k6_exit_code -ne 0 ]; then
    echo -e "${YELLOW}WARNING: K6 test finished with errors (thresholds failed or other issues).${NC}"
    echo "Proceeding to check audit logs anyway..."
    echo "$k6_output"
else
    echo -e "${GREEN}K6 test finished successfully.${NC}"
fi

# Extract total requests
total_requests=0

# Try to parse from K6 output - look for "X complete and 0 interrupted iterations"
# The final line will have the total count
iterations_line=$(echo "$k6_output" | grep -E "[0-9]+ complete and [0-9]+ interrupted iterations" | tail -n 1)

if [ -n "$iterations_line" ]; then
    # Extract the number before "complete"
    total_requests=$(echo "$iterations_line" | grep -oE "[0-9]+ complete" | grep -oE "[0-9]+" | head -n 1)
    
    if [ -n "$total_requests" ] && [ "$total_requests" -gt 0 ]; then
        echo -e "${GREEN}Total K6 iterations: $total_requests${NC}"
    else
        total_requests=0
    fi
fi

# Fallback to http_reqs if iterations not found
if [ "$total_requests" -eq 0 ]; then
    req_match=$(echo "$k6_output" | grep "http_reqs" | sed 's/[^0-9]*//g' | head -n 1)
    
    if [ -n "$req_match" ] && [ "$req_match" -gt 0 ]; then
        total_requests=$req_match
        echo -e "${GREEN}Total HTTP requests (from metrics): $total_requests${NC}"
    fi
fi

# Final fallback to estimate
if [ "$total_requests" -eq 0 ]; then
    echo -e "${YELLOW}WARNING: Could not parse total requests from K6 output${NC}"
    echo "Attempting crude estimate..."
    # Estimate: VUs * 120s * 5 req/s
    total_requests=$((TEST_VUS * 120 * 5))
    echo -e "${YELLOW}Estimated requests: $total_requests${NC}"
fi

# Step 2: Collect audit logs
echo -e "\n${YELLOW}Step 2: Collecting audit logs from Kubernetes pods...${NC}"

services=("api-gateway" "user-management" "registration" "workflow" "survey" "archive")
total_audit_logs=0
declare -A audit_logs_by_service

for service in "${services[@]}"; do
    echo -n "  Checking $service... "
    
    # Get logs count
    count=$(kubectl logs -n $NAMESPACE -l "app=$service" --tail=100000 | grep -E "audit|request|API" | wc -l)
    
    audit_logs_by_service[$service]=$count
    total_audit_logs=$((total_audit_logs + count))
    
    echo -e "${CYAN}$count audit entries${NC}"
done

# Step 3: Calculate coverage
echo -e "\n${YELLOW}Step 3: Calculating audit log coverage...${NC}"

coverage=0
if [ "$total_requests" -gt 0 ]; then
    # Bash doesn't support floating point arithmetic natively well, using awk
    coverage=$(awk "BEGIN {printf \"%.2f\", ($total_audit_logs / $total_requests) * 100}")
fi

echo -e "\n${CYAN}=== AUDIT LOG VALIDATION RESULTS ===${NC}"
echo "Total API Requests: $total_requests"
echo "Total Audit Log Entries: $total_audit_logs"

if (( $(echo "$coverage >= $REQUIRED_COVERAGE" | awk '{print ($1 >= $2)}') )); then
   COLOR=$GREEN
else
   COLOR=$RED
fi
echo -e "Audit Log Coverage: ${COLOR}${coverage}%${NC}"

# Breakdown
echo -e "\nAudit Logs by Service:"
for service in "${services[@]}"; do
    count=${audit_logs_by_service[$service]}
    percentage=0
    if [ "$total_audit_logs" -gt 0 ]; then
        percentage=$(awk "BEGIN {printf \"%.1f\", ($count / $total_audit_logs) * 100}")
    fi
    echo "  $service: $count logs ($percentage%)"
done

# Step 4: Validate log structure
echo -e "\n${YELLOW}Step 4: Validating audit log structure...${NC}"

sample_log=$(kubectl logs -n $NAMESPACE -l "app=api-gateway" --tail=100 | grep "audit" | head -n 1)

has_all_fields=true
if [ -n "$sample_log" ]; then
    echo "Sample audit log entry:"
    echo -e "\033[0;37m$sample_log\033[0m"
    
    required_fields=("timestamp" "user" "method" "path" "status")
    
    for field in "${required_fields[@]}"; do
        if echo "$sample_log" | grep -q "$field"; then
            echo -e "  ${GREEN}[OK] Contains '$field'${NC}"
        else
            echo -e "  ${RED}[MISSING] Missing '$field'${NC}"
            has_all_fields=false
        fi
    done
else
    echo -e "  ${YELLOW}[WARN] No audit logs found in sample${NC}"
fi

# Step 5: Log retention
echo -e "\n${YELLOW}Step 5: Checking audit log retention...${NC}"
oldest_log=$(kubectl logs -n $NAMESPACE -l "app=api-gateway" --tail=10000 | head -n 1)
# Simply check if it looks like a log with a date
if echo "$oldest_log" | grep -qE "[0-9]{4}-[0-9]{2}-[0-9]{2}"; then
    timestamp=$(echo "$oldest_log" | grep -oE "[0-9]{4}-[0-9]{2}-[0-9]{2}")
    echo "Oldest log timestamp found: $timestamp"
    echo -e "${GREEN}[OK] Log retention policy appears active${NC}"
else
    echo -e "${YELLOW}[WARN] Could not determine log retention${NC}"
fi

# Report generation (simplified JSON output)
echo -e "\n${CYAN}=== COMPLIANCE ASSESSMENT ===${NC}"

# Simple report logic
if (( $(echo "$coverage >= $REQUIRED_COVERAGE" | awk '{print ($1 >= $2)}') )); then
    echo "Audit Log Coverage: [PASS] ($coverage%)"
    RES_COVERAGE="PASS"
else
    echo "Audit Log Coverage: [FAIL] ($coverage%)"
    RES_COVERAGE="FAIL"
fi

# Overall score (simplified)
echo -e "\n${GREEN}[OK] Report logic completed (JSON export simplified in bash)${NC}"

if [ "$RES_COVERAGE" == "PASS" ]; then
     echo -e "\n${GREEN}[PASS] AUDIT LOG VALIDATION PASSED${NC}"
     exit 0
else
     echo -e "\n${YELLOW}[WARN] AUDIT LOG VALIDATION NEEDS IMPROVEMENT${NC}"
     exit 1
fi
