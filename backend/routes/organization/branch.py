from fastapi import APIRouter, Header, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_tenant_engine
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
        print(f"DEBUG: User {user.get('email')} accessing branch info for tenant {tenant}")
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
    tenant: str = Header(...),
    user = Depends(get_current_user)  # 🔐 Token required
):
    try:
        print(f"DEBUG: User {user.get('email')} saving branch data for tenant {tenant}")
        engine = get_tenant_engine(tenant)
        db = Session(bind=engine)

        branch = db.query(Branch).first()

        if branch:
            # UPDATE
            print(f"DEBUG: Updating existing branch for user {user.get('email')}")
            for key, value in data.dict().items():
                setattr(branch, key, value)
        else:
            # CREATE
            print(f"DEBUG: Creating new branch for user {user.get('email')}")
            branch = Branch(**data.dict())
            db.add(branch)

        db.commit()
        db.refresh(branch)
        return branch

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
