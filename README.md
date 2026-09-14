# LevelUp Academy 🎓

Plataforma educativa interactiva diseñada para la gestión de rutas de aprendizaje y especializaciones técnicas. Este proyecto está optimizado como un MVP (Producto Mínimo Viable) de alto rendimiento, corriendo de forma 100% serverless y local para su despliegue inmediato.

## ✨ Características Principales
* **Explorador de Carreras:** ~20 rutas y cursos técnicos pre-cargados con progreso dinámico sincronizado.
* **Panel de Administración Local:** Permite estructurar nuevas carreras, añadir videos de YouTube, ordenar secuencias de reproducción y persistir los cambios mediante `localStorage`.
* **Perfil de Estudiante:** Gestión de información del usuario y personalización del avatar con persistencia de estado.
* **Interfaz de Asistente IA:** UI premium diseñada para la integración de modelos de lenguaje (LLMs), actualmente configurada en modo demo.

## 🛠️ Tecnologías Utilizadas
* **Frontend:** React 19, TypeScript, Vite
* **Estilos:** CSS3 Modular / Premium Dark Theme
* **Despliegue:** Vercel (Client-Side State Routing)

## 🚀 Instalación y Ejecución Local

1. Clonar el repositorio:
   ```bash
   git clone [https://github.com/RouteCraft-Dev/luacademyexpress.git](https://github.com/RouteCraft-Dev/luacademyexpress.git)


   Instalar dependencias:

Bash
npm install
Correr en modo desarrollo:

Bash
npm run dev
Nota: El proyecto utiliza un enfoque pragmático desacoplado del backend mediante servicios integrados (courseService.ts), lo que permite migrar a una base de datos relacional cambiando únicamente la capa de servicio.