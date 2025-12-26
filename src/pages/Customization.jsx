import { useState, useEffect } from "react";
import Layout from "../components/Layout";

export default function Customization() {
  const [activeTab, setActiveTab] = useState("branding");
  const [colors, setColors] = useState({
    primaryColor: "#2862e9",
    primaryDark: "#474e71", 
    sidebarBg: "#628bf3",
    contentBg: "#f8fafc",
    cardBg: "#ffffff",
    borderColor: "#e2e8f0",
    textColor: "#dddddd",
    mutedText: "#64748b",
    iconColor: "#0f172a",
    iconBg: "#e2e8f0"
  });

  const [orgDetails, setOrgDetails] = useState({
    name: "Your Hospital Name",
    tagline: "Smart • Secure • NABH-Standard", 
    address: "Address line for letterhead & PDFs",
    phone: "+91-XXXXXXXXXX",
    email: "info@example.com",
    website: "https://your-hospital.com",
    gstin: "GSTIN (optional, for bills)"
  });

  const updateColor = (colorKey, value) => {
    setColors(prev => ({ ...prev, [colorKey]: value }));
    
    // Apply to CSS variables immediately
    if (colorKey === 'sidebarBg') {
      document.documentElement.style.setProperty('--sidebar-bg', value);
    }
    if (colorKey === 'primaryColor') {
      document.documentElement.style.setProperty('--primary-color', value);
    }
    if (colorKey === 'primaryDark') {
      document.documentElement.style.setProperty('--header-bg', value);
    }
  };

  const saveSettings = () => {
    // Save to localStorage
    localStorage.setItem('org-details', JSON.stringify(orgDetails));
    localStorage.setItem('theme-colors', JSON.stringify(colors));
    
    // Update localStorage keys that Header and Sidebar use
    localStorage.setItem('hospital_name', orgDetails.name);
    localStorage.setItem('hospital_tagline', orgDetails.tagline);
    
    // Force page reload to update all components
    window.location.reload();
  };

  useEffect(() => {
    const savedColors = localStorage.getItem('theme-colors');
    const savedOrg = localStorage.getItem('org-details');
    
    if (savedColors) {
      const theme = JSON.parse(savedColors);
      setColors(prev => ({ ...prev, ...theme }));
    }
    
    if (savedOrg) {
      setOrgDetails(JSON.parse(savedOrg));
    } else {
      // Load from existing localStorage keys if available
      const hospitalName = localStorage.getItem('hospital_name');
      const hospitalTagline = localStorage.getItem('hospital_tagline');
      if (hospitalName || hospitalTagline) {
        setOrgDetails(prev => ({
          ...prev,
          name: hospitalName || prev.name,
          tagline: hospitalTagline || prev.tagline
        }));
      }
    }
  }, []);

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customization & Templates</h1>
          <p className="text-gray-600 mt-1">Configure organisation identity, logo, UI colors, and global PDF header/footer for all NABH HIMS documents.</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex border-b bg-gray-50">
            <button
              onClick={() => setActiveTab("branding")}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "branding"
                  ? "bg-white text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Branding & Organisation
            </button>
            <button
              onClick={() => setActiveTab("colors")}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "colors"
                  ? "bg-white text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Color Palette
            </button>
          </div>

          <div className="p-6">
            {activeTab === "branding" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Organisation details</h3>
                  <p className="text-gray-600 text-sm mb-4">These values appear on letterheads, EMR PDFs, discharge summaries and other NABH documents.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Organisation name</label>
                    <input
                      type="text"
                      value={orgDetails.name}
                      onChange={(e) => setOrgDetails(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
                    <input
                      type="text"
                      value={orgDetails.tagline}
                      onChange={(e) => setOrgDetails(prev => ({ ...prev, tagline: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <textarea
                      value={orgDetails.address}
                      onChange={(e) => setOrgDetails(prev => ({ ...prev, address: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="text"
                      value={orgDetails.phone}
                      onChange={(e) => setOrgDetails(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={orgDetails.email}
                      onChange={(e) => setOrgDetails(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <input
                      type="url"
                      value={orgDetails.website}
                      onChange={(e) => setOrgDetails(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GSTIN</label>
                    <input
                      type="text"
                      value={orgDetails.gstin}
                      onChange={(e) => setOrgDetails(prev => ({ ...prev, gstin: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "colors" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Color palette</h3>
                  <p className="text-gray-600 text-sm mb-6">Tune application colors. These drive sidebar, primary buttons and card backgrounds.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary color (buttons, highlights)</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.primaryColor}
                        onChange={(e) => updateColor('primaryColor', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.primaryColor}
                        onChange={(e) => updateColor('primaryColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary dark (topbar / hover)</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.primaryDark}
                        onChange={(e) => updateColor('primaryDark', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.primaryDark}
                        onChange={(e) => updateColor('primaryDark', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sidebar background color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.sidebarBg}
                        onChange={(e) => updateColor('sidebarBg', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.sidebarBg}
                        onChange={(e) => updateColor('sidebarBg', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content background color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.contentBg}
                        onChange={(e) => updateColor('contentBg', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.contentBg}
                        onChange={(e) => updateColor('contentBg', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card background color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.cardBg}
                        onChange={(e) => updateColor('cardBg', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.cardBg}
                        onChange={(e) => updateColor('cardBg', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Border color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.borderColor}
                        onChange={(e) => updateColor('borderColor', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.borderColor}
                        onChange={(e) => updateColor('borderColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Text color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.textColor}
                        onChange={(e) => updateColor('textColor', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.textColor}
                        onChange={(e) => updateColor('textColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Muted text color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.mutedText}
                        onChange={(e) => updateColor('mutedText', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.mutedText}
                        onChange={(e) => updateColor('mutedText', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Icon color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.iconColor}
                        onChange={(e) => updateColor('iconColor', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.iconColor}
                        onChange={(e) => updateColor('iconColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Icon background color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.iconBg}
                        onChange={(e) => updateColor('iconBg', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.iconBg}
                        onChange={(e) => updateColor('iconBg', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Logos & PDF artwork are managed in the PDF Header / Footer tab.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Save branding
          </button>
        </div>
      </div>
    </Layout>
  );
}