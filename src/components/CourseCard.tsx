import React from 'react';

interface CourseCardProps {
  course: any;
  onClick: () => void;
  onFavorite: (e: any, course: any) => void;
  isFavorite: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onClick, onFavorite, isFavorite }) => {
  return (
    <div 
      onClick={onClick}
      style={{
        backgroundColor: '#1e293b',
        borderRadius: '15px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: '1px solid #334155',
        transition: 'transform 0.2s, box-shadow 0.2s',
        
        /* 📏 TAMAÑO FIJO Y ESTÁNDAR PARA TODA LA APP */
        width: '100%',
maxWidth: '300px',
height: '400px',
display: 'flex',
flexDirection: 'column',
justifyContent: 'space-between',
boxSizing: 'border-box',
flexShrink: 1
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Imagen con altura fija */}
      <img 
        src={course.image || course.thumbnail_url} 
        alt={course.title}
        style={{ width: '100%', height: '160px', objectFit: 'cover' }}
      />

      {/* Contenido con flex para ocupar el resto de la tarjeta */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ 
            color: 'white', 
            fontSize: '1.1rem', 
            margin: '0 0 10px 0', 
            lineHeight: '1.3',
            height: '2.6em', 
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {course.title}
          </h3>
          
          <p style={{ 
            color: '#94a3b8', 
            fontSize: '0.88rem', 
            margin: 0,
            lineHeight: '1.4',
            height: '3em',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {course.description ? course.description : 'Sin descripción disponible.'}
          </p>
        </div>

        {/* Footer de la tarjeta siempre al fondo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
          <span style={{ color: '#2dd4bf', fontWeight: 'bold', fontSize: '0.85rem' }}>GRATIS</span>
          <button 
            onClick={(e) => onFavorite(e, course)}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '1.4rem',
              color: isFavorite ? '#ef4444' : '#64748b',
              transition: 'transform 0.2s',
              padding: 0
            }}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  );
};