export interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  youtube_id: string;
  category: string;
  instructor: string;
  image?: string;
}

export interface Path {
  id: any;
  title: string;
  description: string;
  color: string;
  selectedVideos: number[];
  video_count?: number;
  image?: string;
}

// --- BASE DE DATOS LOCAL REAL (IDs de YouTube activos y probados) ---
const initialCourses: Course[] = [
  // === EXPERTO EN FRONTEND ===
  { id: 352, title: "Curso COMPLETO de HTML GRATIS desde cero", description: "Aprende la estructura web y mucho mas!", youtube_id: "3nYLTiY5skU", category: "Experto en Frontend", instructor: "Midudev", thumbnail_url: "" },
  { id: 353, title: "Introducción a la programación con JavaScript", description: "Fundamentos de JS, variables, funciones, DOM y asincronía.", youtube_id: "Z34BF9PCfYg", category: "Experto en Frontend", instructor: "Midudev", thumbnail_url: "" },
  { id: 374, title: "Aprende React.js desde cero", description: "Componentes, hooks, estado y consumo de APIs en React.", youtube_id: "7iobxzd_2wY", category: "Experto en Frontend", instructor: "Midudev", thumbnail_url: "" },
  { id: 375, title: "Aprendiendo NextJS, el framework de React con Server Side Rendering", description: "Renderizado en servidor (SSR), Server Components y rutas dinámicas.", youtube_id: "2jxc8DMzt0I", category: "Experto en Frontend", instructor: "Midudev", thumbnail_url: "" },
  { id: 377, title: "Aprende TypeScript desde Cero", description: "Tipado estático, interfaces, genéricos y buenas prácticas en JS.", youtube_id: "fUgxxhI_bvc", category: "Experto en Frontend", instructor: "MiduDev", thumbnail_url: "" },

  // === EXPERTO EN BACKEND ===
  { id: 357, title: "Node.js y Express: Backend desde Cero", description: "Crea servidores web, APIs REST y gestión de rutas con Node.", youtube_id: "JmJ1WUoUIK4", category: "Experto en Backend", instructor: "Fazt", thumbnail_url: "" },
  { id: 398, title: "Bases de Datos Relacionales: SQL desde Cero", description: "Consultas, tablas, relaciones, JOINs y diseño de BD.", youtube_id: "OuJerKzV5T0", category: "Experto en Backend", instructor: "MoureDev", thumbnail_url: "" },
  { id: 400, title: "MongoDB Curso Completo para Principiantes", description: "Bases de datos NoSQL, colecciones, documentos y consultas.", youtube_id: "lWMemPN9t6Q", category: "Experto en Backend", instructor: "Fazt", thumbnail_url: "" },
  { id: 366, title: "Python desde Cero para Desarrollo Backend", description: "Variables, estructuras de control, OOP y creación de scripts.", youtube_id: "Kp4Mvapo5kc", category: "Experto en Backend", instructor: "MoureDev", thumbnail_url: "" },

  // === EXPERTO EN MOBILE ===
  { id: 388, title: "Flutter Curso Completo para Crear Apps", description: "Desarrollo multiplataforma para iOS y Android con Dart.", youtube_id: "IKG1eV2SetA", category: "Experto en Mobile", instructor: "AristiDevs", thumbnail_url: "" },
  { id: 391, title: "Kotlin para Android: Aplicación desde Cero", description: "Primeros pasos en Android Studio con Kotlin nativo.", youtube_id: "vJapzH_46a8", category: "Experto en Mobile", instructor: "AristiDevs", thumbnail_url: "" },
  { id: 394, title: "React Native: Aplicaciones Móviles con JS", description: "Aprovecha tus conocimientos de React para crear apps móviles.", youtube_id: "U23lNFm_J70", category: "Experto en Mobile", instructor: "Midudev", thumbnail_url: "" },

  // === EXPERTO EN DEVOPS Y HERRAMIENTAS ===
  { id: 404, title: "Git y GitHub desde Cero: Control de Versiones", description: "Aprende a gestionar ramas, repositorios y colaborar en código.", youtube_id: "3GymExBkKjE", category: "Experto en DevOps", instructor: "MoureDev", thumbnail_url: "" },
  { id: 407, title: "Comandos de Terminal y Linux para Programadores", description: "Dominio de la línea de comandos Bash para automatizar procesos.", youtube_id: "H4ayPYcZEfI", category: "Experto en DevOps", instructor: "Fazt", thumbnail_url: "" },
  { id: 425, title: "Docker desde Cero: Contenedores Fáciles", description: "Aísla tus entornos de desarrollo y despliega tus apps fácilmente.", youtube_id: "wZnddhLrmiM", category: "Experto en DevOps", instructor: "Midudev", thumbnail_url: "" },

  // === ESPECIALISTA EN IA ===
  { id: 447, title: "Inteligencia Artificial desde Cero: Conceptos Clave", description: "Comprende los fundamentos de Machine Learning, LLMs y Prompts.", youtube_id: "Phal-sPAunk", category: "Especialista en IA", instructor: "Adrian Saenz", thumbnail_url: "" },
  { id: 448, title: "Automatización con n8n y Webhooks", description: "Conecta servicios web y flujos automatizados sin programar de más.", youtube_id: "7Z-vRvIUqNs", category: "Especialista en IA", instructor: "Adrian Saenz", thumbnail_url: "" }
];

