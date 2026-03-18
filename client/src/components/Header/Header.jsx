import React, { useEffect, useState } from 'react';
import styles from './Header.module.css';

const Header = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <header className={styles.headerWrapper}>
      <div className={styles.header}>
        <img src="/images/лого.png" alt="" className={styles.logo} />
        {/* <button
          type="button"
          className={styles.themeToggle}
          onClick={toggleTheme}
        >
          {theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
        </button> */}
      </div>
      <div className={styles.line}></div>
    </header>
  );
};

export default Header;