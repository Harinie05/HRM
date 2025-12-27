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
    
    // Apply to CSS variables immediately for live preview
    if (colorKey === 'primaryColor') {
      document.documentElement.style.setProperty('--primary-color', value);
      document.documentElement.style.setProperty('--primary-bg', value);
      // Calculate hover color (darker version)
      const hoverColor = adjustBrightness(value, -20);
      document.documentElement.style.setProperty('--primary-hover', hoverColor);
    } else if (colorKey === 'primaryDark') {
      document.documentElement.style.setProperty('--header-bg', value);
    } else if (colorKey === 'sidebarBg') {
      document.documentElement.style.setProperty('--sidebar-bg', value);
    } else if (colorKey === 'cardBg') {
      document.documentElement.style.setProperty('--card-bg', value);
    } else {
      document.documentElement.style.setProperty(`--${colorKey.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
    }
  };

  // Helper function to adjust brightness for hover states
  const adjustBrightness = (hex, percent) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  const saveSettings = () => {
    localStorage.setItem('org-details', JSON.stringify(orgDetails));
    localStorage.setItem('theme-colors', JSON.stringify(colors));
    localStorage.setItem('hospital_name', orgDetails.name);
    localStorage.setItem('hospital_tagline', orgDetails.tagline);
    
    // Apply all colors to CSS variables permanently
    Object.entries(colors).forEach(([key, value]) => {
      if (key === 'primaryColor') {
        document.documentElement.style.setProperty('--primary-color', value);
        document.documentElement.style.setProperty('--primary-bg', value);
        const hoverColor = adjustBrightness(value, -20);
        document.documentElement.style.setProperty('--primary-hover', hoverColor);
      } else if (key === 'primaryDark') {
        document.documentElement.style.setProperty('--header-bg', value);
      } else if (key === 'sidebarBg') {
        document.documentElement.style.setProperty('--sidebar-bg', value);
      } else if (key === 'cardBg') {
        document.documentElement.style.setProperty('--card-bg', value);
      } else {
        document.documentElement.style.setProperty(`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
      }
    });
    
    alert('Settings saved successfully!');
  };

  useEffect(() => {
    const savedColors = localStorage.getItem('theme-colors');
    const savedOrg = localStorage.getItem('org-details');
    
    if (savedColors) {
      const theme = JSON.parse(savedColors);
      setColors(prev => ({ ...prev, ...theme }));
      
      // Apply saved colors to CSS variables on load
      Object.entries(theme).forEach(([key, value]) => {
        if (key === 'primaryColor') {
          document.documentElement.style.setProperty('--primary-color', value);
          document.documentElement.style.setProperty('--primary-bg', value);
          const hoverColor = adjustBrightness(value, -20);
          document.documentElement.style.setProperty('--primary-hover', hoverColor);
        } else if (key === 'primaryDark') {
          document.documentElement.style.setProperty('--header-bg', value);
        } else if (key === 'sidebarBg') {
          document.documentElement.style.setProperty('--sidebar-bg', value);
        } else if (key === 'cardBg') {
          document.documentElement.style.setProperty('--card-bg', value);
        } else {
          document.documentElement.style.setProperty(`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
        }
      });
    }
    
    if (savedOrg) {
      setOrgDetails(JSON.parse(savedOrg));
    } else {
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
          <h1 className="text-2xl font-bold text-primary">Customization & Templates</h1>
          <p className=" mt-1" style={{color: 'var(--text-secondary, #374151)'}}>Configure organisation identity, logo, UI colors, and global PDF header/footer for all NABH HIMS documents.</p>
        </div>

        {/* Tabs */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
          <div className="flex border-b" style={{ backgroundColor: 'var(--content-bg, #f8fafc)', borderBottomColor: 'var(--border-color, #e2e8f0)' }}>
            <button
              onClick={() => setActiveTab("branding")}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "branding"
                  ? "border-b-2" 
                  : "hover:text-primary"
              }`}
              style={{
                backgroundColor: activeTab === "branding" ? 'var(--card-bg, #ffffff)' : 'transparent',
                color: activeTab === "branding" ? 'var(--primary-color, #2862e9)' : 'var(--muted-text, #64748b)',
                borderBottomColor: activeTab === "branding" ? 'var(--primary-color, #2862e9)' : 'transparent'
              }}
            >
              Branding & Organisation
            </button>
            <button
              onClick={() => setActiveTab("colors")}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "colors"
                  ? "border-b-2"
                  : "hover:text-primary"
              }`}
              style={{
                backgroundColor: activeTab === "colors" ? 'var(--card-bg, #ffffff)' : 'transparent',
                color: activeTab === "colors" ? 'var(--primary-color, #2862e9)' : 'var(--muted-text, #64748b)',
                borderBottomColor: activeTab === "colors" ? 'var(--primary-color, #2862e9)' : 'transparent'
              }}
            >
              Color Palette
            </button>
          </div>

          <div className="p-6">
            {activeTab === "branding" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2">Organisation details</h3>
                  <p className=" text-sm mb-4" style={{color: 'var(--text-secondary, #374151)'}}>These values appear on letterheads, EMR PDFs, discharge summaries and other NABH documents.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Organisation name</label>
                    <input
                      type="text"
                      value={orgDetails.name}
                      onChange={(e) => setOrgDetails(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Tagline</label>
                    <input
                      type="text"
                      value={orgDetails.tagline}
                      onChange={(e) => setOrgDetails(prev => ({ ...prev, tagline: e.target.value }))}
                      className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary mb-2">Address</label>
                    <textarea
                      value={orgDetails.address}
                      onChange={(e) => setOrgDetails(prev => ({ ...prev, address: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Phone</label>
                    <input
                      type="text"
                      value={orgDetails.phone}
                      onChange={(e) => setOrgDetails(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Email</label>
                    <input
                      type="email"
                      value={orgDetails.email}
                      onChange={(e) => setOrgDetails(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Website</label>
                    <input
                      type="url"
                      value={orgDetails.website}
                      onChange={(e) => setOrgDetails(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">GSTIN</label>
                    <input
                      type="text"
                      value={orgDetails.gstin}
                      onChange={(e) => setOrgDetails(prev => ({ ...prev, gstin: e.target.value }))}
                      className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "colors" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2">Color palette</h3>
                  <p className=" text-sm mb-6" style={{color: 'var(--text-secondary, #374151)'}}>Tune application colors. These drive sidebar, primary buttons and card backgrounds.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Primary color (buttons, highlights)</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.primaryColor}
                        onChange={(e) => updateColor('primaryColor', e.target.value)}
                        className="w-12 h-10 rounded border border-black cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.primaryColor}
                        onChange={(e) => updateColor('primaryColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Primary dark (header and footer )</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.primaryDark}
                        onChange={(e) => updateColor('primaryDark', e.target.value)}
                        className="w-12 h-10 rounded border border-black cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.primaryDark}
                        onChange={(e) => updateColor('primaryDark', e.target.value)}
                        className="flex-1 px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Sidebar background color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.sidebarBg}
                        onChange={(e) => updateColor('sidebarBg', e.target.value)}
                        className="w-12 h-10 rounded border border-black cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.sidebarBg}
                        onChange={(e) => updateColor('sidebarBg', e.target.value)}
                        className="flex-1 px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Content background color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.contentBg}
                        onChange={(e) => updateColor('contentBg', e.target.value)}
                        className="w-12 h-10 rounded border border-black cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.contentBg}
                        onChange={(e) => updateColor('contentBg', e.target.value)}
                        className="flex-1 px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Card background color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.cardBg}
                        onChange={(e) => updateColor('cardBg', e.target.value)}
                        className="w-12 h-10 rounded border border-black cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.cardBg}
                        onChange={(e) => updateColor('cardBg', e.target.value)}
                        className="flex-1 px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Border color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.borderColor}
                        onChange={(e) => updateColor('borderColor', e.target.value)}
                        className="w-12 h-10 rounded border border-black cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.borderColor}
                        onChange={(e) => updateColor('borderColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Text color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.textColor}
                        onChange={(e) => updateColor('textColor', e.target.value)}
                        className="w-12 h-10 rounded border border-black cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.textColor}
                        onChange={(e) => updateColor('textColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Muted text color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.mutedText}
                        onChange={(e) => updateColor('mutedText', e.target.value)}
                        className="w-12 h-10 rounded border border-black cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.mutedText}
                        onChange={(e) => updateColor('mutedText', e.target.value)}
                        className="flex-1 px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Icon color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.iconColor}
                        onChange={(e) => updateColor('iconColor', e.target.value)}
                        className="w-12 h-10 rounded border border-black cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.iconColor}
                        onChange={(e) => updateColor('iconColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Icon background color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.iconBg}
                        onChange={(e) => updateColor('iconBg', e.target.value)}
                        className="w-12 h-10 rounded border border-black cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.iconBg}
                        onChange={(e) => updateColor('iconBg', e.target.value)}
                        className="flex-1 px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-content rounded-lg">
                  <p className="text-sm text-secondary">Logos & PDF artwork are managed in the PDF Header / Footer tab.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
            className="px-6 py-2 text-white rounded-lg transition-colors"
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-hover, #1e4bb8)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
          >
            Save branding
          </button>
        </div>
      </div>
    </Layout>
  );
}
