// src/pages/DashboardPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { CourseCard } from '../components/CourseCard';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ACADEMY_DATA } from '../data/routesData'; 
import './DashboardPage.css';

// --- SUB-COMPONENTE: EL DISEÑO DEL DIPLOMA ---
const DiplomaTemplate = React.forwardRef<HTMLDivElement, { courseTitle: string; certId: string }>(({ courseTitle, certId }, ref) => (
  <div 
    ref={ref}
    style={{
      width: '800px',
      height: '600px',
      padding: '40px',
      background: '#ffffff',
      border: '15px solid #1e293b',
      position: 'absolute',
      left: '-9999px',
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      color: '#1e293b',
      fontFamily: 'serif'
    }}
  >
    <div style={{ border: '3px solid #fbbf24', width: '100%', height: '100%', padding: '40px', boxSizing: 'border-box' }}>
      <h1 style={{ fontSize: '42px', margin: 0, color: '#fbbf24' }}>👑 LEVELUP ACADEMY</h1>
      <p style={{ fontSize: '18px', letterSpacing: '4px', marginBottom: '40px' }}>CERTIFICADO DE FINALIZACIÓN</p>
      
      <p style={{ fontSize: '20px', fontStyle: 'italic' }}>Se otorga el presente a un estudiante de excelencia por completar:</p>
      <h2 style={{ fontSize: '36px', margin: '20px 0', color: '#1e293b' }}>{courseTitle}</h2>
      
      <div style={{ marginTop: '60px', width: '100%', display: 'flex', justifyContent: 'space-around' }}>
        <div style={{ textAlign: 'left' }}>
          <p style={{ margin: 0 }}><b>Fecha:</b> {new Date().toLocaleDateString()}</p>
          <p style={{ margin: 0, fontSize: '14px' }}><b>ID:</b> {certId}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '150px', borderBottom: '1px solid #1e293b', marginBottom: '5px' }}></div>
          <p style={{ fontSize: '14px' }}>Sello de la Academia</p>
        </div>
      </div>
    </div>
  </div>
));

interface DashboardProps {
  courses: any[];
  favorites: number[];
  completed: number[];
  toggleFavorite: (e: React.MouseEvent, course: any) => void;
  navigateTo: (view: string) => void;
  setSelectedCourse: (course: any) => void;
  setSelectedRoute: (route: any) => void;
}

