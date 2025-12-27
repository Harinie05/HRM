// Comprehensive Button Update Script
// This script will systematically update all buttons across all pages to use dynamic colors

const fs = require('fs');
const path = require('path');

// List of all JSX files to update
const filesToUpdate = [
  // Main pages
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/Dashboard.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/Department.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/HospitalRegister.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/Login.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/Roles.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/User.jsx',
  
  // Analytics pages
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/analytics/AttritionDashboard.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/analytics/ManpowerComplianceDashboard.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/analytics/ManpowerDashboard.jsx',
  
  // Attendance pages
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/attendance/AttendanceDashboard.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/attendance/AttendanceLayout.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/attendance/AttendanceLocations.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/attendance/AttendanceLogs.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/attendance/AttendanceReports.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/attendance/AttendanceRules.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/attendance/ODApplications.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/attendance/ShiftRoster.jsx',
  
  // Compliance pages
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/compliance/ComplianceDashboard.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/compliance/ComplianceLayout.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/compliance/ComplianceTabs.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/compliance/LabourRegister.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/compliance/LeaveCompliance.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/compliance/NABHCompliance.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/compliance/Statutory.jsx',
  
  // EIS pages
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/EIS/EmployeeBankDetails.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/EIS/EmployeeCertifications.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/EIS/EmployeeDocuments.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/EIS/EmployeeEducation.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/EIS/EmployeeExit.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/EIS/EmployeeExperience.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/EIS/EmployeeFamily.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/EIS/EmployeeIDDocs.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/EIS/EmployeeListPage.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/EIS/EmployeeMedical.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/EIS/EmployeeProfile.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/EIS/EmployeeReporting.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/EIS/EmployeeSalary.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/EIS/EmployeeSkills.jsx',
  
  // Exit pages
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/exit/ClearanceWorkflow.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/exit/ExitLayout.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/exit/ExitTabs.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/exit/ResignationNotice.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/exit/ResignationTrackingEnhanced.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/exit/SettlementDocuments.jsx',
  
  // HR pages
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/hr/Assets.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/hr/Communication.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/hr/Grievances.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/hr/HRLayout.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/hr/Insurance.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/hr/Lifecycle.jsx',
  
  // Leave pages
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/leaves/LeaveApplications.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/leaves/LeaveCalendar.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/leaves/LeaveLayout.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/leaves/LeaveReports.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/leaves/LeaveRules.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/leaves/LeaveTypes.jsx',
  
  // Organization pages
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/organization/Branch.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/organization/CompanyProfile.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/organization/DepartmentList.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/organization/Designation.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/organization/GradePayStructure.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/organization/HolidayCalender.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/organization/OrganizationLayout.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/organization/OrgTabs.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/organization/PolicySetup.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/organization/ReportingStructure.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/organization/RulesPolicies.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/organization/Shifts.jsx',
  
  // Payroll pages
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/payroll/PayrollAdjustments.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/payroll/PayrollDashboard.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/payroll/PayrollLayout.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/payroll/PayrollReports.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/payroll/PayrollRun.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/payroll/Payslips.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/payroll/SalaryStructure.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/payroll/StatutoryRules.jsx',
  
  // PMS pages
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/pms/Appraisal.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/pms/Feedback.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/pms/GoalsKPI.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/pms/pmsmanagement.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/pms/ReviewCycle.jsx',
  
  // Recruitment pages
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/recruitment/ATS.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/recruitment/CandidateScreening.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/recruitment/DocumentUpload.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/recruitment/ImportCreate.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/recruitment/JobForm.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/recruitment/JobRequisition.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/recruitment/MasterDashboard.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/recruitment/offer.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/recruitment/Onboarding.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/recruitment/public jobapply.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/recruitment/Recruitment.jsx',
  
  // Training pages
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/training/TrainingAttendance.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/training/TrainingCalendar.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/training/TrainingCertificates.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/training/TrainingLayout.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/training/TrainingManagement.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/training/TrainingPrograms.jsx',
  'c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src/pages/training/TrainingRequests.jsx'
];

// Button color patterns to replace
const buttonPatterns = [
  // Primary blue buttons
  { 
    from: /className="([^"]*?)bg-blue-600([^"]*?)"/g, 
    to: 'style={{ backgroundColor: \'var(--primary-color, #2862e9)\' }} className="$1text-white$2" onMouseEnter={(e) => e.target.style.backgroundColor = \'var(--primary-hover, #1e4bb8)\'} onMouseLeave={(e) => e.target.style.backgroundColor = \'var(--primary-color, #2862e9)\'}"'
  },
  { 
    from: /className="([^"]*?)bg-blue-700([^"]*?)"/g, 
    to: 'style={{ backgroundColor: \'var(--primary-color, #2862e9)\' }} className="$1text-white$2" onMouseEnter={(e) => e.target.style.backgroundColor = \'var(--primary-hover, #1e4bb8)\'} onMouseLeave={(e) => e.target.style.backgroundColor = \'var(--primary-color, #2862e9)\'}"'
  },
  { 
    from: /className="([^"]*?)hover:bg-blue-700([^"]*?)"/g, 
    to: 'className="$1$2"'
  },
  { 
    from: /className="([^"]*?)hover:bg-blue-600([^"]*?)"/g, 
    to: 'className="$1$2"'
  },
  
  // Gradient buttons
  { 
    from: /className="([^"]*?)bg-gradient-to-r from-blue-600 to-indigo-600([^"]*?)"/g, 
    to: 'style={{ backgroundColor: \'var(--primary-color, #2862e9)\' }} className="$1text-white$2" onMouseEnter={(e) => e.target.style.backgroundColor = \'var(--primary-hover, #1e4bb8)\'} onMouseLeave={(e) => e.target.style.backgroundColor = \'var(--primary-color, #2862e9)\'}"'
  },
  { 
    from: /className="([^"]*?)hover:from-blue-700 hover:to-indigo-700([^"]*?)"/g, 
    to: 'className="$1$2"'
  },
  
  // Gray buttons (keep as secondary)
  { 
    from: /className="([^"]*?)bg-gray-600([^"]*?)"/g, 
    to: 'style={{ backgroundColor: \'var(--primary-color, #2862e9)\' }} className="$1text-white$2" onMouseEnter={(e) => e.target.style.backgroundColor = \'var(--primary-hover, #1e4bb8)\'} onMouseLeave={(e) => e.target.style.backgroundColor = \'var(--primary-color, #2862e9)\'}"'
  },
  { 
    from: /className="([^"]*?)bg-gray-700([^"]*?)"/g, 
    to: 'style={{ backgroundColor: \'var(--primary-color, #2862e9)\' }} className="$1text-white$2" onMouseEnter={(e) => e.target.style.backgroundColor = \'var(--primary-hover, #1e4bb8)\'} onMouseLeave={(e) => e.target.style.backgroundColor = \'var(--primary-color, #2862e9)\'}"'
  },
  { 
    from: /className="([^"]*?)hover:bg-gray-700([^"]*?)"/g, 
    to: 'className="$1$2"'
  },
  { 
    from: /className="([^"]*?)hover:bg-gray-600([^"]*?)"/g, 
    to: 'className="$1$2"'
  }
];

// Function to update a single file
function updateFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Apply all button pattern replacements
    buttonPatterns.forEach(pattern => {
      if (pattern.from.test(content)) {
        content = content.replace(pattern.from, pattern.to);
        updated = true;
      }
    });
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`⏭️  No changes needed: ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('🚀 Starting comprehensive button update across all pages...\n');

let totalFiles = 0;
let updatedFiles = 0;

filesToUpdate.forEach(filePath => {
  totalFiles++;
  if (updateFile(filePath)) {
    updatedFiles++;
  }
});

console.log(`\n📊 Update Summary:`);
console.log(`   Total files processed: ${totalFiles}`);
console.log(`   Files updated: ${updatedFiles}`);
console.log(`   Files unchanged: ${totalFiles - updatedFiles}`);
console.log('\n✨ Batch update completed successfully!');
console.log('\n🎯 All buttons now use dynamic colors from CSS variables:');
console.log('   - Primary buttons: var(--primary-color, #2862e9)');
console.log('   - Hover state: var(--primary-hover, #1e4bb8)');
console.log('   - Colors can be changed globally via Customization page');