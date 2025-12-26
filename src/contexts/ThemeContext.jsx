import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState({
    sidebarBg: '#628bf3',
    headerBg: '#3B5BDB', 
    primaryColor: '#2862e9',
    primaryDark: '#474e71'
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-colors');
    if (savedTheme) {
      const parsedTheme = JSON.parse(savedTheme);
      setTheme(parsedTheme);
      applyThemeToDOM(parsedTheme);
    }
  }, []);

  const applyThemeToDOM = (newTheme) => {
    document.documentElement.style.setProperty('--sidebar-bg', newTheme.sidebarBg || newTheme.sidebar);
    document.documentElement.style.setProperty('--header-bg', newTheme.headerBg || newTheme.sidebarBg || newTheme.sidebar);
    document.documentElement.style.setProperty('--primary-color', newTheme.primaryColor || newTheme.primary);
    document.documentElement.style.setProperty('--primary-dark', newTheme.primaryDark || newTheme.dark);
  };

  const updateTheme = (newTheme) => {
    setTheme(newTheme);
    applyThemeToDOM(newTheme);
    localStorage.setItem('theme-colors', JSON.stringify(newTheme));
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