export const DashboardPage = ({ 
  courses, 
  favorites, 
  completed = [], 
  toggleFavorite, 
  navigateTo, 
  setSelectedCourse,
  setSelectedRoute 
}: DashboardProps) => {
  
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = sessionStorage.getItem('dashboard_tab');
    if (savedTab) {
      sessionStorage.removeItem('dashboard_tab');
      return 'Certificados'; 
    }
    return 'Favoritos';
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  const diplomaRef = useRef<HTMLDivElement>(null);
  const [selectedForCert, setSelectedForCert] = useState({ title: '', id: '' });

  const totalCourses = courses.length;
  const completedCount = completed.length;
  const percentage = totalCourses > 0 ? Math.round((completedCount / totalCourses) * 100) : 0;

  const getUserRank = (count: number) => {
    if (count >= 10) return { name: 'Maestro', color: '#fbbf24', icon: '👑' };
    if (count >= 5) return { name: 'Especialista', color: '#8b5cf6', icon: '🔥' };
    if (count >= 2) return { name: 'Aprendiz', color: '#3b82f6', icon: '⚡' };
    return { name: 'Novato', color: '#94a3b8', icon: '🌱' };
  };

  const rank = getUserRank(completedCount);

  const downloadPDF = async (courseTitle: string, certId: string) => {
    setSelectedForCert({ title: courseTitle, id: certId });
    setTimeout(async () => {
      if (!diplomaRef.current) return;
      const canvas = await html2canvas(diplomaRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [800, 600] });
      pdf.addImage(imgData, 'PNG', 0, 0, 800, 600);
      pdf.save(`Diploma-${courseTitle}.pdf`);
    }, 150);
  };

  const getFilteredContent = () => {
    switch (activeTab) {
      case 'Favoritos': return courses.filter((c: any) => favorites.includes(c.id));
      case 'Mis Cursos': 
        return courses.filter((c: any) => 
          favorites.includes(c.id) || completed.includes(c.id)
        );
      case 'Certificados': return courses.filter((c: any) => completed.includes(c.id));
      case 'Mis Rutas': 
        const allRoutes = Object.values(ACADEMY_DATA).flat();
        return allRoutes.map((route: any) => {
          const doneCount = route.courseIds.filter((id: number) => completed.includes(id)).length;
          const progress = Math.round((doneCount / route.courseIds.length) * 100);
          return { ...route, progress };
        }).filter(r => r.progress > 0); 
      default: return [];
    }
  };

  const filteredContent = getFilteredContent();
  const totalPages = Math.ceil(filteredContent.length / itemsPerPage);
  const currentItems = filteredContent.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [activeTab]);

  return (
    <div className="dashboard-container">
      
      <DiplomaTemplate ref={diplomaRef} courseTitle={selectedForCert.title} certId={selectedForCert.id} />

      {/* Banner de Perfil */}
      <div className="profile-banner-pro" style={{ borderColor: `${rank.color}44` }}>
        <div className="profile-banner-bg-icon">
          {rank.icon}
        </div>

        <div className="profile-user-info">
          <div className="profile-avatar-badge" style={{ background: rank.color, boxShadow: `0 0 20px ${rank.color}66` }}>
            {rank.icon}
          </div>
          <div>
            <h2 className="profile-title">Mi Dashboard</h2>
            <div className="profile-rank-info">
              <span className="profile-badge-tag" style={{ background: rank.color }}>
                RANGO: {rank.name}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{completedCount} Cursos completados</span>
            </div>
          </div>
        </div>

        <div className="profile-progress-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>XP Acumulada</span>
            <span style={{ color: rank.color, fontWeight: 'bold' }}>{completedCount * 100} XP</span>
          </div>
          <div className="profile-xp-bar-bg">
            <div className="profile-xp-bar-fill" style={{ width: `${percentage}%`, background: rank.color }}></div>
          </div>
        </div>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <div className="dashboard-tabs">
        {['Mis Cursos', 'Mis Rutas', 'Favoritos', 'Certificados'].map((tab) => (
          <div 
            key={tab} 
            className={`dashboard-tab-item ${activeTab === tab ? 'active' : ''}`} 
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      <h3 style={{ color: '#ffffff', margin: '20px 0 30px', fontSize: '1.5rem' }}>{activeTab}</h3>
      
      {/* SECCIÓN ESPECIAL PARA DIPLOMAS DE RUTAS / ESPECIALIZACIÓN */}
      {activeTab === 'Certificados' && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#fbbf24', fontSize: '1.4rem', marginBottom: '20px' }}>🏅 Diplomas de Especialización</h2>
          {Object.values(ACADEMY_DATA).flat().map((route: any) => {
            const isRouteComplete = route.courseIds.every((id: number) => completed.includes(id));
            if (!isRouteComplete) return null;

            return (
              <div key={route.id} className="premium-cert-row gold">
                <div className="cert-icon">🏆</div>
                <div className="cert-content">
                  <span className="cert-tag" style={{ color: '#fbbf24' }}>ESPECIALISTA MASTER</span>
                  <h3 className="cert-title">{route.title}</h3>
                  <p style={{ color: '#94a3b8', margin: '5px 0 0 0', fontSize: '0.9rem' }}>Ruta de aprendizaje profesional completada</p>
                </div>
                <button 
                  onClick={() => downloadPDF(`Especialista en ${route.title}`, `ROUTE-${route.id}`)}
                  className="btn-cert-download gold"
                >
                  DESCARGAR DIPLOMA ORO
                </button>
              </div>
            );
          })}
          <hr style={{ borderColor: '#334155', margin: '30px 0' }} />
          <h2 style={{ color: '#ffffff', fontSize: '1.2rem', marginBottom: '20px' }}>Cursos Individuales</h2>
        </div>
      )}

      {/* GRILLA DE CURSOS O DIPLOMAS */}
      {currentItems.length > 0 ? (
        <div className={activeTab === 'Certificados' || activeTab === 'Mis Rutas' ? "certificates-column" : "jobs-list"}>
          {currentItems.map((item: any) => {
            if (activeTab === 'Mis Rutas') {
  return (
    <div key={item.id} className="route-progress-card-pro">
      <div className="route-card-header">
        <div>
          <span className="route-status-badge">🗺️ RUTA EN CURSO</span>
          <h3 className="route-card-title">{item.title}</h3>
        </div>
        <div className="route-percentage-box">
          <span className="route-percentage-num">{item.progress}%</span>
          <span className="route-percentage-label">Completado</span>
        </div>
      </div>

      <div className="route-progress-bar-bg">
        <div 
          className="route-progress-bar-fill" 
          style={{ width: `${item.progress}%` }}
        />
      </div>

      <div className="route-card-footer">
        <span className="route-info-text">Continúa donde lo dejaste para avanzar en tu especialización.</span>
        <button 
          onClick={() => { setSelectedRoute(item); navigateTo('path-detail'); }}
          className="btn-continue-route"
        >
          CONTINUAR ESTA RUTA →
        </button>
      </div>
    </div>
  );
}

            if (activeTab === 'Certificados') {
              return (
                <div key={item.id} className="premium-cert-row standard">
                  <div className="cert-icon">👑</div>
                  <div className="cert-content">
                    <span className="cert-tag" style={{ color: '#fbbf24' }}>CERTIFICADO OFICIAL</span>
                    <h3 className="cert-title">{item.title}</h3>
                  </div>
                  <button 
                    onClick={() => downloadPDF(item.title, `LUP-${item.id}`)}
                    className="btn-cert-download green"
                  >
                    DESCARGAR PDF
                  </button>
                </div>
              );
            }

            return (
  <CourseCard 
    key={item.id}
    course={item} 
    isFavorite={favorites.includes(item.id)} 
    onFavorite={toggleFavorite} 
    onClick={() => { setSelectedCourse(item); navigateTo('course-detail') }} 
  />
);
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: '#1e293b', borderRadius: '16px', border: '1px dashed #334155' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>📁</div>
          <p style={{ color: '#ffffff', fontSize: '1.1rem', opacity: 0.8, margin: 0 }}>No hay contenido disponible en <strong>{activeTab}</strong> todavía.</p>
          <button onClick={() => navigateTo('explorer')} style={{ marginTop: '20px', background: '#4ade80', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Explorar Cursos
          </button>
        </div>
      )}

      {/* CONTROLES DE PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <button
            disabled={currentPage === 1}
            onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="pagination-btn"
          >
            ←
          </button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => { setCurrentPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`pagination-num-btn ${currentPage === i + 1 ? 'active' : ''}`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="pagination-btn"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
};