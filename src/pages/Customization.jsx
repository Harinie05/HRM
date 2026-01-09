import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import useToast from "../utils/useToast";
import Toast from "../components/Toast";
import api from "../api";

export default function Customization() {
  const [activeTab, setActiveTab] = useState("branding");
  const { toast, showToast, hideToast } = useToast();
  const [colors, setColors] = useState({
    primaryColor: "#2862e9",
    secondaryColor: "#474e71", 
    sidebarBg: "#628bf3",
    headerFooterBg: "#474e71",
    sidebarTextColor: "#ffffff",
    headerTextColor: "#ffffff"
  });

  const [orgDetails, setOrgDetails] = useState({
    name: "Your Hospital Name",
    tagline: "Smart • Secure • NABH-Standard", 
    address: "Address line for letterhead & PDFs",
    phone: "+91-XXXXXXXXXX",
    email: "info@example.com",
    website: "https://your-hospital.com",
    gstin: "GSTIN (optional, for bills)",
    logo: null,
    logoFilename: null
  });

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOrgDetails(prev => ({
          ...prev,
          logo: event.target.result,
          logoFilename: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const updateColor = (colorKey, value) => {
    setColors(prev => ({ ...prev, [colorKey]: value }));
    
    // Apply to CSS variables immediately for live preview
    if (colorKey === 'primaryColor') {
      document.documentElement.style.setProperty('--primary-color', value);
      document.documentElement.style.setProperty('--primary-bg', value);
      // Calculate hover color (darker version)
      const hoverColor = adjustBrightness(value, -20);
      document.documentElement.style.setProperty('--primary-hover', hoverColor);
    } else if (colorKey === 'secondaryColor') {
      document.documentElement.style.setProperty('--secondary-color', value);
      document.documentElement.style.setProperty('--text-secondary', value);
      document.documentElement.style.setProperty('--muted-text', value);
    } else if (colorKey === 'sidebarBg') {
      document.documentElement.style.setProperty('--sidebar-bg', value);
    } else if (colorKey === 'headerFooterBg') {
      document.documentElement.style.setProperty('--header-bg', value);
      document.documentElement.style.setProperty('--footer-bg', value);
    } else if (colorKey === 'sidebarTextColor') {
      document.documentElement.style.setProperty('--sidebar-text-color', value);
    } else if (colorKey === 'headerTextColor') {
      document.documentElement.style.setProperty('--header-text-color', value);
      document.documentElement.style.setProperty('--text-color', value);
      document.documentElement.style.setProperty('--text-primary', value);
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

  const saveSettings = async () => {
    try {
      // Save to backend API
      const response = await api.post('/api/organization/branding', {
        organization_name: orgDetails.name,
        tagline: orgDetails.tagline,
        address: orgDetails.address,
        phone: orgDetails.phone,
        email: orgDetails.email,
        website: orgDetails.website,
        gstin: orgDetails.gstin,
        logo: orgDetails.logo,
        logo_filename: orgDetails.logoFilename,
        primary_color: colors.primaryColor,
        secondary_color: colors.secondaryColor,
        sidebar_bg: colors.sidebarBg,
        header_footer_bg: colors.headerFooterBg,
        sidebar_text_color: colors.sidebarTextColor,
        header_text_color: colors.headerTextColor
      });

      // Update localStorage with essential data only
      localStorage.setItem('hospital_name', orgDetails.name);
      localStorage.setItem('hospital_tagline', orgDetails.tagline);
      
      // Apply all colors to CSS variables permanently
      Object.entries(colors).forEach(([key, value]) => {
        if (key === 'primaryColor') {
          document.documentElement.style.setProperty('--primary-color', value);
          document.documentElement.style.setProperty('--primary-bg', value);
          const hoverColor = adjustBrightness(value, -20);
          document.documentElement.style.setProperty('--primary-hover', hoverColor);
        } else if (key === 'secondaryColor') {
          document.documentElement.style.setProperty('--secondary-color', value);
          document.documentElement.style.setProperty('--text-secondary', value);
          document.documentElement.style.setProperty('--muted-text', value);
        } else if (key === 'sidebarBg') {
          document.documentElement.style.setProperty('--sidebar-bg', value);
        } else if (key === 'headerFooterBg') {
          document.documentElement.style.setProperty('--header-bg', value);
          document.documentElement.style.setProperty('--footer-bg', value);
        } else if (key === 'sidebarTextColor') {
          document.documentElement.style.setProperty('--sidebar-text-color', value);
        } else if (key === 'headerTextColor') {
          document.documentElement.style.setProperty('--header-text-color', value);
          document.documentElement.style.setProperty('--text-color', value);
          document.documentElement.style.setProperty('--text-primary', value);
        }
      });
      
      // Trigger sidebar update
      window.dispatchEvent(new CustomEvent('organization-updated'));
      
      // Trigger global theme update
      window.dispatchEvent(new CustomEvent('theme-updated', { detail: colors }));
      
      showToast('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Failed to save settings. Please try again.', 'error');
    }
  };

  useEffect(() => {
    const loadOrganizationData = async () => {
      try {
        // Try to fetch from backend first
        const response = await api.get('/api/organization/branding');
        if (response.data && response.data.organization_name) {
          const data = response.data;
          setOrgDetails({
            name: data.organization_name || "Your Hospital Name",
            tagline: data.tagline || "Smart • Secure • NABH-Standard",
            address: data.address || "Address line for letterhead & PDFs",
            phone: data.phone || "+91-XXXXXXXXXX",
            email: data.email || "info@example.com",
            website: data.website || "https://your-hospital.com",
            gstin: data.gstin || "GSTIN (optional, for bills)",
            logo: data.logo || null,
            logoFilename: data.logo_filename || null
          });
          
          // Load colors from backend - always use backend data if available
          const backendColors = {
            primaryColor: data.primary_color || "#2862e9",
            secondaryColor: data.secondary_color || "#474e71",
            sidebarBg: data.sidebar_bg || "#628bf3",
            headerFooterBg: data.header_footer_bg || "#474e71",
            sidebarTextColor: data.sidebar_text_color || "#ffffff",
            headerTextColor: data.header_text_color || "#ffffff"
          };
          
          setColors(backendColors);
          
          // Apply colors to CSS variables immediately
          Object.entries(backendColors).forEach(([key, value]) => {
            if (key === 'primaryColor') {
              document.documentElement.style.setProperty('--primary-color', value);
              document.documentElement.style.setProperty('--primary-bg', value);
              const hoverColor = adjustBrightness(value, -20);
              document.documentElement.style.setProperty('--primary-hover', hoverColor);
            } else if (key === 'secondaryColor') {
              document.documentElement.style.setProperty('--secondary-color', value);
              document.documentElement.style.setProperty('--text-secondary', value);
              document.documentElement.style.setProperty('--muted-text', value);
            } else if (key === 'sidebarBg') {
              document.documentElement.style.setProperty('--sidebar-bg', value);
            } else if (key === 'headerFooterBg') {
              document.documentElement.style.setProperty('--header-bg', value);
              document.documentElement.style.setProperty('--footer-bg', value);
            } else if (key === 'sidebarTextColor') {
              document.documentElement.style.setProperty('--sidebar-text-color', value);
            } else if (key === 'headerTextColor') {
              document.documentElement.style.setProperty('--header-text-color', value);
              document.documentElement.style.setProperty('--text-color', value);
              document.documentElement.style.setProperty('--text-primary', value);
            }
          });
          
          // Update localStorage with essential data only
          localStorage.setItem('hospital_name', data.organization_name);
          localStorage.setItem('hospital_tagline', data.tagline || "");
        }
      } catch (error) {
        console.log('No organization branding data found, using localStorage or defaults');
        
        // Fallback to localStorage only if backend fails
        const savedOrg = localStorage.getItem('org-details');
        
        if (savedOrg) {
          setOrgDetails(JSON.parse(savedOrg));
        }
      }
    };

    // Always try to load from backend first
    loadOrganizationData();
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

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary mb-2">Logo</label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="px-4 py-2 bg-white text-black border-2 border-black rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        Choose Logo
                      </label>
                      {orgDetails.logo && (
                        <div className="flex items-center space-x-2">
                          <img
                            src={orgDetails.logo}
                            alt="Logo preview"
                            className="h-12 w-12 object-contain border rounded"
                          />
                          <span className="text-sm text-gray-600">{orgDetails.logoFilename}</span>
                        </div>
                      )}
                    </div>
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
                    <label className="block text-sm font-medium text-secondary mb-2">Secondary color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.secondaryColor}
                        onChange={(e) => updateColor('secondaryColor', e.target.value)}
                        className="w-12 h-10 rounded border border-black cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.secondaryColor}
                        onChange={(e) => updateColor('secondaryColor', e.target.value)}
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
                    <label className="block text-sm font-medium text-secondary mb-2">Header & footer background</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.headerFooterBg}
                        onChange={(e) => updateColor('headerFooterBg', e.target.value)}
                        className="w-12 h-10 rounded border border-black cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.headerFooterBg}
                        onChange={(e) => updateColor('headerFooterBg', e.target.value)}
                        className="flex-1 px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Sidebar text color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.sidebarTextColor}
                        onChange={(e) => updateColor('sidebarTextColor', e.target.value)}
                        className="w-12 h-10 rounded border border-black cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.sidebarTextColor}
                        onChange={(e) => updateColor('sidebarTextColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Header text color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={colors.headerTextColor}
                        onChange={(e) => updateColor('headerTextColor', e.target.value)}
                        className="w-12 h-10 rounded border border-black cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.headerTextColor}
                        onChange={(e) => updateColor('headerTextColor', e.target.value)}
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
        
        <Toast toast={toast} hideToast={hideToast} />
      </div>
    </Layout>
  );
}
