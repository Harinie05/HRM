import { useEffect, useState } from "react";
import api from "../../api";

export default function SettlementDocuments() {
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
      
      alert("F&F Settlement calculated and saved successfully");
    } catch (err) {
      console.error('Settlement calculation error:', err);
      alert("Failed to calculate settlement");
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
      
      alert("Settlement approved successfully");
    } catch (err) {
      console.error('Settlement approval error:', err);
      alert("Failed to approve settlement");
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
      
      alert("Experience letter generated and saved successfully");
    } catch (err) {
      console.error('Experience letter generation error:', err);
      alert("Failed to generate experience letter");
    }
  }

  const updateLetterField = (field, value) => {
    setExperienceLetter(prev => ({
      ...prev,
      [field]: value
    }));
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
      alert('Failed to generate PDF. Please try again.');
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
      
      alert('Experience certificate sent successfully!');
      setShowEmailModal(false);
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Full & Final Settlement & Documents</h1>
      </div>

      {/* Summary Cards - Top Position */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-blue-600">{exits.length}</div>
          <div className="text-sm text-gray-600">Ready for Settlement</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-green-600">
            {exits.filter(e => e.final_settlement_status === 'Completed').length}
          </div>
          <div className="text-sm text-gray-600">Settlements Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {exits.filter(e => (e.final_settlement_status || 'Pending') === 'Pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending Settlements</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-purple-600">
            {exits.filter(e => {
              const handover = e.handover_status || 'Pending';
              const clearance = e.clearance_status || 'Pending';
              const assets = e.asset_return_status || 'Pending';
              const settlement = e.final_settlement_status || 'Pending';
              return handover === 'Completed' && clearance === 'Completed' && assets === 'Completed' && settlement === 'Completed';
            }).length}
          </div>
          <div className="text-sm text-gray-600">Fully Processed</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exit List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Ready for Settlement</h3>
          <div className="space-y-3">
            {exits.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-sm">No employees ready for settlement.</div>
                <div className="text-xs mt-1">Complete exit interviews first.</div>
              </div>
            ) : (
              exits.map((exit) => (
                <div
                  key={exit.id}
                  onClick={() => setSelectedExit(exit)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedExit?.id === exit.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{exit.employee_name || `Employee #${exit.employee_id}`}</div>
                  <div className="text-sm text-gray-500">Code: {exit.employee_code || 'N/A'}</div>
                  <div className="text-sm text-gray-500">Last Working: {exit.last_working_day || 'N/A'}</div>
                  <div className="text-sm text-gray-500">Notice: {exit.notice_period || '30'} days</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Settlement Details */}
        <div className="bg-white rounded-lg shadow p-6">
          {selectedExit ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">F&F Settlement</h3>
                {!settlement && (
                  <button
                    onClick={handleCalculateSettlement}
                    className="bg-blue-600 px-3 py-1 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Calculate Settlement
                  </button>
                )}
              </div>

              {settlement ? (
                <div className="space-y-4">
                  {/* Settlement Breakdown */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Settlement Breakdown</h4>
                    
                    {/* Earnings Section */}
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-green-700 mb-2">EARNINGS</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Pending Salary:</span>
                          <span className="font-medium">₹{settlement.breakdown.pending_salary.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Leave Encashment:</span>
                          <span className="font-medium">₹{settlement.breakdown.leave_encashment.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bonus:</span>
                          <span className="font-medium">₹{settlement.breakdown.bonus.toLocaleString()}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between font-semibold text-green-600">
                          <span>Total Earnings:</span>
                          <span>₹{settlement.gross_amount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Deductions Section */}
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-red-700 mb-2">DEDUCTIONS</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>TDS (10%):</span>
                          <span className="font-medium">₹{settlement.breakdown.tds.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>PF (12%):</span>
                          <span className="font-medium">₹{settlement.breakdown.pf.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Professional Tax:</span>
                          <span className="font-medium">₹{settlement.breakdown.professional_tax.toLocaleString()}</span>
                        </div>
                        {settlement.breakdown.advance_recovery > 0 && (
                          <div className="flex justify-between">
                            <span>Advance Recovery:</span>
                            <span className="font-medium">₹{settlement.breakdown.advance_recovery.toLocaleString()}</span>
                          </div>
                        )}
                        {settlement.breakdown.loan_recovery > 0 && (
                          <div className="flex justify-between">
                            <span>Loan Recovery:</span>
                            <span className="font-medium">₹{settlement.breakdown.loan_recovery.toLocaleString()}</span>
                          </div>
                        )}
                        <hr className="my-2" />
                        <div className="flex justify-between font-semibold text-red-600">
                          <span>Total Deductions:</span>
                          <span>₹{settlement.total_deductions.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Net Payable */}
                    <div className="bg-white p-3 rounded border-2 border-green-200">
                      <div className="flex justify-between text-lg font-bold text-green-600">
                        <span>NET PAYABLE:</span>
                        <span>₹{settlement.net_payable.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Payment Status:</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        settlement.payment_status === 'Approved' ? 'bg-green-100 text-green-800' :
                        settlement.payment_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {settlement.payment_status}
                      </span>
                    </div>
                    
                    {settlement.payment_status === 'Pending' && (
                      <button
                        onClick={handleApproveSettlement}
                        className="mt-3 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                      >
                        Approve Settlement
                      </button>
                    )}
                  </div>

                  {/* Settlement Details */}
                  <div className="text-sm text-gray-600 space-y-1">
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
                <div className="text-center text-gray-500 py-8">
                  Click "Calculate Settlement" to generate F&F statement
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Select an employee to view settlement details
            </div>
          )}
        </div>

        {/* Experience Letter */}
        <div className="bg-white rounded-lg shadow p-6">
          {selectedExit ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Experience Letter</h3>
                <div className="space-x-2">
                  {!experienceLetter ? (
                    <button
                      onClick={handleGenerateExperienceLetter}
                      className="bg-green-600 px-3 py-1 text-white text-sm rounded hover:bg-green-700"
                    >
                      Generate Letter
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditingLetter(!isEditingLetter)}
                      className="bg-blue-600 px-3 py-1 text-white text-sm rounded hover:bg-blue-700"
                    >
                      {isEditingLetter ? 'Preview' : 'Edit'}
                    </button>
                  )}
                </div>
              </div>

              {experienceLetter ? (
                <div className="space-y-4">
                  {/* Editable Form or Letter Preview */}
                  {isEditingLetter ? (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <h4 className="font-medium mb-3">Edit Experience Letter Details</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">Employee Name</label>
                          <input
                            type="text"
                            value={experienceLetter.employee_name}
                            onChange={(e) => updateLetterField('employee_name', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Employee Code</label>
                          <input
                            type="text"
                            value={experienceLetter.employee_code}
                            onChange={(e) => updateLetterField('employee_code', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Company Name</label>
                          <input
                            type="text"
                            value={experienceLetter.company_name}
                            onChange={(e) => updateLetterField('company_name', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Designation</label>
                          <input
                            type="text"
                            value={experienceLetter.designation}
                            onChange={(e) => updateLetterField('designation', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Department</label>
                          <input
                            type="text"
                            value={experienceLetter.department}
                            onChange={(e) => updateLetterField('department', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Joining Date</label>
                          <input
                            type="date"
                            value={experienceLetter.joining_date}
                            onChange={(e) => updateLetterField('joining_date', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Last Working Day</label>
                          <input
                            type="date"
                            value={experienceLetter.last_working_day}
                            onChange={(e) => updateLetterField('last_working_day', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Place</label>
                          <input
                            type="text"
                            value={experienceLetter.place || 'Bangalore'}
                            onChange={(e) => updateLetterField('place', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Issued By</label>
                          <input
                            type="text"
                            value={experienceLetter.issued_by}
                            onChange={(e) => updateLetterField('issued_by', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Authorized Signatory</label>
                          <input
                            type="text"
                            value={experienceLetter.authorized_signatory || 'HR Manager'}
                            onChange={(e) => updateLetterField('authorized_signatory', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg text-sm">
                      <div className="text-center font-bold mb-4 text-lg">EXPERIENCE CERTIFICATE</div>
                      <div className="space-y-3 leading-relaxed">
                        <p>This is to certify that <strong>{experienceLetter.employee_name}</strong> (Employee Code: <strong>{experienceLetter.employee_code}</strong>) was employed with <strong>{experienceLetter.company_name}</strong> as <strong>{experienceLetter.designation}</strong> in the <strong>{experienceLetter.department}</strong>.</p>
                        
                        <p>The period of employment was from <strong>{new Date(experienceLetter.joining_date).toLocaleDateString('en-GB')}</strong> to <strong>{new Date(experienceLetter.last_working_day).toLocaleDateString('en-GB')}</strong>.</p>
                        
                        <p>During the tenure with our organization, {experienceLetter.employee_name} demonstrated professionalism and contributed effectively to the team. The employee's conduct and performance were satisfactory throughout the employment period.</p>
                        
                        <p>We wish {experienceLetter.employee_name} all the best for future endeavors.</p>
                        
                        <div className="mt-6 pt-4 border-t">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-semibold">For {experienceLetter.company_name}</p>
                              <div className="mt-8">
                                <div className="border-t border-gray-400 w-32"></div>
                                <p className="text-xs mt-1">{experienceLetter.authorized_signatory}</p>
                                <p className="text-xs">{experienceLetter.issued_by}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p><strong>Date:</strong> {new Date(experienceLetter.issued_date).toLocaleDateString('en-GB')}</p>
                              <p><strong>Place:</strong> {experienceLetter.place}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Letter Status */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Status:</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        experienceLetter.status === 'Generated' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {experienceLetter.status}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button 
                      onClick={handleDownloadPDF}
                      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                    >
                      Download PDF
                    </button>
                    <button 
                      onClick={handleEmailEmployee}
                      className="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
                    >
                      Email to Employee
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Click "Generate Letter" to create experience certificate
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Select an employee to generate experience letter
            </div>
          )}
        </div>
      </div>
    </div>
  );
}