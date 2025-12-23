from fastapi import APIRouter, Header, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from utils.audit_logger import audit_crud

from database import get_tenant_engine, logger
from models.models_tenant import Branch
from schemas.schemas_tenant import BranchBase, BranchResponse

# 🔐 added for authentication
from routes.hospital import get_current_user

router = APIRouter(prefix="/organization", tags=["Organization Setup"])


# =============================
# GET branch details 🔒 Protected
# =============================
@router.get("/branch", response_model=BranchResponse | dict)
def get_branch(
    tenant: str = Header(...),
    user = Depends(get_current_user)  # 🔐 Token required
):
    try:
        logger.info(f"Getting branch info for tenant {tenant} by user {user.get('email')}")
        engine = get_tenant_engine(tenant)
        db = Session(bind=engine)

        branch = db.query(Branch).first()
        if not branch:
            return {}

        return branch

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================
# CREATE or UPDATE branch 🔒 Protected
# =============================
@router.post("/branch", response_model=BranchResponse)
def save_branch(
    data: BranchBase,
    request: Request,
    tenant: str = Header(...),
    user = Depends(get_current_user)  # 🔐 Token required
):
    try:
        logger.info(f"Saving branch data for tenant {tenant} by user {user.get('email')}")
        engine = get_tenant_engine(tenant)
        db = Session(bind=engine)

        branch = db.query(Branch).first()

        if branch:
            # UPDATE
            logger.info(f"Updating existing branch for tenant {tenant}")
            old_values = {key: getattr(branch, key) for key in data.dict().keys()}
            for key, value in data.dict().items():
                setattr(branch, key, value)
            audit_crud(request, tenant, user, "UPDATE_BRANCH", "branches", str(branch.id), old_values, data.dict())
        else:
            # CREATE
            logger.info(f"Creating new branch for tenant {tenant}")
            branch = Branch(**data.dict())
            db.add(branch)
            db.commit()
            db.refresh(branch)
            audit_crud(request, tenant, user, "CREATE_BRANCH", "branches", str(branch.id), {}, data.dict())

        db.commit()
        db.refresh(branch)
        return branch

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
