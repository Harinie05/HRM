from fastapi import APIRouter

router = APIRouter(
    prefix="/payroll/reports",
    tags=["Payroll - Reports"]
)


@router.get("/summary")
def payroll_summary():
    return {
        "message": "Payroll summary report"
    }
