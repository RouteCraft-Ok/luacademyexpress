import React from 'react';
import { YouTubeEmbed } from '../components/YouTubeEmbed';

interface CourseDetailPageProps {
  selectedCourse: any;
  completed: number[];
  toggleComplete: (courseId: number) => void;
  navigateTo: (view: string) => void;
  setSelectedCourse: (course: any) => void;
  selectedRoute: any;
  courses: any[];
  fromPage?: string;
}

const extractYouTubeId = (urlOrId: string | undefined): string | null => {
  if (!urlOrId) return null;
  const match = urlOrId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match && match[1]) {
    return match[1];
  }
  return urlOrId.trim().length === 11 ? urlOrId.trim() : null;
};

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({
  selectedCourse,
  completed,
  toggleComplete,
  navigateTo,
  setSelectedCourse,
  selectedRoute,
  courses,
  fromPage,
}) => {
  if (!selectedCourse) return null;

  const rawId = selectedCourse.youtube_id || selectedCourse.videoId;
  const videoId = extractYouTubeId(rawId);

  // Lista de IDs permitidos de la ruta
  const allowedIds = selectedRoute 
    ? (selectedRoute.courseIds || selectedRoute.video_ids || []).map(String)
    : [];

  // Comprueba si el curso actual PERTENECE a la ruta activa
  const belongsToActiveRoute = allowedIds.includes(String(selectedCourse.id));

  // Cursos de la ruta
  const routeCourses = (Array.isArray(courses) ? courses : []).filter((c: any) =>
    allowedIds.includes(String(c.id))
  );

  const currentIndex = routeCourses.findIndex((c: any) => String(c.id) === String(selectedCourse.id));
  
  // SOLO mostrar el botón Siguiente Video si el curso pertenece a la ruta activa y no es el último
  const nextCourse = selectedRoute && belongsToActiveRoute && currentIndex !== -1 && currentIndex < routeCourses.length - 1 
    ? routeCourses[currentIndex + 1] 
    : null;

  const handleBackClick = () => {
    if (fromPage === 'landing') {
      navigateTo('landing');
    } else if (fromPage === 'explorer') {
      navigateTo('explorer');
    } else if (selectedRoute && belongsToActiveRoute) {
      navigateTo('path-detail');
    } else {
      navigateTo('explorer');
    }
  };

  return (
    <div 
      className="container-center" 
      style={{ 
        padding: '24px 12px 40px 12px', // 24px arriba le da un "aire" perfecto con el Navbar
        boxSizing: 'border-box', 
        width: '100%' 
      }}
    >
      <div 
        className="job-detail-card" 
        style={{ 
          background: '#1a1a2e', 
          padding: '20px 16px', 
          borderRadius: '20px', 
          border: '1px solid #334155',
          maxWidth: '900px',
          margin: '0 auto',
          boxSizing: 'border-box',
          width: '100%'
        }}
      >
        {/* Botón Volver Atrás */}
        <button 
          className="white-text" 
          style={{ 
            color: '#4ade80', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            marginBottom: '15px', 
            fontWeight: 'bold',
            fontSize: '0.95rem',
            padding: 0
          }} 
          onClick={handleBackClick}
        >
          ← Volver atrás
        </button>
        
        {/* Contenedor del Video */}
        <div style={{ marginBottom: '20px', width: '100%' }}>
          {videoId ? (
            <YouTubeEmbed videoId={videoId} />
          ) : (
            <div 
              style={{ 
                width: '100%', 
                aspectRatio: '16/9', 
                background: '#000', 
                borderRadius: '15px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#94a3b8',
                border: '1px dashed #334155',
                padding: '10px',
                textAlign: 'center'
              }}
            >
              <span style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🚫</span>
              <p style={{ fontWeight: 'bold', margin: 0 }}>Este curso no tiene un ID de video válido configurado.</p>
            </div>
          )}
        </div>
        
        {/* Título */}
        <h1 className="white-text" style={{ fontSize: '1.4rem', margin: '0 0 15px 0', wordBreak: 'break-word' }}>
          {selectedCourse.title}
        </h1>

        {/* Botones de Acción */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '10px', 
          alignItems: 'center', 
          width: '100%',
          marginBottom: '20px' 
        }}>
          {/* Botón de Estado */}
          <button 
            onClick={() => toggleComplete(selectedCourse.id)} 
            className="btn-primary-levelup" 
            style={{ 
              flex: '1 1 140px',
              padding: '12px 14px',
              backgroundColor: completed.includes(selectedCourse.id) ? '#3b82f6' : '#4ade80',
              color: '#0f172a',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              textAlign: 'center',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap'
            }}
          >
            {completed.includes(selectedCourse.id) ? '✓ COMPLETADO' : 'MARCAR COMO COMPLETADO'}
          </button>

          {/* Botón Siguiente Video (Solo si pertenece a la ruta activa) */}
          {nextCourse && (
            <button
              onClick={() => {
                setSelectedCourse(nextCourse);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                flex: '1 1 120px',
                padding: '12px 14px',
                backgroundColor: '#fbbf24',
                color: '#0f172a',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                textAlign: 'center',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap'
              }}
            >
              Siguiente Video ⏩
            </button>
          )}
        </div>

        {/* Descripción */}
        <p className="white-text" style={{ margin: 0, opacity: 0.8, lineHeight: '1.5', fontSize: '0.95rem' }}>
          {selectedCourse.description}
        </p>
      </div>
    </div>
  );
};