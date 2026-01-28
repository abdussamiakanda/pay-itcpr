import React from 'react';
import styles from './Scholarships.module.css';

const Scholarships = () => {
  return (
    <div className={styles.page}>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              Scholarships <span className={styles.gradientText}>Portal</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Scholarship opportunities, applications, and deadlines
            </p>
          </div>
        </div>
      </div>
      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Coming soon</h2>
          <p className={styles.sectionSubtitle}>
            Scholarship information and application tools will be available here.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Scholarships;
