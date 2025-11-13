#!/bin/bash
# Script untuk setup database di dalam container
# Jalankan setelah docker-compose up untuk membuat tabel dan seed data

echo "========================================="
echo "Setup Database untuk Jelita Microservices"
echo "========================================="

# Array services
services=("auth-service" "pendaftaran-service" "workflow-service" "survey-service" "archive-service")
service_names=("Auth" "Pendaftaran" "Workflow" "Survey" "Archive")

# Loop untuk setiap service
for i in "${!services[@]}"; do
  service="${services[$i]}"
  name="${service_names[$i]}"
  
  echo ""
  echo "[$name Service] Setting up database..."
  
  # Cek apakah ada setupDatabase.js
  docker-compose exec -T $service sh -c "if [ -f scripts/setupDatabase.js ]; then node scripts/setupDatabase.js; else echo 'No setupDatabase.js found'; fi"
  
  # Cek apakah ada seed/migration scripts
  docker-compose exec -T $service sh -c "if [ -f scripts/createPemohonUser.js ]; then node scripts/createPemohonUser.js; else echo 'No seed scripts found'; fi"
  
  echo "[$name Service] Database setup completed"
done

echo ""
echo "========================================="
echo "All databases setup completed!"
echo "========================================="