// --- FUNCIONES DEL SERVICIO OPTIMIZADAS ---

export const getCourses = async (): Promise<Course[]> => {
  if (typeof window === 'undefined') {
    return initialCourses.map(c => ({
      ...c,
      thumbnail_url: `https://img.youtube.com/vi/${c.youtube_id}/hqdefault.jpg`,
      image: `https://img.youtube.com/vi/${c.youtube_id}/mqdefault.jpg`
    }));
  }

  const localCourses = localStorage.getItem('levelup_courses');
  
  // Si no hay datos guardados o la versión vieja quedó obsoleta, regeneramos con la lista limpia
  if (!localCourses || JSON.parse(localCourses).length < initialCourses.length) {
    const formattedInitial = initialCourses.map(c => ({
      ...c,
      thumbnail_url: `https://img.youtube.com/vi/${c.youtube_id}/hqdefault.jpg`,
      image: `https://img.youtube.com/vi/${c.youtube_id}/mqdefault.jpg`
    }));
    localStorage.setItem('levelup_courses', JSON.stringify(formattedInitial));
    return formattedInitial;
  }
  
  const parsed: Course[] = JSON.parse(localCourses);
  return parsed.map(c => ({
    ...c,
    thumbnail_url: c.thumbnail_url || `https://img.youtube.com/vi/${c.youtube_id}/hqdefault.jpg`,
    image: c.image || `https://img.youtube.com/vi/${c.youtube_id}/mqdefault.jpg`
  }));
};

export const getPaths = async (): Promise<Path[]> => {
  if (typeof window === 'undefined') return [];
  const localPaths = localStorage.getItem('levelup_paths');
  if (!localPaths) return [];
  
  const parsed: Path[] = JSON.parse(localPaths);
  return parsed.map(p => ({
    ...p,
    video_count: p.selectedVideos ? p.selectedVideos.length : 0
  }));
};

export const getCoursesByPath = async (pathId: any): Promise<Course[]> => {
  const allCourses = await getCourses();
  if (typeof window === 'undefined') return [];
  
  const localPaths = localStorage.getItem('levelup_paths');
  const parsedPaths: Path[] = localPaths ? JSON.parse(localPaths) : [];
  
  const currentPath = parsedPaths.find(p => String(p.id) === String(pathId));
  if (!currentPath || !currentPath.selectedVideos) return [];
  
  return currentPath.selectedVideos
    .map(vId => allCourses.find(c => Number(c.id) === Number(vId)))
    .filter((c): c is Course => !!c);
};