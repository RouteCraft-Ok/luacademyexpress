import { useState, useEffect } from 'react';
import { ACADEMY_DATA } from '../data/routesData';
import './CategoriesPage.css';

export const CategoriesPage = ({ completed = [], navigateTo, setSelectedRoute, dynamicRoutes = [] }: any) => {
  const [paths, setPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // 1. Mapear las carreras dinámicas (Admin)
      const dynamicPathsMapped = dynamicRoutes.map((route: any) => ({
        id: route.id,
        title: route.title,
        description: route.description || 'Ruta personalizada creada por el Administrador.',
        image: route.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80',
        color: route.color || '#a855f7',
        video_count: route.coursesCount || route.courseIds?.length || 0,
        video_ids: route.courseIds || []
      }));

      // 2. Mapear las carreras estáticas
      const staticPaths = Object.entries(ACADEMY_DATA).map(([categoryName, routesArray]: [string, any[]]) => {
        const routeInfo = routesArray[0] || {};
        return {
          id: routeInfo.id || categoryName.toLowerCase().replace(/\s+/g, '-'),
          title: categoryName,
          description: routeInfo.description || 'Domina esta especialización con nuestra ruta guiada.',
          image: routeInfo.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80',
          color: routeInfo.color || '#4ade80',
          video_count: routeInfo.courseIds?.length || 0,
          video_ids: routeInfo.courseIds || []
        };
      });

      // 3. Filtrar estáticas que coincidan con dinámicas para no duplicar
      const filteredStatic = staticPaths.filter((sp) => {
        return !dynamicPathsMapped.some((dp: any) => 
          String(dp.id).toLowerCase() === String(sp.id).toLowerCase() ||
          String(dp.title).toLowerCase() === String(sp.title).toLowerCase()
        );
      });

      // 4. UNIR: Ponemos DIRECTAMENTE las dinámicas primero (sin .reverse()) y luego las estáticas
      const merged = [...dynamicPathsMapped, ...filteredStatic];

      setPaths(merged);
    } catch (err) {
      console.error("Error procesando rutas unificadas:", err);
    } finally {
      setLoading(false);
    }
  }, [dynamicRoutes]);

  if (loading) {
    return (
      <div className="container-center" style={{ marginTop: '100px', textAlign: 'center' }}>
        <div className="white-text">Cargando tus rutas personalizadas...</div>
      </div>
    );
  }

  return (
    <div className="categories-container">
      <header className="categories-header">
        <h1 className="white-text">Rutas de Especialización</h1>
        <p className="categories-subtitle">
          Explora las carreras diseñadas desde tus datos de aprendizaje locales.
        </p>
      </header>

      <main className="routes-grid">
        {Array.isArray(paths) && paths.map((route) => {
          const totalInRoute = Number(route.video_count) || 0;
          const doneInRoute = Array.isArray(route.video_ids) 
            ? route.video_ids.filter((id: any) => completed.map(String).includes(String(id))).length 
            : 0;
          const progress = totalInRoute > 0 ? Math.round((doneInRoute / totalInRoute) * 100) : 0;
          const routeColor = route.color || '#4ade80';

          return (
            <div 
              key={route.id}
              onClick={() => {
                setSelectedRoute(route); 
                navigateTo('path-detail', route);
              }}
              className="route-card-premium"
            >
              {/* Indicador de Color */}
              <div 
                className="route-badge-color" 
                style={{ 
                  background: routeColor, 
                  boxShadow: `0 0 10px ${routeColor}` 
                }} 
              />

              {/* Imagen de Portada */}
              <div 
                className="route-card-image" 
                style={{ backgroundImage: `url(${route.image})` }} 
              />
              
              {/* Contenido */}
              <div className="route-card-body">
                <h4 className="white-text route-card-title">{route.title}</h4>
                <p className="route-card-description">
                  {route.description || 'Sin descripción disponible.'}
                </p>
                
                {/* Barra de Progreso */}
                <div className="route-card-footer">
                  <div className="route-card-info" style={{ color: routeColor }}>
                    <span>{totalInRoute} Módulos</span>
                    <span>{progress}% Completado</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div 
                      className="progress-bar-fill" 
                      style={{ 
                        width: `${progress}%`, 
                        background: routeColor,
                        boxShadow: `0 0 10px ${routeColor}66`
                      }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
};