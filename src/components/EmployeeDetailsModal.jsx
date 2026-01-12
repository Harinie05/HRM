import React, { useState } from 'react';
import { X, User, Briefcase, GraduationCap, Heart, Users, Award, DollarSign, CreditCard } from 'lucide-react';

const EmployeeDetailsModal = ({ isOpen, onClose, employeeDetails }) => {
  const [activeTab, setActiveTab] = useState('basic');

  if (!isOpen || !employeeDetails) return null;

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'medical', label: 'Medical', icon: Heart },
    { id: 'family', label: 'Family', icon: Users },
    { id: 'skills', label: 'Skills', icon: Award },
    { id: 'salary', label: 'Salary', icon: DollarSign },
    { id: 'bank', label: 'Bank Details', icon: CreditCard }
  ];

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <p className="text-sm text-gray-900">{employeeDetails.name || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
          <p className="text-sm text-gray-900">{employeeDetails.employee_code || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <p className="text-sm text-gray-900">{employeeDetails.email || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
          <p className="text-sm text-gray-900">{employeeDetails.designation || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <p className="text-sm text-gray-900">{employeeDetails.department || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
          <p className="text-sm text-gray-900">{employeeDetails.joining_date || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            employeeDetails.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {employeeDetails.status || 'N/A'}
          </span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employee Type</label>
          <p className="text-sm text-gray-900">{employeeDetails.employee_type || 'N/A'}</p>
        </div>
      </div>
    </div>
  );

  const renderExperience = () => (
    <div className="space-y-4">
      {employeeDetails.experience && employeeDetails.experience.length > 0 ? (
        employeeDetails.experience.map((exp, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <p className="text-sm text-gray-900 font-semibold">{exp.company || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <p className="text-sm text-gray-900">{exp.job_title || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <p className="text-sm text-gray-900">
                  {exp.start_date || 'N/A'} - {exp.current_job ? 'Present' : (exp.end_date || 'N/A')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <p className="text-sm text-gray-900">{exp.location || 'N/A'}</p>
              </div>
              {exp.job_description && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
                  <p className="text-sm text-gray-900">{exp.job_description}</p>
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-center py-8">No experience records found</p>
      )}
    </div>
  );

  const renderEducation = () => (
    <div className="space-y-4">
      {employeeDetails.education && employeeDetails.education.length > 0 ? (
        employeeDetails.education.map((edu, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                <p className="text-sm text-gray-900 font-semibold">{edu.degree || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <p className="text-sm text-gray-900">{edu.specialization || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                <p className="text-sm text-gray-900">{edu.university || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <p className="text-sm text-gray-900">{edu.start_year || 'N/A'} - {edu.end_year || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Percentage/CGPA</label>
                <p className="text-sm text-gray-900">{edu.percentage_cgpa || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Education Type</label>
                <p className="text-sm text-gray-900">{edu.education_type || 'N/A'}</p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-center py-8">No education records found</p>
      )}
    </div>
  );

  const renderMedical = () => (
    <div className="space-y-4">
      {employeeDetails.medical ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
            <p className="text-sm text-gray-900">{employeeDetails.medical.blood_group || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
            <p className="text-sm text-gray-900">{employeeDetails.medical.height || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
            <p className="text-sm text-gray-900">{employeeDetails.medical.weight || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
            <p className="text-sm text-gray-900">
              {employeeDetails.medical.emergency_contact_name || 'N/A'}
              {employeeDetails.medical.emergency_contact_phone && ` (${employeeDetails.medical.emergency_contact_phone})`}
            </p>
          </div>
          {employeeDetails.medical.allergies && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
              <p className="text-sm text-gray-900">{employeeDetails.medical.allergies}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">No medical information found</p>
      )}
    </div>
  );

  const renderFamily = () => (
    <div className="space-y-4">
      {employeeDetails.family && employeeDetails.family.length > 0 ? (
        employeeDetails.family.map((member, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-sm text-gray-900 font-semibold">{member.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                <p className="text-sm text-gray-900">{member.relationship || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <p className="text-sm text-gray-900">{member.age || 'N/A'}</p>
              </div>
              {member.contact && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                  <p className="text-sm text-gray-900">{member.contact}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dependent</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  member.dependent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {member.dependent ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-center py-8">No family members found</p>
      )}
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-4">
      {employeeDetails.skills && employeeDetails.skills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {employeeDetails.skills.map((skill, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">{skill.skill_name || 'N/A'}</span>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-sm ${
                      i < (skill.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                    }`}>
                      ★
                    </span>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">({skill.rating || 0}/5)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">No skills found</p>
      )}
    </div>
  );

  const renderSalary = () => (
    <div className="space-y-4">
      {employeeDetails.salary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CTC</label>
            <p className="text-sm text-gray-900 font-semibold">₹{employeeDetails.salary.ctc || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Basic %</label>
            <p className="text-sm text-gray-900">{employeeDetails.salary.basic_percent || 'N/A'}%</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HRA %</label>
            <p className="text-sm text-gray-900">{employeeDetails.salary.hra_percent || 'N/A'}%</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PF Eligible</label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              employeeDetails.salary.pf_eligible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {employeeDetails.salary.pf_eligible ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">No salary information found</p>
      )}
    </div>
  );

  const renderBankDetails = () => (
    <div className="space-y-4">
      {employeeDetails.bank_details ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
            <p className="text-sm text-gray-900">{employeeDetails.bank_details.account_holder_name || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
            <p className="text-sm text-gray-900">{employeeDetails.bank_details.bank_name || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
            <p className="text-sm text-gray-900">{employeeDetails.bank_details.account_number || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
            <p className="text-sm text-gray-900">{employeeDetails.bank_details.ifsc_code || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
            <p className="text-sm text-gray-900">{employeeDetails.bank_details.branch_name || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
            <p className="text-sm text-gray-900">{employeeDetails.bank_details.account_type || 'N/A'}</p>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">No bank details found</p>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic': return renderBasicInfo();
      case 'experience': return renderExperience();
      case 'education': return renderEducation();
      case 'medical': return renderMedical();
      case 'family': return renderFamily();
      case 'skills': return renderSkills();
      case 'salary': return renderSalary();
      case 'bank': return renderBankDetails();
      default: return renderBasicInfo();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Employee Details</h2>
            <p className="text-sm text-gray-600">
              {employeeDetails.name} ({employeeDetails.employee_code})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {renderTabContent()}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsModal;