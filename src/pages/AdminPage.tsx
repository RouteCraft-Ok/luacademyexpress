import React, { useState, useEffect } from 'react';
import { ACADEMY_DATA } from '../data/routesData'; 
import { getCourses } from '../services/courseService'; 
import './AdminPage.css';

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  youtube_id: string;
  category: string;
  instructor: string;
  image?: string;
}

interface Path {
  id: any;
  title: string;
  description: string;
  color: string;
  selectedVideos: number[];
  video_count?: number;
  image?: string;
}

const extractYoutubeId = (url: string) => {
  if (url.length === 11) return url;
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[7] && match[7].length === 11) {
    return match[7];
  }
  return url || "dQw4w9WgXcQ"; 
};

export const AdminPage: React.FC<{ token: string | null }> = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [paths, setPaths] = useState<Path[]>([]);
  const [activeTab, setActiveTab] = useState<'videos' | 'paths'>('videos');
  const [filter, setFilter] = useState('');
  
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [editingPathId, setEditingPathId] = useState<any>(null);

  const [course, setCourse] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    youtube_id: '',
    category: '',
    instructor: 'Admin LevelUp'
  });

  const [pathForm, setPathForm] = useState({
    title: '',
    description: '',
    color: '#4ade80',
    selectedVideos: [] as number[] 
  });

  const [status, setStatus] = useState({ msg: '', type: '' });

  const moveVideo = (index: number, direction: 'up' | 'down') => {
    const newVideos = [...pathForm.selectedVideos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newVideos.length) return;
    
    [newVideos[index], newVideos[targetIndex]] = [newVideos[targetIndex], newVideos[index]];
    setPathForm({ ...pathForm, selectedVideos: newVideos });
  };

  const fetchData = async () => {
    try {
      const dataCourses = await getCourses();
      setCourses(dataCourses);

      let localPaths = localStorage.getItem('levelup_paths');
      let parsedPaths: Path[] = [];

      if (localPaths) {
        parsedPaths = JSON.parse(localPaths);
      } else {
        parsedPaths = Object.entries(ACADEMY_DATA).map(([categoryName, routesArray]: [string, any[]], index) => {
          const routeInfo = routesArray[0] || {};
          return {
            id: `static-${index + 1}`,
            title: categoryName,
            description: routeInfo.description || 'Domina esta especialización con nuestra ruta guiada.',
            color: routeInfo.color || '#4ade80',
            selectedVideos: routeInfo.courseIds ? routeInfo.courseIds.map(Number) : [],
            image: routeInfo.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80'
          };
        });
        localStorage.setItem('levelup_paths', JSON.stringify(parsedPaths));
      }
      
      const pathsWithCount = parsedPaths.map(p => ({
        ...p,
        video_count: p.selectedVideos ? p.selectedVideos.length : 0
      }));

      setPaths(pathsWithCount);
    } catch (err) {
      console.error("Error cargando datos unificados en el panel admin");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteCourse = (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este video de la biblioteca?')) return;
    try {
      const updatedCourses = courses.filter(c => c.id !== id);
      localStorage.setItem('levelup_courses', JSON.stringify(updatedCourses));
      
      const localPaths = localStorage.getItem('levelup_paths');
      if (localPaths) {
        const parsedPaths: Path[] = JSON.parse(localPaths);
        const cleanedPaths = parsedPaths.map(p => ({
          ...p,
          selectedVideos: p.selectedVideos.filter(vId => Number(vId) !== Number(id))
        }));
        localStorage.setItem('levelup_paths', JSON.stringify(cleanedPaths));
      }

      fetchData();
      window.dispatchEvent(new Event('storage'));
      setStatus({ msg: 'Video eliminado correctamente del navegador', type: 'success' });
    } catch (err) {
      setStatus({ msg: 'Error al eliminar el video', type: 'error' });
    }
  };

  const handleDeletePath = (id: any) => {
    if (!window.confirm('¿Borrar esta ruta?')) return;
    try {
      const updatedPaths = paths.filter(p => p.id !== id);
      localStorage.setItem('levelup_paths', JSON.stringify(updatedPaths));
      fetchData();
      window.dispatchEvent(new Event('storage'));
      setStatus({ msg: 'Ruta eliminada con éxito', type: 'success' });
    } catch (err) {
      setStatus({ msg: 'Error al eliminar la ruta', type: 'error' });
    }
  };

  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractYoutubeId(course.youtube_id);
    
    const courseData: Omit<Course, 'id'> = { 
      ...course, 
      category: course.category || 'Sin categoría',
      youtube_id: videoId,
      thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      image: `https://img.youtube.com/vi/${videoId}/0.jpg`
    };

    try {
      let updatedCourses = [...courses];

      if (editingCourseId) {
        updatedCourses = updatedCourses.map(c => 
          c.id === editingCourseId ? { ...courseData, id: editingCourseId } : c
        );
        setStatus({ msg: '¡Video actualizado en tu navegador!', type: 'success' });
      } else {
        const newId = courses.length > 0 ? Math.max(...courses.map(c => c.id)) + 1 : 1;
        // ✅ USAMOS unshift PARA QUE APAREZCA AL PRINCIPIO
        updatedCourses.unshift({ ...courseData, id: newId });
        setStatus({ msg: '¡Nuevo video añadido a tu sesión!', type: 'success' });
      }
      
      localStorage.setItem('levelup_courses', JSON.stringify(updatedCourses));
      setCourse({ title: '', description: '', thumbnail_url: '', youtube_id: '', category: '', instructor: 'Admin LevelUp' });
      setEditingCourseId(null);
      fetchData();
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      setStatus({ msg: 'Error al guardar el video en el navegador', type: 'error' });
    }
  };

  const handlePathSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let updatedPaths = [...paths];

      if (editingPathId) {
        updatedPaths = updatedPaths.map(p => 
          p.id === editingPathId ? { 
            id: editingPathId,
            title: pathForm.title,
            description: pathForm.description,
            color: pathForm.color || '#4ade80',
            selectedVideos: pathForm.selectedVideos.map(id => Number(id)),
            image: p.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80'
          } : p
        );
      } else {
        const newId = `custom-${Date.now()}`;
        // ✅ USAMOS unshift PARA QUE APAREZCA AL PRINCIPIO
        updatedPaths.unshift({
          id: newId,
          title: pathForm.title,
          description: pathForm.description,
          color: pathForm.color || '#4ade80',
          selectedVideos: pathForm.selectedVideos.map(id => Number(id)),
          image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80'
        });
      }

      localStorage.setItem('levelup_paths', JSON.stringify(updatedPaths));
      resetPathForm();
      fetchData();
      window.dispatchEvent(new Event('storage'));
      setStatus({ msg: '¡Estructura de la ruta guardada perfectamente!', type: 'success' });
    } catch (err: any) {
      setStatus({ msg: 'Error crítico al procesar la ruta', type: 'error' });
    }
  };

  const startEditPath = (p: Path) => {
    setEditingPathId(p.id);
    setPathForm({ 
      title: p.title, 
      description: p.description || '', 
      color: p.color || '#4ade80',
      selectedVideos: p.selectedVideos ? p.selectedVideos.map(id => Number(id)) : [] 
    });
    setActiveTab('paths');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleVideoInPath = (videoId: number) => {
    const idNum = Number(videoId);
    setPathForm(prev => ({
      ...prev,
      selectedVideos: prev.selectedVideos.includes(idNum)
        ? prev.selectedVideos.filter(id => id !== idNum)
        : [...prev.selectedVideos, idNum]
    }));
  };

  const resetPathForm = () => {
    setEditingPathId(null);
    setPathForm({ title: '', description: '', color: '#4ade80', selectedVideos: [] });
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1 className="admin-title">Panel de Control Local [Admin]</h1>
        {status.msg && (
          <div className={`admin-status-msg ${status.type}`}>
            {status.msg}
          </div>
        )}
        <div className="admin-tabs">
          <button 
            onClick={() => setActiveTab('videos')} 
            className={`tab-btn ${activeTab === 'videos' ? 'active-videos' : ''}`}
          >
            Catálogo Global ({courses.length})
          </button>
          <button 
            onClick={() => setActiveTab('paths')} 
            className={`tab-btn ${activeTab === 'paths' ? 'active-paths' : ''}`}
          >
            Diseñador de Tracks ({paths.length})
          </button>
        </div>
      </header>

      <div className="admin-grid-layout">
        {/* FORMULARIO IZQUIERDA */}
        <section className="admin-form-card">
          {activeTab === 'videos' ? (
            <form onSubmit={handleCourseSubmit}>
              <h2 className="admin-form-title videos">
                {editingCourseId ? 'Modificar Entrada' : 'Registrar Nuevo Video'}
              </h2>
              
              <label className="admin-label">Título del Módulo:</label>
              <input 
                className="admin-input" 
                value={course.title} 
                onChange={e => setCourse({...course, title: e.target.value})} 
                placeholder="Ej: Introducción Avanzada a Rust" 
                required 
              />
              
              <label className="admin-label">URL o ID de YouTube:</label>
              <input 
                className="admin-input" 
                value={course.youtube_id} 
                onChange={e => setCourse({...course, youtube_id: e.target.value})} 
                placeholder="Pegue el enlace del video aquí" 
                required 
              />
              
              <label className="admin-label">Especialización Destino (Opcional):</label>
              <select 
                className="admin-select" 
                value={course.category} 
                onChange={e => setCourse({...course, category: e.target.value})}
              >
                <option value="">-- Sin ruta asignada (Opcional) --</option>
                <option value="Experto en Frontend">Experto en Frontend</option>
                <option value="Experto en Backend">Experto en Backend</option>
                <option value="Experto en Mobile">Experto en Mobile</option>
                <option value="Experto en DevOps">Experto en DevOps</option>
                <option value="Experto en Ciberseguridad">Experto en Ciberseguridad</option>
                <option value="Especialista en IA">Especialista en IA</option>
              </select>

              <label className="admin-label">Descripción del Contenido Técnico:</label>
              <textarea 
                className="admin-textarea" 
                value={course.description} 
                onChange={e => setCourse({...course, description: e.target.value})} 
                placeholder="¿Qué conceptos clave se cubren?" 
              />
              
              <button type="submit" className="admin-submit-btn green">
                {editingCourseId ? 'GUARDAR CAMBIOS EN BIBLIOTECA' : 'PUBLICAR VIDEO'}
              </button>
              
              {editingCourseId && (
                <button 
                  type="button" 
                  onClick={() => { 
                    setEditingCourseId(null); 
                    setCourse({title:'', description:'', thumbnail_url:'', youtube_id:'', category:'', instructor:'Admin LevelUp'}); 
                  }} 
                  className="admin-cancel-btn"
                >
                  Cancelar Edición
                </button>
              )}
            </form>
          ) : (
            <form onSubmit={handlePathSubmit}>
              <h2 className="admin-form-title paths">
                {editingPathId ? 'Modificando Ruta Académica' : 'Crear Nueva Carrera'}
              </h2>
              
              <label className="admin-label">Nombre de la Ruta:</label>
              <input 
                className="admin-input" 
                value={pathForm.title} 
                onChange={e => setPathForm({...pathForm, title: e.target.value})} 
                placeholder="Ej: Especialista en Sistemas Embebidos" 
                required 
              />
              
              <label className="admin-label">Descripción de la Ruta:</label>
              <input 
                className="admin-input" 
                value={pathForm.description} 
                onChange={e => setPathForm({...pathForm, description: e.target.value})} 
                placeholder="Breve resumen de la carrera..." 
              />

              <label className="admin-label">Color Temático del Track:</label>
              <input 
                type="color" 
                className="admin-input admin-color-picker" 
                value={pathForm.color} 
                onChange={e => setPathForm({...pathForm, color: e.target.value})} 
              />
              
              <label className="admin-label" style={{ color: '#a855f7', marginTop: '15px' }}>
                Seleccionar videos del catálogo general:
              </label>
              
              <div className="video-selector-box">
                {Array.isArray(courses) && courses.length > 0 ? (
                  courses.map(c => {
                    const isSelected = pathForm.selectedVideos.includes(Number(c.id));
                    return (
                      <div 
                        key={c.id} 
                        onClick={() => toggleVideoInPath(c.id)} 
                        className={`video-option-item ${isSelected ? 'selected' : ''}`}
                      >
                        <input type="checkbox" checked={isSelected} readOnly />
                        <span style={{ fontSize: '0.8rem' }}>
                          {c.title} <small style={{ color: '#a855f7' }}>({c.category || 'Sin ruta'})</small>
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '10px 0' }}>
                    No hay videos en la biblioteca para vincular.
                  </p>
                )}
              </div>

              <label className="admin-label" style={{ color: '#4ade80', marginTop: '15px' }}>
                Orden de reproducción secuencial:
              </label>
              
              <div className="sequence-container">
                {Array.isArray(pathForm.selectedVideos) && pathForm.selectedVideos.length > 0 ? (
                  pathForm.selectedVideos.map((id, index) => {
                    const v = courses.find(c => Number(c.id) === Number(id));
                    return (
                      <div key={id} className="sequence-item">
                        <span className="sequence-text">
                          {index + 1}. {v?.title || `ID externo: ${id}`}
                        </span>
                        <div>
                          <button type="button" onClick={() => moveVideo(index, 'up')} className="mini-arrow-btn">▲</button>
                          <button type="button" onClick={() => moveVideo(index, 'down')} className="mini-arrow-btn">▼</button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0, textAlign: 'center' }}>
                    Ningún video seleccionado para esta ruta aún.
                  </p>
                )}
              </div>
              
              <button type="submit" className="admin-submit-btn purple">
                {editingPathId ? 'CONSOLIDAR CAMBIOS DE RUTA' : 'FORJAR CARRERA CON VIDEOS'}
              </button>
              
              {editingPathId && (
                <button type="button" onClick={resetPathForm} className="admin-cancel-btn">
                  Cancelar Cambios
                </button>
              )}
            </form>
          )}
        </section>

        {/* LISTADOS DERECHA */}
        <section className="admin-side-panel">
          <div className="admin-list-block purple-border">
            <h3 style={{ marginTop: 0, color: '#a855f7' }}>Tracks Universitarios Activos</h3>
            <div className="scrollable-list">
              {Array.isArray(paths) && paths.length > 0 ? (
                paths.map(p => (
                  <div key={p.id} className="admin-item-card" style={{ borderLeft: `4px solid ${p.color}` }}>
                    <div className="admin-item-info">
                      <p className="admin-item-title">{p.title}</p>
                      <small style={{ color: '#94a3b8' }}>{p.video_count || 0} videos enlazados</small>
                    </div>
                    <button onClick={() => startEditPath(p)} className="btn-action edit">[EDITAR]</button>
                    <button onClick={() => handleDeletePath(p.id)} className="btn-action delete">[ELIMINAR]</button>
                  </div>
                ))
              ) : (
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>No hay carreras registradas.</p>
              )}
            </div>
          </div>

          <div className="admin-list-block slate-border">
            <h3 style={{ marginTop: 0, color: '#4ade80' }}>Biblioteca Global de Videos</h3>
            <input 
              placeholder="Buscar video por título..." 
              className="admin-input" 
              style={{ marginBottom: '10px' }} 
              value={filter} 
              onChange={e => setFilter(e.target.value)} 
            />
            <div className="scrollable-list">
              {Array.isArray(courses) && courses.length > 0 ? (
                courses
                  .filter(c => c.title && c.title.toLowerCase().includes(filter.toLowerCase()))
                  .map(c => (
                    <div key={c.id} className="admin-item-card">
                      <div className="admin-item-info">
                        <p className="admin-item-title">{c.title}</p>
                      </div>
                      <button 
                        onClick={() => { setEditingCourseId(c.id); setCourse({ ...c }); setActiveTab('videos'); }} 
                        className="btn-action edit"
                      >
                        [EDITAR]
                      </button>
                      <button 
                        onClick={() => handleDeleteCourse(c.id)} 
                        className="btn-action delete"
                      >
                        [BORRAR]
                      </button>
                    </div>
                  ))
              ) : (
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>La biblioteca está vacía.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminPage;