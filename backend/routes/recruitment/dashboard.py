from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_tenant_db
from typing import Dict, Any

router = APIRouter(prefix="/recruitment-dashboard", tags=["Recruitment Dashboard"])

@router.get("/metrics")
def get_recruitment_metrics(db: Session = Depends(get_tenant_db)) -> Dict[str, Any]:
    """Get comprehensive recruitment and onboarding metrics"""
    
    try:
        # Job Requisition metrics - check if table exists first
        try:
            db.execute(text("SELECT 1 FROM job_requisition LIMIT 1"))
            job_metrics_query = text("""
                SELECT 
                    COUNT(*) as total_jobs,
                    COUNT(CASE WHEN COALESCE(status, '') NOT IN ('Filled', 'Completed', 'Closed') THEN 1 END) as active_jobs,
                    COUNT(CASE WHEN status IN ('Filled', 'Completed', 'Closed') THEN 1 END) as completed_jobs
                FROM job_requisition
            """)
        except:
            job_metrics_query = text("SELECT 0 as total_jobs, 0 as active_jobs, 0 as completed_jobs")
        job_result = db.execute(job_metrics_query).fetchone()
        
        # Candidate metrics - check if table exists first
        try:
            db.execute(text("SELECT 1 FROM candidates LIMIT 1"))
            candidate_metrics_query = text("""
                SELECT 
                    COUNT(*) as total_applied,
                    COUNT(CASE WHEN stage = 'Selected' THEN 1 END) as selected_candidates,
                    COUNT(CASE WHEN stage = 'Rejected' THEN 1 END) as rejected_candidates,
                    COUNT(CASE WHEN stage LIKE '%Scheduled%' THEN 1 END) as pending_interviews
                FROM candidates
            """)
        except:
            candidate_metrics_query = text("SELECT 0 as total_applied, 0 as selected_candidates, 0 as rejected_candidates, 0 as pending_interviews")
        candidate_result = db.execute(candidate_metrics_query).fetchone()
        
        # Onboarding metrics - check if table exists first
        try:
            db.execute(text("SELECT 1 FROM onboarding_candidates LIMIT 1"))
            onboarding_metrics_query = text("""
                SELECT 
                    COUNT(*) as total_onboarded,
                    COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_onboarding,
                    COUNT(CASE WHEN status IN ('Pending Docs', 'Docs Submitted') THEN 1 END) as pending_onboarding
                FROM onboarding_candidates
            """)
        except:
            onboarding_metrics_query = text("SELECT 0 as total_onboarded, 0 as completed_onboarding, 0 as pending_onboarding")
        onboarding_result = db.execute(onboarding_metrics_query).fetchone()
        
        # Offer metrics - using COALESCE to handle NULL values
        offer_metrics_query = text("""
            SELECT 
                COUNT(*) as total_offers,
                COUNT(CASE WHEN COALESCE(offer_status, '') = 'Sent' THEN 1 END) as offers_sent,
                COUNT(CASE WHEN COALESCE(offer_status, '') = 'Accepted' THEN 1 END) as offers_accepted,
                COUNT(CASE WHEN COALESCE(offer_status, '') = 'Rejected' THEN 1 END) as offers_rejected
            FROM offer_letters
        """)
        offer_result = db.execute(offer_metrics_query).fetchone()
        
        # Recent activity - last 7 days (simplified for compatibility)
        recent_activity_query = text("""
            SELECT 
                COUNT(*) as new_applications_week,
                COUNT(*) as new_applications_today
            FROM candidates
            WHERE created_at >= datetime('now', '-7 days')
        """)
        recent_result = db.execute(recent_activity_query).fetchone()
        
        return {
            "success": True,
            "data": {
                # Job metrics
                "total_jobs": job_result[0] if job_result else 0,
                "active_jobs": job_result[1] if job_result else 0,
                "completed_jobs": job_result[2] if job_result else 0,
                
                # Candidate metrics
                "applied_candidates": candidate_result[0] if candidate_result else 0,
                "selected_candidates": candidate_result[1] if candidate_result else 0,
                "rejected_candidates": candidate_result[2] if candidate_result else 0,
                "pending_interviews": candidate_result[3] if candidate_result else 0,
                
                # Onboarding metrics
                "onboarded_candidates": onboarding_result[0] if onboarding_result else 0,
                "completed_onboarding": onboarding_result[1] if onboarding_result else 0,
                "pending_onboarding": onboarding_result[2] if onboarding_result else 0,
                
                # Offer metrics
                "total_offers": offer_result[0] if offer_result else 0,
                "offers_sent": offer_result[1] if offer_result else 0,
                "offers_accepted": offer_result[2] if offer_result else 0,
                "offers_rejected": offer_result[3] if offer_result else 0,
                
                # Recent activity
                "new_applications_week": recent_result[0] if recent_result else 0,
                "new_applications_today": recent_result[1] if recent_result else 0,
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": {
                "total_jobs": 0,
                "active_jobs": 0,
                "completed_jobs": 0,
                "applied_candidates": 0,
                "selected_candidates": 0,
                "rejected_candidates": 0,
                "pending_interviews": 0,
                "onboarded_candidates": 0,
                "completed_onboarding": 0,
                "pending_onboarding": 0,
                "total_offers": 0,
                "offers_sent": 0,
                "offers_accepted": 0,
                "offers_rejected": 0,
                "new_applications_week": 0,
                "new_applications_today": 0,
            }
        }

