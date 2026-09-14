import { useRef, useState, useEffect } from 'react';
import { CourseCard } from '../components/CourseCard';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const PathDetailPage = ({ 
  selectedRoute, 
  courses, // <--- Recibimos el catálogo global de cursos desde App.tsx
  completed, 
  toggleFavorite, 
  favorites, 
  navigateTo, 
  setSelectedCourse 
}: any) => {
  const [routeCourses, setRouteCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const diplomaRef = useRef<HTMLDivElement>(null);

  // --- FILTRADO LOCAL BASADO EN LOS IDS DE LA RUTA ---
  useEffect(() => {
    const fetchRouteCourses = () => {
      if (!selectedRoute) return;
      
      try {
        setLoading(true);
        // Intentamos leer courseIds, y usamos video_ids como fallback seguro
        const allowedIds = selectedRoute.courseIds || selectedRoute.video_ids || [];
        
        // Filtramos el catálogo global de cursos buscando los que pertenecen a esta ruta
        // Forzamos que tanto los ID del catálogo como los permitidos se comparen correctamente
        const filtered = (Array.isArray(courses) ? courses : []).filter((c: any) => 
          allowedIds.map(String).includes(String(c.id))
        );

        setRouteCourses(filtered);
      } catch (err) {
        console.error("Error filtrando videos locales de la ruta:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRouteCourses();
  }, [selectedRoute, courses]);

  if (!selectedRoute) return null;

  // Protegemos el filtro asegurando que routeCourses siempre sea un Array válido
  const validRouteCourses = Array.isArray(routeCourses) ? routeCourses : [];

  // Cálculos de progreso basados en los videos cargados de forma segura
  // Convertimos a String para asegurar una comparación estricta (=== bajo el capó en includes) sin fallos de tipo
  const doneCount = validRouteCourses.filter((c: any) => 
    completed.map(String).includes(String(c.id))
  ).length;

  const progress = validRouteCourses.length > 0 
    ? Math.round((doneCount / validRouteCourses.length) * 100) 
    : 0;

  const handleLocalDownload = async () => {
    if (!diplomaRef.current) return;
    try {
      const canvas = await html2canvas(diplomaRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [800, 600] });
      pdf.addImage(imgData, 'PNG', 0, 0, 800, 600);
      pdf.save(`Certificado-${selectedRoute.title}.pdf`);
    } catch (error) {
      console.error("Error al generar PDF:", error);
    }
  };

  if (loading) {
    return (
      <div className="container-center" style={{ padding: '100px', textAlign: 'center', color: 'white' }}>
        <p>Cargando el camino de aprendizaje...</p>
      </div>
    );
  }

  return (
    <div className="container-center" style={{ padding: '40px 0 100px 0' }}>
      
      {/* Botón Volver */}
      <button 
        onClick={() => navigateTo('categories')} 
        style={{ 
          background: 'rgba(74, 222, 128, 0.1)', 
          border: `1px solid ${selectedRoute.color || '#4ade80'}`, 
          color: selectedRoute.color || '#4ade80', 
          padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', marginBottom: '30px', fontWeight: 'bold' 
        }}
      > ← Volver a Rutas </button>

      {/* Header de la Ruta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <h1 className="white-text" style={{ fontSize: '2.5rem', margin: 0 }}>{selectedRoute.title}</h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '10px' }}>{selectedRoute.description}</p>
        </div>
        <div style={{ textAlign: 'right', background: '#1e293b', padding: '20px', borderRadius: '15px', border: '1px solid #334155' }}>
          <span style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>{progress}% Completado</span>
          <div style={{ width: '200px', height: '8px', background: '#0f172a', borderRadius: '10px', marginTop: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: selectedRoute.color || '#4ade80', transition: 'width 1s ease' }} />
          </div>
        </div>
      </div>

      {/* Lista de Videos (Camino Vertical) */}
      <div className="vertical-path" style={{ maxWidth: '700px', margin: '0 auto' }}>
        {validRouteCourses.length > 0 ? (
          validRouteCourses.map((c: any, index: number) => {
            const isDone = completed.map(String).includes(String(c.id));
            return (
              <div key={c.id} className="path-step-container">
                 <div className="path-step-indicator">
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: '50%', 
                      background: isDone ? (selectedRoute.color || '#4ade80') : '#1e293b', 
                      color: isDone ? '#0f172a' : '#94a3b8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, fontWeight: 'bold', border: isDone ? 'none' : '2px solid #334155'
                    }}> {isDone ? '✓' : index + 1} </div>
                    {index !== validRouteCourses.length - 1 && (
                      <div className="path-step-line" style={{ background: isDone ? (selectedRoute.color || '#4ade80') : '#334155' }} />
                    )}
                 </div>
                 <div className="path-step-content">
                    <CourseCard 
                      course={c} 
                      isFavorite={favorites.map(String).includes(String(c.id))} 
                      onFavorite={toggleFavorite} 
                      onClick={() => { setSelectedCourse(c); navigateTo('course-detail'); }} 
                    />
                 </div>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px', border: '1px dashed #334155', borderRadius: '20px' }}>
            <p>No hay videos asignados a esta ruta.</p>
            <p style={{fontSize: '0.8rem'}}>Verifica la configuración de los IDs en tu archivo de rutas.</p>
          </div>
        )}
      </div>

      {/* Sección de Diploma */}
      {progress >= 100 && validRouteCourses.length > 0 && (
        <div style={{ padding: '50px', textAlign: 'center', background: '#1e293b', borderRadius: '24px', marginTop: '60px', border: '2px solid #fbbf24' }}>
          <h2 style={{ color: '#fbbf24' }}>🏆 ¡RUTA COMPLETADA!</h2>
          <p style={{ color: 'white', marginBottom: '20px' }}>Has demostrado maestría en esta especialización.</p>
          <button onClick={handleLocalDownload} style={{ padding: '15px 30px', background: '#fbbf24', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}>
            📥 Descargar Certificado
          </button>
        </div>
      )}

      {/* Diploma oculto para PDF */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={diplomaRef} style={{ 
          width: '800px', height: '600px', background: 'white', 
          padding: '60px', border: '20px solid #1e293b', textAlign: 'center', color: '#1e293b',
          fontFamily: 'serif'
        }}>
          <h1 style={{ fontSize: '40px', color: '#fbbf24', marginBottom: '10px' }}>LEVELUP ACADEMY</h1>
          <div style={{ borderBottom: '2px solid #fbbf24', width: '100px', margin: '0 auto 40px' }}></div>
          <p style={{ fontSize: '20px' }}>Este documento certifica que has completado con éxito la ruta:</p>
          <h2 style={{ fontSize: '36px', margin: '20px 0' }}>{selectedRoute.title}</h2>
          <p style={{ fontSize: '18px', marginTop: '50px' }}>¡Sigue aprendiendo y subiendo de nivel!</p>
          <div style={{ marginTop: '80px', fontStyle: 'italic' }}>
            <p>Firma de la Academia</p>
          </div>
        </div>
      </div>
    </div>
  );
};