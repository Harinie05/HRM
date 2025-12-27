import { useState, useEffect } from 'react';

// Hook to detect screen size and provide responsive utilities
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);
      setIsDesktop(width >= 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    getResponsiveValue: (mobile, tablet, desktop) => {
      if (isMobile) return mobile;
      if (isTablet) return tablet;
      return desktop;
    },
    getResponsiveClass: (mobileClass, tabletClass, desktopClass) => {
      if (isMobile) return mobileClass;
      if (isTablet) return tabletClass;
      return desktopClass;
    }
  };
};

// Responsive container component
export const ResponsiveContainer = ({ children, className = '', ...props }) => {
  const { isMobile, isTablet } = useResponsive();
  
  const responsiveClasses = `
    ${isMobile ? 'px-4 py-4' : isTablet ? 'px-6 py-6' : 'px-8 py-8'}
    ${className}
  `;

  return (
    <div className={responsiveClasses} {...props}>
      {children}
    </div>
  );
};

// Responsive card component
export const ResponsiveCard = ({ 
  children,
  padding = { mobile: 'p-4', tablet: 'p-6', desktop: 'p-8' },
  radius = { mobile: 'rounded-lg', tablet: 'rounded-xl', desktop: 'rounded-2xl' },
  className = '',
  ...props
}) => {
  const { isMobile, isTablet } = useResponsive();
  
  const currentPadding = isMobile ? padding.mobile : isTablet ? padding.tablet : padding.desktop;
  const currentRadius = isMobile ? radius.mobile : isTablet ? radius.tablet : radius.desktop;
  
  const cardClasses = `
    bg-white
    border
    border-black
    shadow-sm
    ${currentPadding}
    ${currentRadius}
    ${className}
  `;

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
};

// Responsive header component
export const ResponsiveHeader = ({ 
  title,
  subtitle,
  icon: Icon,
  actions,
  className = '',
  ...props
}) => {
  const { isMobile, isTablet } = useResponsive();
  
  const headerClasses = `
    bg-white
    ${isMobile ? 'rounded-lg p-4' : isTablet ? 'rounded-xl p-6' : 'rounded-2xl p-8'}
    border-2
    border-black
    shadow-sm
    mb-${isMobile ? '4' : isTablet ? '6' : '8'}
    ${className}
  `;
  
  const titleSize = isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-2xl';
  const subtitleSize = isMobile ? 'text-sm' : isTablet ? 'text-base' : 'text-lg';
  const iconSize = isMobile ? 'w-8 h-8' : isTablet ? 'w-10 h-10' : 'w-12 h-12';

  return (
    <div className={headerClasses} {...props}>
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} ${isMobile ? 'items-start' : 'items-center'} ${isMobile ? 'gap-4' : 'justify-between'}`}>
        <div className="flex items-center gap-4">
          {Icon && (
            <div className={`${iconSize} bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon className={`${isMobile ? 'w-4 h-4' : isTablet ? 'w-5 h-5' : 'w-6 h-6'} text-gray-700`} />
            </div>
          )}
          <div className="min-w-0">
            <h1 className={`${titleSize} font-bold text-gray-900 mb-1`}>{title}</h1>
            {subtitle && (
              <p className={`${subtitleSize} text-gray-600 mb-1`}>{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className={isMobile ? 'mt-4 w-full' : ''}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

// Responsive tab navigation component
export const ResponsiveTabs = ({ 
  tabs,
  activeTab,
  onTabChange,
  className = '',
  ...props
}) => {
  const { isMobile } = useResponsive();
  
  const containerClasses = `
    flex
    items-center
    bg-gray-100
    rounded-full
    p-1
    border
    border-black
    ${isMobile ? 'overflow-x-auto scrollbar-hide' : ''}
    ${className}
  `;
  
  const buttonSize = isMobile ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';

  return (
    <div className={containerClasses} {...props}>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`
            ${buttonSize}
            font-medium
            rounded-full
            transition-colors
            whitespace-nowrap
            flex-shrink-0
            ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm border border-gray-300'
                : 'text-gray-600 hover:text-gray-900'
            }
          `}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default {
  useResponsive,
  ResponsiveContainer,
  ResponsiveCard,
  ResponsiveHeader,
  ResponsiveTabs
};