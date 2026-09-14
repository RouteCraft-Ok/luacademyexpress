import React, { useState } from 'react';
import './NavBar.css';

interface NavBarProps {
  navigateTo: (page: string) => void;
  token?: string | null;
  handleLogout: () => void;
  userName?: string;
}

export const NavBar: React.FC<NavBarProps> = ({
  navigateTo,
  token,
  handleLogout,
  userName
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleNavigation = (page: string) => {
    navigateTo(page);
    setIsMobileOpen(false); // Cierra el menú en celulares al hacer clic
  };

  return (
    <nav className="main-nav">
      <div className="nav-container">
        
        {/* LOGO */}
        <div className="nav-logo-link" onClick={() => handleNavigation('landing')}>
          <span className="brand-logo">
            LevelUp<span className="brand-accent">Academy</span>
          </span>
        </div>

        {/* BOTÓN MENÚ MÓVIL */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Abrir Menú"
        >
          {isMobileOpen ? '✕' : '☰'}
        </button>

        {/* LINKS Y USUARIO */}
        <div className={`nav-content ${isMobileOpen ? 'mobile-open' : ''}`}>
          
          {/* Saludo al Alumno */}
          {token && userName && (
            <div className="user-greeting">
              Hola, <span className="user-name">{userName}</span>
            </div>
          )}

          <button className="nav-btn" onClick={() => handleNavigation('explorer')}>
            Explorar
          </button>
          
          <button className="nav-btn" onClick={() => handleNavigation('categories')}>
            Rutas
          </button>
          
          {token && (
            <>
              <button className="nav-btn nav-btn-highlight" onClick={() => handleNavigation('dashboard')}>
                Mi Progreso
              </button>
              
              <button className="nav-btn nav-btn-account" onClick={() => handleNavigation('profile')}>
                Mi Cuenta
              </button>

              <button className="nav-btn-admin" onClick={() => handleNavigation('admin')}>
                Admin 🛠️
              </button>
            </>
          )}

          {token ? (
            <button className="btn-primary-levelup" onClick={() => { handleLogout(); setIsMobileOpen(false); }}>
              Salir
            </button>
          ) : (
            <button className="btn-primary-levelup" onClick={() => handleNavigation('login')}>
              Comenzar
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};