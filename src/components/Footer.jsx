export default function Footer() {
  return (
    <footer className="bg-[#6366F1] text-white py-3 px-4 sm:px-6 text-xs sm:text-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        {/* Left side - Powered by */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="font-medium">Powered by NUTRYAH DIGITAL HEALTH</span>
          
          {/* Support info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-white/90">
            <span className="font-medium">Support:</span>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <span>Mobile: +91 88707 87448</span>
              <span className="hidden sm:inline">•</span>
              <span>Email: support@nutryah.com</span>
              <span className="hidden sm:inline">•</span>
              <span>Website: www.nutryah.com</span>
            </div>
          </div>
        </div>
        
        {/* Right side - Links */}
        <div className="flex items-center gap-2 sm:gap-3 text-white/90">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <span>|</span>
          <a href="#" className="hover:text-white transition-colors">Terms & Conditions</a>
        </div>
      </div>
    </footer>
  );
}