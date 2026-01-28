import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import styles from './Header.module.css';

const Header = () => {
  const { userData, signOutUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Reset avatar error when userData changes
  useEffect(() => {
    setAvatarError(false);
  }, [userData?.photoURL]);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOutUser();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <span className="material-icons">dashboard</span>
          </div>
          <div className={styles.brandText}>
            <h1 className={styles.brandTitle}>ITCPR</h1>
            <span className={styles.brandSubtitle}>Account Portal</span>
          </div>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          <NavLink to="/payment" className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)}>
            Payment
          </NavLink>
          <NavLink to="/travel" className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)}>
            Travel
          </NavLink>
          <NavLink to="/scholarships" className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)}>
            Scholarships
          </NavLink>
        </nav>

        {/* User Menu */}
        <div className={styles.userMenu}>
          <button
            className={styles.userButton}
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label="User menu"
          >
            <div className={styles.userAvatar}>
              <img
                src={
                  authLoading || !userData?.photoURL || avatarError
                    ? '/assets/default-avatar.svg'
                    : userData.photoURL
                }
                alt={userData?.name || 'User'}
                className={styles.avatarImage}
                onError={() => setAvatarError(true)}
              />
            </div>
            <span className={`material-icons ${styles.dropdownIcon} ${showUserMenu ? styles.rotated : ''}`}>
              expand_more
            </span>
          </button>

          {showUserMenu && (
            <>
              <div 
                className={styles.menuOverlay}
                onClick={() => setShowUserMenu(false)}
              />
              <div className={styles.menuDropdown}>
                <div className={styles.menuUserInfo}>
                  <div className={styles.menuAvatar}>
                    <img
                      src={
                        authLoading || !userData?.photoURL || avatarError
                          ? '/assets/default-avatar.svg'
                          : userData.photoURL
                      }
                      alt={userData?.name || 'User'}
                      onError={() => setAvatarError(true)}
                    />
                  </div>
                  <div>
                    <p className={styles.menuUserName}>{userData?.name || 'User'}</p>
                    <p className={styles.menuUserEmail}>{userData?.email || ''}</p>
                  </div>
                </div>
                <div className={styles.menuDivider}></div>
                <button
                  className={styles.menuSignOut}
                  onClick={handleSignOut}
                  disabled={loading}
                >
                  <span className="material-icons">logout</span>
                  <span>{loading ? 'Signing out...' : 'Sign Out'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
