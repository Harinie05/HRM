import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Calendar, Clock, User, MapPin, CheckCircle } from "lucide-react";
import api from "../../api";

export default function TrainingProgramApplication() {
  const { programId } = useParams();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    employee_id: "",
    department: "",
    experience: "",
    motivation: ""
  });

  useEffect(() => {
    if (programId) {
      fetchProgram();
    }
  }, [programId]);

  const fetchProgram = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/training/programs/${programId}`);
      setProgram(response.data);
    } catch (error) {
      console.error("Error fetching program:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post(`/api/training/programs/${programId}/apply`, formData);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !program) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Program Not Found</h1>
          <p className="text-gray-600">The training program you're looking for doesn't exist or is no longer available.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
          <p className="text-gray-600 mb-4">
            Thank you for applying to <strong>{program.title}</strong>. 
            We'll review your application and get back to you soon.
          </p>
          <p className="text-sm text-gray-500">
            You should receive a confirmation email shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Program Header */}
        <div className="rounded-lg shadow-sm p-8 mb-8 relative overflow-hidden border" style={{ 
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}05 100%)`,
          border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}`
        }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none" style={{
            background: `radial-gradient(circle, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'} 0%, transparent 70%)`,
            transform: 'translate(40%, -40%)'
          }}></div>
          <div className="text-center mb-6 relative z-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{program.title}</h1>
            <p className="text-lg text-gray-600">{program.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">Category</div>
                <div className="text-sm text-gray-600">{program.category}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">Schedule</div>
                <div className="text-sm text-gray-600">
                  {program.startDate && program.endDate 
                    ? `${program.startDate} - ${program.endDate}`
                    : "TBD"
                  }
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">Trainer</div>
                <div className="text-sm text-gray-600">{program.trainer}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">Type</div>
                <div className="text-sm text-gray-600">{program.type}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">Department</div>
                <div className="text-sm text-gray-600">{program.department}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Form */}
        <div className="rounded-lg shadow-sm p-8 relative overflow-hidden border" style={{ 
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}05 100%)`,
          border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}`
        }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none" style={{
            background: `radial-gradient(circle, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'} 0%, transparent 70%)`,
            transform: 'translate(40%, -40%)'
          }}></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 relative z-10">Apply for this Program</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}` }}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}` }}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}` }}
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID (if applicable)</label>
                <input
                  type="text"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}` }}
                  placeholder="Enter your employee ID"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department/Organization</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}` }}
                placeholder="Enter your department or organization"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Relevant Experience</label>
              <textarea
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
                className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}` }}
                rows="3"
                placeholder="Briefly describe your relevant experience or background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Why do you want to join this program? *</label>
              <textarea
                value={formData.motivation}
                onChange={(e) => setFormData({...formData, motivation: e.target.value})}
                className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}` }}
                rows="4"
                placeholder="Tell us why you're interested in this training program and what you hope to achieve"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
