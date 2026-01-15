import { useEffect, useState } from "react";
import { DollarSign, FileText, Download, Mail, CheckCircle, Clock } from "lucide-react";
import api from "../../api";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function SettlementDocuments() {
  const { toast, showToast } = useToast();
  
  // Permission checks
  const canView = isAdmin() || hasPermission('view_settlements');
  const canCalculate = isAdmin() || hasPermission('calculate_settlements');
  const canApprove = isAdmin() || hasPermission('approve_settlements');
  const canGenerateLetter = isAdmin() || hasPermission('generate_experience_letter');
  const canDownloadPDF = isAdmin() || hasPermission('download_settlement_pdf');
  const canEmail = isAdmin() || hasPermission('email_settlement_docs');
  const canEdit = isAdmin() || hasPermission('edit_settlements');
  
  // Fetch branding colors
  useEffect(() => {
    const fetchBrandingColors = async () => {
      try {
        const tenantCode = localStorage.getItem('tenant_code');
        if (tenantCode) {
          const response = await api.get(`/auth/branding/${tenantCode}`);
          document.documentElement.style.setProperty('--primary-color', response.data.primary_color || '#2862e9');
          document.documentElement.style.setProperty('--secondary-color', response.data.secondary_color || '#474e71');
        }
      } catch (error) {
        console.error('Error fetching branding colors:', error);
      }
    };
    fetchBrandingColors();
  }, []);
  
  if (!canView) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You do not have permission to view F&F settlements.</p>
        </div>
      </div>
    );
  }
  const [exits, setExits] = useState([]);
  const [selectedExit, setSelectedExit] = useState(null);
  const [settlement, setSettlement] = useState(null);
  const [experienceLetter, setExperienceLetter] = useState(null);
  const [isEditingLetter, setIsEditingLetter] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    body: ''
  });

  // Load exits that are ready for settlement
  useEffect(() => {
    async function fetchExits() {
      try {
        const res = await api.get("/api/resignation/list");
        // Filter for resignations with completed exit interviews
        const readyForSettlement = res.data.resignations?.filter(resignation => {
          return resignation.exit_interview_completed === true;
        }) || [];
        
        setExits(readyForSettlement);
      } catch (err) {
        console.log("Error loading exits", err);
        setExits([]);
      }
    }
    fetchExits();
  }, []);

  // Load settlement and experience letter for selected exit
  useEffect(() => {
    if (selectedExit) {
      // Load existing settlement and experience letter from database
      loadSettlementData();
    }
  }, [selectedExit]);

  const loadSettlementData = async () => {
    try {
      const response = await api.get(`/api/settlement/by-resignation/${selectedExit.id}`);
      
      if (response.data.settlement) {
        const dbSettlement = response.data.settlement;
        setSettlement({
          id: dbSettlement.id,
          employee_id: dbSettlement.employee_id,
          employee_name: selectedExit.employee_name,
          gross_amount: dbSettlement.gross_amount,
          total_deductions: dbSettlement.total_deductions,
          net_payable: dbSettlement.net_payable,
          breakdown: {
            pending_salary: dbSettlement.pending_salary,
            leave_encashment: dbSettlement.leave_encashment,
            bonus: dbSettlement.bonus,
            tds: dbSettlement.tds,
            pf: dbSettlement.pf,
            professional_tax: dbSettlement.professional_tax,
            advance_recovery: dbSettlement.advance_recovery,
            loan_recovery: dbSettlement.loan_recovery
          },
          payment_status: dbSettlement.payment_status,
          payment_mode: dbSettlement.payment_mode,
          calculated_on: dbSettlement.calculated_on,
          calculated_by: dbSettlement.calculated_by,
          paid_on: dbSettlement.paid_on,
          remarks: dbSettlement.remarks
        });
      } else {
        setSettlement(null);
      }
      
      if (response.data.experience_letter) {
        setExperienceLetter(response.data.experience_letter);
      } else {
        setExperienceLetter(null);
      }
    } catch (error) {
      console.error('Error loading settlement data:', error);
      setSettlement(null);
      setExperienceLetter(null);
    }
  };

  const calculateSettlement = (employee, resignationData) => {
    // Mock employee salary data (in real system, fetch from payroll/employee master)
    const mockEmployeeData = {
      basic_salary: 30000,
      hra: 12000,
      allowances: 8000,
      joining_date: '2022-01-15',
      unused_leave_days: 12,
      advance_taken: 5000,
      loan_balance: 0
    };
    
    const { basic_salary, hra, allowances, unused_leave_days, advance_taken, loan_balance } = mockEmployeeData;
    const monthly_gross = basic_salary + hra + allowances;
    
    // Calculate working days in notice period
    const resignationDate = new Date(resignationData.resignation_date);
    const lastWorkingDate = new Date(resignationData.last_working_day);
    const noticeDays = Math.ceil((lastWorkingDate - resignationDate) / (1000 * 60 * 60 * 24));
    const workingDaysInMonth = 26; // Standard working days
    
    // EARNINGS CALCULATION
    const pendingSalary = (monthly_gross / workingDaysInMonth) * Math.min(noticeDays, workingDaysInMonth);
    const leaveEncashment = (basic_salary / workingDaysInMonth) * unused_leave_days;
    const bonus = monthly_gross * 0.1; // 10% bonus
    
    const totalEarnings = pendingSalary + leaveEncashment + bonus;
    
    // DEDUCTIONS CALCULATION
    const tds = totalEarnings * 0.1; // 10% TDS
    const pf = basic_salary * 0.12; // 12% PF
    const professionalTax = 200;
    const advanceRecovery = advance_taken;
    const loanRecovery = loan_balance;
    
    const totalDeductions = tds + pf + professionalTax + advanceRecovery + loanRecovery;
    
    const netPayable = totalEarnings - totalDeductions;
    
    return {
      breakdown: {
        // Earnings
        pending_salary: Math.round(pendingSalary),
        leave_encashment: Math.round(leaveEncashment),
        bonus: Math.round(bonus),
        // Deductions
        tds: Math.round(tds),
        pf: Math.round(pf),
        professional_tax: professionalTax,
        advance_recovery: advanceRecovery,
        loan_recovery: loanRecovery
      },
      totals: {
        gross_amount: Math.round(totalEarnings),
        total_deductions: Math.round(totalDeductions),
        net_payable: Math.round(netPayable)
      }
    };
  };

  async function handleCalculateSettlement() {
    try {
      const calculation = calculateSettlement(selectedExit, selectedExit);
      
      const settlementData = {
        employee_id: selectedExit.employee_id,
        resignation_id: selectedExit.id,
        pending_salary: calculation.breakdown.pending_salary,
        leave_encashment: calculation.breakdown.leave_encashment,
        bonus: calculation.breakdown.bonus,
        tds: calculation.breakdown.tds,
        pf: calculation.breakdown.pf,
        professional_tax: calculation.breakdown.professional_tax,
        advance_recovery: calculation.breakdown.advance_recovery,
        loan_recovery: calculation.breakdown.loan_recovery,
        gross_amount: calculation.totals.gross_amount,
        total_deductions: calculation.totals.total_deductions,
        net_payable: calculation.totals.net_payable,
        calculated_by: 'HR System'
      };
      
      const response = await api.post('/api/settlement/calculate', settlementData);
      
      // Set settlement with database response
      setSettlement({
        id: response.data.id,
        employee_id: selectedExit.employee_id,
        employee_name: selectedExit.employee_name,
        ...calculation.totals,
        breakdown: calculation.breakdown,
        payment_status: 'Pending',
        payment_mode: 'Bank Transfer',
        calculated_on: new Date().toISOString().split('T')[0],
        calculated_by: 'HR System'
      });
      
      showToast("F&F Settlement calculated and saved successfully", "success");
    } catch (err) {
      console.error('Settlement calculation error:', err);
      showToast("Failed to calculate settlement", "error");
    }
  }

  async function handleApproveSettlement() {
    try {
      await api.put(`/api/settlement/approve/${settlement.id}`);
      
      setSettlement(prev => ({
        ...prev,
        payment_status: 'Approved',
        paid_on: new Date().toISOString().split('T')[0]
      }));
      
      showToast("Settlement approved successfully", "success");
    } catch (err) {
      console.error('Settlement approval error:', err);
      showToast("Failed to approve settlement", "error");
    }
  }

  async function handleGenerateExperienceLetter() {
    try {
      const mockJoiningDate = '2022-03-15';
      const companyName = 'Nutryah Healthcare Solutions';
      
      const letterData = {
        employee_id: selectedExit.employee_id,
        resignation_id: selectedExit.id,
        employee_name: selectedExit.employee_name || 'Employee Name',
        employee_code: selectedExit.employee_code || 'EMP001',
        company_name: companyName,
        designation: 'Software Developer',
        department: 'IT Department',
        joining_date: mockJoiningDate,
        last_working_day: selectedExit.last_working_day,
        place: 'Bangalore',
        issued_by: 'HR Department',
        authorized_signatory: 'HR Manager'
      };
      
      const response = await api.post('/api/settlement/experience-letter', letterData);
      
      setExperienceLetter({
        id: response.data.id,
        status: 'Generated',
        issued_by: 'HR Department',
        issued_date: new Date().toISOString().split('T')[0],
        ...letterData
      });
      
      showToast("Experience letter generated and saved successfully", "success");
    } catch (err) {
      console.error('Experience letter generation error:', err);
      showToast("Failed to generate experience letter", "error");
    }
  }

  const updateLetterField = (field, value) => {
    setExperienceLetter(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveExperienceLetter = async () => {
    try {
      const letterData = {
        employee_name: experienceLetter.employee_name,
        employee_code: experienceLetter.employee_code,
        company_name: experienceLetter.company_name,
        designation: experienceLetter.designation,
        department: experienceLetter.department,
        joining_date: experienceLetter.joining_date,
        last_working_day: experienceLetter.last_working_day,
        place: experienceLetter.place,
        issued_by: experienceLetter.issued_by,
        authorized_signatory: experienceLetter.authorized_signatory
      };
      
      await api.put(`/api/settlement/experience-letter/${experienceLetter.id}`, letterData);
      
      showToast("Experience letter updated successfully", "success");
      setIsEditingLetter(false);
    } catch (err) {
      console.error('Experience letter update error:', err);
      showToast("Failed to update experience letter", "error");
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const pdfData = {
        employee_name: experienceLetter.employee_name,
        employee_code: experienceLetter.employee_code,
        company_name: experienceLetter.company_name,
        designation: experienceLetter.designation,
        department: experienceLetter.department,
        joining_date: experienceLetter.joining_date,
        last_working_day: experienceLetter.last_working_day,
        place: experienceLetter.place || 'Bangalore',
        issued_by: experienceLetter.issued_by,
        authorized_signatory: experienceLetter.authorized_signatory || 'HR Manager',
        issued_date: experienceLetter.issued_date
      };
      
      const response = await api.post('/api/generate-experience-pdf', pdfData, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Experience_Certificate_${experienceLetter.employee_code}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Failed to generate PDF. Please try again.', 'error');
    }
  };

  const handleEmailEmployee = () => {
    // Get employee email (mock - in real system, fetch from employee data)
    const employeeEmail = selectedExit.employee_email || 'employee@company.com';
    
    setEmailData({
      to: employeeEmail,
      subject: `Experience Certificate - ${experienceLetter.employee_name}`,
      body: `Dear ${experienceLetter.employee_name},\n\nPlease find attached your Experience Certificate.\n\nBest regards,\n${experienceLetter.issued_by}\n${experienceLetter.company_name}`
    });
    
    setShowEmailModal(true);
  };

  const sendEmail = async () => {
    try {
      const emailPayload = {
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        attachment: {
          filename: `Experience_Certificate_${experienceLetter.employee_code}.pdf`,
          content: 'base64_pdf_content'
        },
        employee_data: {
          employee_name: experienceLetter.employee_name,
          employee_code: experienceLetter.employee_code,
          company_name: experienceLetter.company_name,
          designation: experienceLetter.designation,
          department: experienceLetter.department,
          joining_date: experienceLetter.joining_date,
          last_working_day: experienceLetter.last_working_day,
          place: experienceLetter.place || 'Bangalore',
          issued_by: experienceLetter.issued_by,
          authorized_signatory: experienceLetter.authorized_signatory || 'HR Manager',
          issued_date: experienceLetter.issued_date
        }
      };
      
      await api.post('/api/send-email', emailPayload);
      
      // Update email status in database
      if (experienceLetter.id) {
        await api.put(`/api/settlement/experience-letter/${experienceLetter.id}/email`, {
          email_to: emailData.to
        });
      }
      
      showToast('Experience certificate sent successfully!', 'success');
      setShowEmailModal(false);
    } catch (error) {
      console.error('Error sending email:', error);
      showToast('Failed to send email. Please try again.', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05 100%)`,
          borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(40%, -40%)'
          }}></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(-40%, 40%)'
          }}></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="min-w-0 flex-1">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Pending Settlements</p>
              <p className="text-2xl font-bold text-gray-900">{exits.filter(e => (e.final_settlement_status || 'Pending') === 'Pending').length}</p>
              <p className="text-gray-400 text-xs mt-1">Awaiting action</p>
            </div>
            <div className="p-3 rounded-lg" style={{
              backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
            }}>
              <Clock className="h-6 w-6" style={{
                color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
              }} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05 100%)`,
          borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(40%, -40%)'
          }}></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(-40%, 40%)'
          }}></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="min-w-0 flex-1">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Fully Processed</p>
              <p className="text-2xl font-bold text-gray-900">
                {exits.filter(e => {
                  const handover = e.handover_status || 'Pending';
                  const clearance = e.clearance_status || 'Pending';
                  const assets = e.asset_return_status || 'Pending';
                  const settlement = e.final_settlement_status || 'Pending';
                  return handover === 'Completed' && clearance === 'Completed' && assets === 'Completed' && settlement === 'Completed';
                }).length}
              </p>
              <p className="text-gray-400 text-xs mt-1">Complete exits</p>
            </div>
            <div className="p-3 rounded-lg" style={{
              backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
            }}>
              <FileText className="h-6 w-6" style={{
                color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
              }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exit List */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden relative" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}03 100%)`,
          borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(40%, -40%)'
          }}></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(-40%, 40%)'
          }}></div>
          <div className="p-5 border-b-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <CheckCircle className="h-5 w-5" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ready for Settlement</h3>
                <p className="text-gray-600 text-sm">Employees with completed exit interviews</p>
              </div>
            </div>
          </div>
          
          <div className="p-5">
            <div className="space-y-3">
              {exits.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No employees ready</h4>
                  <p className="text-gray-600 text-sm">Complete exit interviews first.</p>
                </div>
              ) : (
                exits.map((exit) => {
                  const isSelected = selectedExit?.id === exit.id;
                  
                  return (
                    <div
                      key={exit.id}
                      onClick={() => setSelectedExit(exit)}
                      className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                        isSelected ? 'shadow-md' : 'bg-white hover:bg-gray-50'
                      }`}
                      style={{
                        backgroundColor: isSelected ? `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10` : 'white',
                        borderColor: isSelected ? getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5' : '#e5e7eb'
                      }}
                    >
                      <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">{exit.employee_name || `Employee #${exit.employee_id}`}</div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1">Code: {exit.employee_code || 'N/A'}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Last Working: {exit.last_working_day || 'N/A'}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Notice: {exit.notice_period || '30'} days</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Settlement Details */}
        <div className="bg-white rounded-xl border shadow-sm p-4 relative overflow-hidden" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}03 100%)`,
          borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(40%, -40%)'
          }}></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(-40%, 40%)'
          }}></div>
          {selectedExit ? (
            <>
              <div className="flex justify-between items-center gap-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">F&F Settlement</h3>
                {!settlement && canCalculate && (
                  <button
                    onClick={handleCalculateSettlement}
                    style={{ backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5' }}
                    className="px-3 py-2 text-white text-sm rounded-xl font-medium whitespace-nowrap transition-all duration-200"
                    onMouseEnter={(e) => e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}
                  >
                    Calculate Settlement
                  </button>
                )}
              </div>

              {settlement ? (
                <div className="space-y-4">
                  {/* Settlement Breakdown */}
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-xl border shadow-sm" style={{
                    borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                  }}>
                    <h4 className="font-semibold mb-4 text-gray-900 text-base flex items-center gap-2">
                      <DollarSign className="h-5 w-5" style={{
                        color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                      }} />
                      Settlement Breakdown
                    </h4>
                    
                    {/* Earnings Section */}
                    <div className="mb-4 bg-white rounded-lg p-3 border border-green-100">
                      <h5 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        EARNINGS
                      </h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-600">Pending Salary:</span>
                          <span className="font-semibold text-gray-900">₹{settlement.breakdown.pending_salary.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-600">Leave Encashment:</span>
                          <span className="font-semibold text-gray-900">₹{settlement.breakdown.leave_encashment.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-600">Bonus:</span>
                          <span className="font-semibold text-gray-900">₹{settlement.breakdown.bonus.toLocaleString()}</span>
                        </div>
                        <div className="-t border-green-200 mt-2 pt-2">
                          <div className="flex justify-between items-center font-semibold text-green-700">
                            <span>Total Earnings:</span>
                            <span className="text-lg">₹{settlement.gross_amount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Deductions Section */}
                    <div className="mb-4 bg-white rounded-lg p-3 border border-red-100">
                      <h5 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        DEDUCTIONS
                      </h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-600">TDS (10%):</span>
                          <span className="font-semibold text-gray-900">₹{settlement.breakdown.tds.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-600">PF (12%):</span>
                          <span className="font-semibold text-gray-900">₹{settlement.breakdown.pf.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-600">Professional Tax:</span>
                          <span className="font-semibold text-gray-900">₹{settlement.breakdown.professional_tax.toLocaleString()}</span>
                        </div>
                        {settlement.breakdown.advance_recovery > 0 && (
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600">Advance Recovery:</span>
                            <span className="font-semibold text-gray-900">₹{settlement.breakdown.advance_recovery.toLocaleString()}</span>
                          </div>
                        )}
                        {settlement.breakdown.loan_recovery > 0 && (
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600">Loan Recovery:</span>
                            <span className="font-semibold text-gray-900">₹{settlement.breakdown.loan_recovery.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="-t border-red-200 mt-2 pt-2">
                          <div className="flex justify-between items-center font-semibold text-red-700">
                            <span>Total Deductions:</span>
                            <span className="text-lg">₹{settlement.total_deductions.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Net Payable */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 shadow-md" style={{
                      borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }}>
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold text-gray-700">NET PAYABLE:</span>
                        <span className="text-2xl font-bold" style={{
                          color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                        }}>₹{settlement.net_payable.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="p-4 border rounded-xl bg-white shadow-sm" style={{
                    borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                  }}>
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-gray-900 text-base">Payment Status:</span>
                      <span className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                        settlement.payment_status === 'Approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                        settlement.payment_status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                        'bg-gray-100 text-gray-800 border-0'
                      }`}>
                        {settlement.payment_status}
                      </span>
                    </div>
                    
                    {settlement.payment_status === 'Pending' && canApprove && (
                      <button
                        onClick={handleApproveSettlement}
                        style={{ backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5' }}
                        className="w-full text-white py-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md"
                        onMouseEnter={(e) => e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}
                      >
                        Approve Settlement
                      </button>
                    )}
                  </div>

                  {/* Settlement Details */}
                  <div className="text-sm text-gray-600 space-y-2 bg-gray-50 p-3 rounded-lg border" style={{
                    borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                  }}>
                    <div><strong>Calculated On:</strong> {settlement.calculated_on}</div>
                    <div><strong>Calculated By:</strong> {settlement.calculated_by}</div>
                    <div><strong>Payment Mode:</strong> {settlement.payment_mode}</div>
                    {settlement.paid_on && (
                      <div><strong>Paid On:</strong> {settlement.paid_on}</div>
                    )}
                    {settlement.remarks && (
                      <div><strong>Remarks:</strong> {settlement.remarks}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-600 py-6 sm:py-8 text-sm">
                  Click "Calculate Settlement" to generate F&F statement
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-600 py-6 sm:py-8 text-sm">
              Select an employee to view settlement details
            </div>
          )}
        </div>

        {/* Experience Letter */}
        <div className="bg-white rounded-xl border shadow-sm p-4 relative overflow-hidden" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}03 100%)`,
          borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(40%, -40%)'
          }}></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(-40%, 40%)'
          }}></div>
          {selectedExit ? (
            <>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-medium">Experience Letter</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  {!experienceLetter && canGenerateLetter ? (
                    <button
                      onClick={handleGenerateExperienceLetter}
                      style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
                      className="px-2 sm:px-3 py-1 text-white text-xs sm:text-sm rounded whitespace-nowrap"
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary-color, #474e71)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
                    >
                      Generate Letter
                    </button>
                  ) : experienceLetter && canEdit ? (
                    <button
                      onClick={() => setIsEditingLetter(!isEditingLetter)}
                      style={{ backgroundColor: 'var(--secondary-color, #474e71)' }}
                      className="px-2 sm:px-3 py-1 text-white text-xs sm:text-sm rounded whitespace-nowrap"
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--secondary-color, #474e71)'}
                    >
                      {isEditingLetter ? 'Preview' : 'Edit'}
                    </button>
                  ) : null}
                </div>
              </div>

              {experienceLetter ? (
                <div className="space-y-3 sm:space-y-4">
                  {/* Editable Form or Letter Preview */}
                  {isEditingLetter ? (
                    <div className="bg-gray-50 p-4 rounded-xl space-y-3 border shadow-sm" style={{
                      borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                    }}>
                      <h4 className="font-semibold mb-3 text-base">Edit Experience Letter Details</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">Employee Name</label>
                          <input
                            type="text"
                            value={experienceLetter.employee_name}
                            onChange={(e) => updateLetterField('employee_name', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:border-transparent"
                            style={{
                              backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                              borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Employee Code</label>
                          <input
                            type="text"
                            value={experienceLetter.employee_code}
                            onChange={(e) => updateLetterField('employee_code', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-xs sm:text-sm focus:ring-2 focus:border-transparent"
                            style={{
                              backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                              borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Company Name</label>
                          <input
                            type="text"
                            value={experienceLetter.company_name}
                            onChange={(e) => updateLetterField('company_name', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-xs sm:text-sm focus:ring-2 focus:border-transparent"
                            style={{
                              backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                              borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Designation</label>
                          <input
                            type="text"
                            value={experienceLetter.designation}
                            onChange={(e) => updateLetterField('designation', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-xs sm:text-sm focus:ring-2 focus:border-transparent"
                            style={{
                              backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                              borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Department</label>
                          <input
                            type="text"
                            value={experienceLetter.department}
                            onChange={(e) => updateLetterField('department', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-xs sm:text-sm focus:ring-2 focus:border-transparent"
                            style={{
                              backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                              borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Joining Date</label>
                          <input
                            type="date"
                            value={experienceLetter.joining_date}
                            onChange={(e) => updateLetterField('joining_date', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-xs sm:text-sm focus:ring-2 focus:border-transparent"
                            style={{
                              backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                              borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Last Working Day</label>
                          <input
                            type="date"
                            value={experienceLetter.last_working_day}
                            onChange={(e) => updateLetterField('last_working_day', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-xs sm:text-sm focus:ring-2 focus:border-transparent"
                            style={{
                              backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                              borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Place</label>
                          <input
                            type="text"
                            value={experienceLetter.place || 'Bangalore'}
                            onChange={(e) => updateLetterField('place', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-xs sm:text-sm focus:ring-2 focus:border-transparent"
                            style={{
                              backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                              borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Issued By</label>
                          <input
                            type="text"
                            value={experienceLetter.issued_by}
                            onChange={(e) => updateLetterField('issued_by', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-xs sm:text-sm focus:ring-2 focus:border-transparent"
                            style={{
                              backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                              borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Authorized Signatory</label>
                          <input
                            type="text"
                            value={experienceLetter.authorized_signatory || 'HR Manager'}
                            onChange={(e) => updateLetterField('authorized_signatory', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-xs sm:text-sm focus:ring-2 focus:border-transparent"
                            style={{
                              backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                              borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Save Button */}
                      <div className="mt-3 sm:mt-4">
                        <button
                          onClick={handleSaveExperienceLetter}
                          style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
                          className="w-full text-white py-2 rounded text-sm"
                          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary-color, #474e71)'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-content p-3 sm:p-4 rounded-lg text-xs sm:text-sm border border-gray-300">
                      <div className="text-center font-bold mb-3 sm:mb-4 text-sm sm:text-lg">EXPERIENCE CERTIFICATE</div>
                      <div className="space-y-2 sm:space-y-3 leading-relaxed">
                        <p>This is to certify that <strong>{experienceLetter.employee_name}</strong> (Employee Code: <strong>{experienceLetter.employee_code}</strong>) was employed with <strong>{experienceLetter.company_name}</strong> as <strong>{experienceLetter.designation}</strong> in the <strong>{experienceLetter.department}</strong>.</p>
                        
                        <p>The period of employment was from <strong>{new Date(experienceLetter.joining_date).toLocaleDateString('en-GB')}</strong> to <strong>{new Date(experienceLetter.last_working_day).toLocaleDateString('en-GB')}</strong>.</p>
                        
                        <p>During the tenure with our organization, {experienceLetter.employee_name} demonstrated professionalism and contributed effectively to the team. The employee's conduct and performance were satisfactory throughout the employment period.</p>
                        
                        <p>We wish {experienceLetter.employee_name} all the best for future endeavors.</p>
                        
                        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-0">
                            <div>
                              <p className="font-semibold">For {experienceLetter.company_name}</p>
                              <div className="mt-6 sm:mt-8">
                                <div className="-t border-gray-400 w-24 sm:w-32" style={{borderColor: 'var(--border-color, #e2e8f0)'}}></div>
                                <p className="text-xs mt-1">{experienceLetter.authorized_signatory}</p>
                                <p className="text-xs">{experienceLetter.issued_by}</p>
                              </div>
                            </div>
                            <div className="text-left sm:text-right">
                              <p><strong>Date:</strong> {new Date(experienceLetter.issued_date).toLocaleDateString('en-GB')}</p>
                              <p><strong>Place:</strong> {experienceLetter.place}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Letter Status */}
                  <div className="p-3 sm:p-4 border rounded-lg" style={{
                    borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                  }}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                      <span className="font-medium text-sm sm:text-base">Status:</span>
                      <span className={`px-2 py-1 text-xs rounded-full self-start sm:self-auto ${
                        experienceLetter.status === 'Generated' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-primary'
                      }`}>
                        {experienceLetter.status}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    {canDownloadPDF && (
                      <button 
                        onClick={handleDownloadPDF}
                        style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
                        className="w-full text-white py-2 rounded text-sm"
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary-color, #474e71)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
                      >
                        Download PDF
                      </button>
                    )}
                    {canEmail && (
                      <button 
                        onClick={handleEmailEmployee}
                        style={{ backgroundColor: 'var(--secondary-color, #474e71)' }}
                        className="w-full text-white py-2 rounded text-sm"
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--secondary-color, #474e71)'}
                      >
                        Email to Employee
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted py-6 sm:py-8 text-sm">
                  Click "Generate Letter" to create experience certificate
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-muted py-6 sm:py-8 text-sm">
              Select an employee to generate experience letter
            </div>
          )}
        </div>
      </div>
      <Toast {...toast} />
    </div>
  );
}


