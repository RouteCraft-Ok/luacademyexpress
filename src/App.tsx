import { getCourses, getPaths } from './services/courseService';
import AdminPage from './pages/AdminPage';
import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import { NavBar } from './components/NavBar';
import { LandingPage } from './pages/LandingPage';
import { ExplorerPage } from './pages/ExplorerPage';
import ProfilePage from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { PathDetailPage } from './pages/PathDetailPage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailPage } from './pages/CourseDetailPage'; 
import { AIAssistant } from './components/AIAssistant';
import { DashboardPage } from './pages/DashboardPage';
import confetti from 'canvas-confetti';
import { ACADEMY_DATA } from './data/routesData';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const App: React.FC = () => {
  const [fromPage, setFromPage] = useState<string>(localStorage.getItem('fromPage') || 'explorer');
  const [courses, setCourses] = useState<any[]>([]);
  const [paths, setPaths] = useState<any[]>([]); // <-- ESTADO AGREGADO PARA LAS CARRERAS DINÁMICAS
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('userName'));
  const [view, setView] = useState<any>(localStorage.getItem('lastView') || 'landing');
  const [searchTerm, setSearchTerm] = useState('');
  const [catFilter, setCatFilter] = useState('Todos');
  
  const [selectedCourse, setSelectedCourse] = useState<any>(() => {
    const saved = localStorage.getItem('selectedCourse');
    return saved ? JSON.parse(saved) : null;
  });

  const [selectedRoute, setSelectedRoute] = useState<any>(() => {
    const saved = localStorage.getItem('selectedRoute');
    return saved ? JSON.parse(saved) : null;
  });

  const [favorites, setFavorites] = useState<number[]>([]);
  const [completed, setCompleted] = useState<number[]>([]);

  // 1. COMPLETAR CURSO (SIMULADO LOCAL)
  const toggleComplete = async (courseId: number) => {
    if (!token) {
      alert("Inicia sesión para guardar tu progreso.");
      navigateTo('login');
      return;
    }

    const isNowCompleted = !completed.includes(courseId);
    let updatedCompleted: number[];
    
    if (isNowCompleted) {
      updatedCompleted = [...completed, courseId];
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    } else {
      updatedCompleted = completed.filter(id => id !== courseId);
    }

    setCompleted(updatedCompleted);
    localStorage.setItem('levelup_completed', JSON.stringify(updatedCompleted));
  };

  // 2. FAVORITOS (SIMULADO LOCAL)
  const toggleFavorite = async (e: React.MouseEvent, course: any) => {
    e.stopPropagation();
    if (!token) return navigateTo('login');

    const isFavorite = favorites.includes(course.id);
    let updatedFavorites: number[];

    if (isFavorite) {
      updatedFavorites = favorites.filter(id => id !== course.id);
    } else {
      updatedFavorites = [...favorites, course.id];
    }

    setFavorites(updatedFavorites);
    localStorage.setItem('levelup_favorites', JSON.stringify(updatedFavorites));
  };

  // 3. SELECCIONAR CURSO MODIFICADO (Registra automáticamente el origen 'fromPage')
  const handleSelectCourse = async (course: any) => {
  setSelectedCourse(course);
  localStorage.setItem('selectedCourse', JSON.stringify(course));

  // Si el usuario viene del Landing, Explorer o Dashboard,
  // eliminamos la ruta activa.
  if (view === 'landing' || view === 'explorer' || view === 'dashboard') {
    setSelectedRoute(null);
    localStorage.removeItem('selectedRoute');
  }

  if (view === 'landing' || view === 'explorer' || view === 'dashboard' || view === 'path-detail') {
    setFromPage(view);
    localStorage.setItem('fromPage', view);
  }

  navigateTo('course-detail');
};

  useEffect(() => {
    const savedView = localStorage.getItem('lastView');
    if (savedView) setView(savedView);

    const savedRoute = localStorage.getItem('selectedRoute');
    if (savedRoute && savedRoute !== "undefined" && savedRoute !== "null") {
      try {
        setSelectedRoute(JSON.parse(savedRoute));
      } catch (e) { console.error("Error parseando ruta"); }
    }

    const savedCourse = localStorage.getItem('selectedCourse');
    if (savedCourse && savedCourse !== "undefined" && savedCourse !== "null") {
      try {
        setSelectedCourse(JSON.parse(savedCourse));
      } catch (e) { console.error("Error parseando curso"); }
    }
  }, []);

  useEffect(() => {
    if (view === 'course-detail' && !selectedCourse) {
      navigateTo('explorer');
    }
  }, [view, selectedCourse]);

  // 4. AVANZAR CURSO MODIFICADO PARA COMPATIBILIDAD CON NUEVAS RUTAS
  const handleNextCourse = (currentCourseId: number) => {
    if (!token) {
      alert("Debes estar registrado para avanzar en las rutas de aprendizaje.");
      navigateTo('login');
      return;
    }

    if (!completed.includes(currentCourseId)) {
      toggleComplete(currentCourseId);
    }

    // Unimos las rutas estáticas antiguas con las nuevas creadas en el admin
    const staticRoutes = Object.values(ACADEMY_DATA).flat();
    const dynamicRoutes = paths.map(p => ({
      id: p.id,
      title: p.title,
      courseIds: p.selectedVideos || []
    }));
    
    const allRoutes = [...staticRoutes, ...dynamicRoutes];
    const currentRouteInDato = allRoutes.find(route => route.courseIds.map(Number).includes(Number(currentCourseId)));

    if (currentRouteInDato) {
      const courseIdsMapped = currentRouteInDato.courseIds.map(Number);
      const currentIndex = courseIdsMapped.indexOf(Number(currentCourseId));
      const nextCourseId = courseIdsMapped[currentIndex + 1];

      if (nextCourseId) {
        const nextCourse = courses.find(c => Number(c.id) === nextCourseId);
        if (nextCourse) {
          setSelectedCourse(nextCourse);
          localStorage.setItem('selectedCourse', JSON.stringify(nextCourse));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        navigateTo('path-detail');
      }
    }
  };

  // 5. AUTH SIMULADA
  const handleLogin = async (credentials: any) => {
    const authToken = "token-falso-de-prueba-12345";
    const name = credentials.email ? credentials.email.split('@')[0] : "Estudiante";

    localStorage.setItem('token', authToken);
    localStorage.setItem('userName', name);
    
    setToken(authToken);
    setUserName(name);
    
    alert(`¡Bienvenido de prueba, ${name}!`);
    navigateTo('dashboard');
  };

  const handleRegister = async (userData: any) => {
    alert("¡Cuenta creada con éxito (Modo Demo Local)!");
    navigateTo('login');
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    navigateTo('landing');
  };

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => setView(event.state?.view || 'landing');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (newView: string, data: any = null) => {
  window.history.pushState({ view: newView }, '');
  setView(newView);
  localStorage.setItem('lastView', newView);

  // Si entramos al detalle de un curso, mantenemos el curso activo
  if (newView === 'course-detail' && data) {
    setSelectedCourse(data);
    localStorage.setItem('selectedCourse', JSON.stringify(data));

    setFromPage(view);
    localStorage.setItem('fromPage', view);
  }

  // Si salimos del detalle del curso, eliminamos el curso activo
  if (newView !== 'course-detail') {
    setSelectedCourse(null);
    localStorage.removeItem('selectedCourse');
  }

  if (newView === 'path-detail' && data) {
    setSelectedRoute(data);
    localStorage.setItem('selectedRoute', JSON.stringify(data));
  }

  window.scrollTo(0, 0);
};
    
  // 6. CARGA DE DATOS UNIFICADA REEMPLAZADA POR SERVICIOS LOCALES
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Carga los videos del localStorage actualizados
        const dataCourses = await getCourses();
        setCourses(dataCourses);

        // Carga las rutas/carreras del localStorage creadas en el admin
        const dataPaths = await getPaths();
        setPaths(dataPaths);

        if (token) {
          const savedCompleted = localStorage.getItem('levelup_completed');
          const savedFavorites = localStorage.getItem('levelup_favorites');
          setCompleted(savedCompleted ? JSON.parse(savedCompleted) : []);
          setFavorites(savedFavorites ? JSON.parse(savedFavorites) : []);
        }
      } catch (err: any) {
        console.error("Error al cargar los datos simulados", err);
      }
    };
    fetchData();
  }, [token]);

  // Evento global para forzar recarga cuando se guarda algo en AdminPage sin refrescar la app entera
  useEffect(() => {
    const handleStorageChange = async () => {
      const dataCourses = await getCourses();
      setCourses(dataCourses);
      const dataPaths = await getPaths();
      setPaths(dataPaths);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const displayCourses = (Array.isArray(courses) ? courses : []).filter((course: any) => {
    const title = course.title || ""; 
    const matchesText = title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = catFilter === 'Todos' || course.category === catFilter || course.job_type === catFilter;
    return matchesText && matchesCat;
  });

  const downloadPDF = async (courseTitle: string) => {
    const element = document.getElementById('diploma-to-print');
    if (!element) {
      alert("Por favor, abre tu Dashboard primero para cargar la plantilla de certificados.");
      return;
    }
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [800, 600] });
      pdf.addImage(imgData, 'PNG', 0, 0, 800, 600);
      pdf.save(`Certificado-${courseTitle}.pdf`);
    } catch (error) {
      console.error("Error al generar PDF:", error);
    }
  };

  // Convertimos las rutas dinámicas al formato que CategoriesPage entiende para fusionarlas con ACADEMY_DATA
  const getFacetedRoutes = () => {
    const dynamicFormatted = paths.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description || 'Ruta personalizada creada por el Administrador',
      duration: 'A tu ritmo',
      coursesCount: p.selectedVideos ? p.selectedVideos.length : 0,
      courseIds: p.selectedVideos || [],
      color: p.color || '#a855f7',
      isDynamic: true
    }));

    return [...dynamicFormatted];
  };

  return (
    <div className="app-layout education-theme">
      <NavBar navigateTo={navigateTo} token={token} handleLogout={handleLogout} userName={userName} />

      <main className="main-content">
        {view === 'landing' && (
          <LandingPage courses={courses} favorites={favorites} toggleFavorite={toggleFavorite} navigateTo={navigateTo} setSelectedCourse={handleSelectCourse} />
        )}

        {view === 'categories' && (
          <CategoriesPage courses={courses} completed={completed} setSelectedRoute={setSelectedRoute} navigateTo={navigateTo} dynamicRoutes={getFacetedRoutes()} />
        )}

        {view === 'path-detail' && selectedRoute && (
          <PathDetailPage 
            selectedRoute={selectedRoute} 
            courses={courses} 
            completed={completed} 
            favorites={favorites} 
            toggleFavorite={toggleFavorite} 
            navigateTo={navigateTo} 
            setSelectedCourse={handleSelectCourse} 
            downloadPDF={downloadPDF} 
            fromPage={fromPage}
          />
        )}

        {view === 'explorer' && (
          <ExplorerPage searchTerm={searchTerm} setSearchTerm={setSearchTerm} catFilter={catFilter} setCatFilter={setCatFilter} filteredCourses={displayCourses} favorites={favorites} toggleFavorite={toggleFavorite} navigateTo={navigateTo} setSelectedCourse={handleSelectCourse} onSearch={() => console.log(searchTerm)} />
        )}

        {view === 'dashboard' && (
          <DashboardPage courses={courses} favorites={favorites} completed={completed} toggleFavorite={toggleFavorite} navigateTo={navigateTo} setSelectedCourse={handleSelectCourse} setSelectedRoute={setSelectedRoute} />
        )}

        {view === 'admin' && <AdminPage token={token} />}

        {view === 'course-detail' && selectedCourse && (
          <CourseDetailPage 
            selectedCourse={selectedCourse} 
            completed={completed} 
            toggleComplete={toggleComplete} 
            navigateTo={navigateTo} 
            setSelectedCourse={(course: any) => {
              setSelectedCourse(course);
              localStorage.setItem('selectedCourse', JSON.stringify(course));
            }}
            selectedRoute={selectedRoute}
            courses={courses}
            fromPage={fromPage}
          />
        )}

        {view === 'profile' && <ProfilePage token={token} handleLogout={handleLogout} />}
        {view === 'login' && <LoginPage onLogin={handleLogin} onSwitchToRegister={() => setView('register')} />}
        {view === 'register' && <RegisterPage onRegister={handleRegister} onSwitchToLogin={() => setView('login')} />}
        {view === 'courses' && (
          <CoursesPage courses={courses} favorites={favorites} toggleFavorite={toggleFavorite} navigateTo={navigateTo} setSelectedCourse={handleSelectCourse} />
        )}
      </main>

      <AIAssistant selectedCourse={selectedCourse} />

      <footer className="main-footer">
        <div className="container-center">
          <p style={{color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', textAlign: 'center'}}>© 2026 LevelUp Academy</p>
        </div>
      </footer>
    </div>
  );
};

export default App;