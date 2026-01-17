import { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import api from "../../api";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function StatutoryRules() {
  const { toast, showToast, hideToast } = useToast();
  const [colors, setColors] = useState({ primary: '#2862e9', secondary: '#474e71' });
  const [form, setForm] = useState({
    pf_enabled: true,
    pf_percent: "12",
    pf_apply_on: "Basic",
    esi_enabled: true,
    esi_threshold: "21000",
    esi_percent: "1.75",
    pt_enabled: true,
    pt_amount: "200",
    tds_enabled: true,
    tds_percent: "10"
  });

  const canView = isAdmin() || hasPermission("view_statutory_rules");
  const canEdit = isAdmin() || hasPermission("edit_statutory_rule");

  const fetchColors = async () => {
    try {
      const tenantCode = localStorage.getItem('tenant_code');
      if (tenantCode) {
        const res = await api.get(`/auth/branding/${tenantCode}`);
        setColors({
          primary: res.data.primary_color || '#2862e9',
          secondary: res.data.secondary_color || '#474e71'
        });
      }
    } catch (err) {
      console.error('Failed to fetch colors:', err);
    }
  };

  if (!canView) {
    return (
      <div className="p-6 text-center">
        <div className="bg-white rounded-2xl border-0 p-8 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You do not have permission to view statutory rules.</p>
        </div>
      </div>
    );
  }

  const fetchRules = async () => {
    try {
      const res = await api.get("/api/payroll/statutory/");
      setForm({
        pf_enabled: res.data.pf_enabled ?? true,
        pf_percent: res.data.pf_percent?.toString() || "12",
        pf_apply_on: res.data.pf_apply_on || "Basic",
        esi_enabled: res.data.esi_enabled ?? true,
        esi_threshold: res.data.esi_threshold?.toString() || "21000",
        esi_percent: res.data.esi_percent?.toString() || "1.75",
        pt_enabled: res.data.pt_enabled ?? true,
        pt_amount: res.data.pt_amount?.toString() || "200",
        tds_enabled: res.data.tds_enabled ?? true,
        tds_percent: res.data.tds_percent?.toString() || "10"
      });
    } catch (err) {
      console.error("Failed to fetch rules:", err);
      showToast("Failed to load statutory rules", "error");
    }
  };

  useEffect(() => {
    fetchRules();
    fetchColors();
  }, []);

  const submit = async () => {
    if (!canEdit) {
      showToast("You do not have permission to edit statutory rules", "error");
      return;
    }
    
    const data = new FormData();
    Object.keys(form).forEach(key => {
      data.append(key, form[key]);
    });

    try {
      await api.post("/api/payroll/statutory/update", data);
      showToast("Statutory rules updated successfully", "success");
    } catch (err) {
      console.error("Failed to update rules:", err);
      showToast("Failed to update statutory rules", "error");
    }
  };

  return (
    <div className="rounded-xl shadow-sm overflow-hidden relative" style={{
      background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`,
      border: `1px solid ${colors.primary}`
    }}>
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20" style={{
        backgroundColor: colors.primary,
        transform: 'translate(40%, -40%)'
      }}></div>
      <div className="p-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{
            backgroundColor: `${colors.primary}20`
          }}>
            <FileText className="h-5 w-5" style={{ color: colors.primary }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Statutory Rules Configuration</h2>
            <p className="text-sm text-gray-600">Configure PF, ESI, Professional Tax and TDS rules</p>
          </div>
        </div>
      </div>

      <div className="p-6 relative z-10">
        <div className="space-y-4">
        <div className="rounded-xl p-6 hover:shadow-md transition-shadow relative overflow-hidden" style={{
          background: `linear-gradient(135deg, white 0%, ${colors.primary}03 100%)`,
          border: `1px solid ${colors.primary}`
        }}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-15" style={{
            backgroundColor: colors.primary,
            transform: 'translate(30%, -30%)'
          }}></div>
          <div className="flex items-center gap-3 mb-5 relative z-10">
            <input 
              type="checkbox"
              checked={form.pf_enabled}
              onChange={(e) => setForm({ ...form, pf_enabled: e.target.checked })}
              className="w-5 h-5 rounded focus:ring-2"
              style={{ 
                accentColor: colors.primary,
                backgroundColor: `${colors.primary}10`
              }}
            />
            <h3 className="text-base font-semibold text-gray-900">Provident Fund (PF)</h3>
          </div>
          
          {form.pf_enabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-8 mt-4 relative z-10">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee PF %</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.pf_percent}
                  onChange={(e) => setForm({ ...form, pf_percent: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm bg-white transition-colors"
                  style={{ 
                    border: `1px solid ${colors.primary}`,
                    backgroundColor: `${colors.primary}10`
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Apply on</label>
                <select
                  value={form.pf_apply_on}
                  onChange={(e) => setForm({ ...form, pf_apply_on: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm bg-white transition-colors"
                  style={{ 
                    border: `1px solid ${colors.primary}`,
                    backgroundColor: `${colors.primary}10`
                  }}
                >
                  <option value="Basic">Basic Salary</option>
                  <option value="Gross">Gross Salary</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl p-6 hover:shadow-md transition-shadow relative overflow-hidden" style={{
          background: `linear-gradient(135deg, white 0%, ${colors.primary}03 100%)`,
          border: `1px solid ${colors.primary}`
        }}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-15" style={{
            backgroundColor: colors.secondary,
            transform: 'translate(30%, -30%)'
          }}></div>
          <div className="flex items-center gap-3 mb-5 relative z-10">
            <input 
              type="checkbox"
              checked={form.esi_enabled}
              onChange={(e) => setForm({ ...form, esi_enabled: e.target.checked })}
              className="w-5 h-5 rounded focus:ring-2"
              style={{ 
                accentColor: colors.primary,
                backgroundColor: `${colors.primary}10`
              }}
            />
            <h3 className="text-base font-semibold text-gray-900">Employee State Insurance (ESI)</h3>
          </div>
          
          {form.esi_enabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-8 mt-4 relative z-10">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Threshold Amount (₹)</label>
                <input
                  type="number"
                  value={form.esi_threshold}
                  onChange={(e) => setForm({ ...form, esi_threshold: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm bg-white transition-colors"
                  style={{ 
                    border: `1px solid ${colors.primary}`,
                    backgroundColor: `${colors.primary}10`
                  }}
                />
                <p className="text-xs text-gray-500 mt-1.5">Salary &gt; threshold → ESI auto = 0</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee ESI %</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.esi_percent}
                  onChange={(e) => setForm({ ...form, esi_percent: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm bg-white transition-colors"
                  style={{ 
                    border: `1px solid ${colors.primary}`,
                    backgroundColor: `${colors.primary}10`
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 hover:shadow-md transition-shadow relative overflow-hidden" style={{
          border: `1px solid ${colors.primary}`
        }}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-15" style={{
            backgroundColor: colors.primary,
            transform: 'translate(30%, -30%)'
          }}></div>
          <div className="flex items-center gap-3 mb-5 relative z-10">
            <input
              type="checkbox"
              checked={form.pt_enabled}
              onChange={(e) => setForm({ ...form, pt_enabled: e.target.checked })}
              className="w-5 h-5 rounded focus:ring-2"
              style={{ 
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                accentColor: colors.primary 
              }}
            />
            <h3 className="text-base font-semibold text-gray-900">Professional Tax (PT)</h3>
          </div>
          
          {form.pt_enabled && (
            <div className="ml-8 mt-4 relative z-10">
              <div className="w-full sm:w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly PT Amount (₹)</label>
                <input
                  type="number"
                  value={form.pt_amount}
                  onChange={(e) => setForm({ ...form, pt_amount: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm bg-white transition-colors"
                  style={{ 
                    border: `1px solid ${colors.primary}`,
                    backgroundColor: `${colors.primary}10`
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 hover:shadow-md transition-shadow relative overflow-hidden" style={{
          border: `1px solid ${colors.primary}`
        }}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-15" style={{
            backgroundColor: colors.secondary,
            transform: 'translate(30%, -30%)'
          }}></div>
          <div className="flex items-center gap-3 mb-5 relative z-10">
            <input
              type="checkbox"
              checked={form.tds_enabled}
              onChange={(e) => setForm({ ...form, tds_enabled: e.target.checked })}
              className="w-5 h-5 rounded focus:ring-2"
              style={{ 
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                accentColor: colors.primary 
              }}
            />
            <h3 className="text-base font-semibold text-gray-900">Tax Deducted at Source (TDS)</h3>
          </div>
          
          {form.tds_enabled && (
            <div className="ml-8 mt-4 relative z-10">
              <div className="w-full sm:w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-2">TDS Flat % (for test)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.tds_percent}
                  onChange={(e) => setForm({ ...form, tds_percent: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm bg-white transition-colors"
                  style={{ 
                    border: `1px solid ${colors.primary}`,
                    backgroundColor: `${colors.primary}10`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {canEdit && (
        <div className="mt-6 flex justify-center sm:justify-end relative z-10">
          <button
            onClick={submit}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.secondary}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
            className="px-8 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 text-sm w-full sm:w-auto justify-center text-white shadow-sm hover:shadow-md"
            style={{ 
              backgroundColor: colors.primary,
              border: `1px solid ${colors.primary}`
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Changes
          </button>
        </div>
      )}
      </div>
      <Toast 
        show={toast.show} 
        message={toast.message} 
        type={toast.type} 
        hideToast={hideToast} 
      />
    </div>
  );
}

