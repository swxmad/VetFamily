import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <div className={styles.inform}>
        <p>При возникших проблемах обращаться:</p>
        <p>admin@vetclinic.com</p>
        <p>+7 (999) 999-99-99</p>
      </div>
    </footer>
  );
};

export default Footer;