@router.get("/job-status-breakdown")
def get_job_status_breakdown(db: Session = Depends(get_tenant_db)):
    """Get detailed breakdown of job statuses"""
    
    try:
        query = text("""
            SELECT 
                status,
                COUNT(*) as count,
                GROUP_CONCAT(title) as job_titles
            FROM job_requisition 
            GROUP BY status
            ORDER BY count DESC
        """)
        
        results = db.execute(query).fetchall()
        
        breakdown = []
        for row in results:
            breakdown.append({
                "status": row[0] or "Unknown",
                "count": row[1],
                "job_titles": row[2].split(',') if row[2] else []
            })
        
        return {
            "success": True,
            "data": breakdown
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": []
        }

@router.get("/candidate-pipeline")
def get_candidate_pipeline(db: Session = Depends(get_tenant_db)):
    """Get candidate pipeline by stage"""
    
    try:
        query = text("""
            SELECT 
                stage,
                COUNT(*) as count
            FROM candidates 
            GROUP BY stage
            ORDER BY count DESC
        """)
        
        results = db.execute(query).fetchall()
        
        pipeline = []
        for row in results:
            pipeline.append({
                "stage": row[0] or "Unknown",
                "count": row[1]
            })
        
        return {
            "success": True,
            "data": pipeline
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": []
        }

@router.get("/debug-data")
def debug_database_data(db: Session = Depends(get_tenant_db)):
    """Debug endpoint to check actual data in database"""
    
    try:
        # Check job_requisition table
        jobs_query = text("SELECT COUNT(*), GROUP_CONCAT(DISTINCT status) FROM job_requisition")
        jobs_result = db.execute(jobs_query).fetchone()
        
        # Check candidates table
        candidates_query = text("SELECT COUNT(*), GROUP_CONCAT(DISTINCT stage) FROM candidates")
        candidates_result = db.execute(candidates_query).fetchone()
        
        # Check onboarding_candidates table
        onboarding_query = text("SELECT COUNT(*), GROUP_CONCAT(DISTINCT status) FROM onboarding_candidates")
        onboarding_result = db.execute(onboarding_query).fetchone()
        
        # Check offer_letters table
        offers_query = text("SELECT COUNT(*), GROUP_CONCAT(DISTINCT offer_status) FROM offer_letters")
        offers_result = db.execute(offers_query).fetchone()
        
        return {
            "success": True,
            "data": {
                "jobs": {
                    "count": jobs_result[0] if jobs_result else 0,
                    "statuses": jobs_result[1] if jobs_result else "None"
                },
                "candidates": {
                    "count": candidates_result[0] if candidates_result else 0,
                    "stages": candidates_result[1] if candidates_result else "None"
                },
                "onboarding": {
                    "count": onboarding_result[0] if onboarding_result else 0,
                    "statuses": onboarding_result[1] if onboarding_result else "None"
                },
                "offers": {
                    "count": offers_result[0] if offers_result else 0,
                    "statuses": offers_result[1] if offers_result else "None"
                }
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": {}
        }