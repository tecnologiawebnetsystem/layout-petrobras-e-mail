#!/bin/bash
# ============================================================
# deploy-ecr.sh - Build local + Push para AWS ECR
# ============================================================
# Uso:
#   chmod +x deploy-ecr.sh
#   ./deploy-ecr.sh              (build + push front e back)
#   ./deploy-ecr.sh backend      (so o backend)
#   ./deploy-ecr.sh frontend     (so o frontend)
# ============================================================

set -e

# ===== CONFIGURAR AQUI =====
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-123456789012}"
AWS_REGION="${AWS_REGION:-us-east-1}"
# ============================

ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
TARGET="${1:-all}"

echo "================================================"
echo " Deploy ECR - Build Local + Push"
echo " Account: $AWS_ACCOUNT_ID"
echo " Region:  $AWS_REGION"
echo " Target:  $TARGET"
echo "================================================"
echo ""

# Login no ECR
echo ">>> Login no ECR..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_URI
echo ""

# Backend
if [ "$TARGET" = "all" ] || [ "$TARGET" = "backend" ]; then
  echo ">>> Build Backend..."
  docker build -t csa-backend:latest ./backend

  echo ">>> Tag + Push Backend..."
  docker tag csa-backend:latest $ECR_URI/csa-backend:latest
  docker push $ECR_URI/csa-backend:latest
  echo ""
fi

# Frontend
if [ "$TARGET" = "all" ] || [ "$TARGET" = "frontend" ]; then
  echo ">>> Build Frontend..."
  docker build -t csa-frontend:latest .

  echo ">>> Tag + Push Frontend..."
  docker tag csa-frontend:latest $ECR_URI/csa-frontend:latest
  docker push $ECR_URI/csa-frontend:latest
  echo ""
fi

echo "================================================"
echo " Deploy concluido!"
if [ "$TARGET" = "all" ] || [ "$TARGET" = "backend" ]; then
  echo " Backend:  $ECR_URI/csa-backend:latest"
fi
if [ "$TARGET" = "all" ] || [ "$TARGET" = "frontend" ]; then
  echo " Frontend: $ECR_URI/csa-frontend:latest"
fi
echo "================================================"
echo ""
echo "Para atualizar o ECS:"
echo "  aws ecs update-service --cluster csa-cluster --service csa-backend-svc --force-new-deployment"
echo "  aws ecs update-service --cluster csa-cluster --service csa-frontend-svc --force-new-deployment"
