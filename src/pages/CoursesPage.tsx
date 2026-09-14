import React, { useEffect, useState } from 'react';
import { CourseCard } from '../components/CourseCard';

interface CoursesPageProps {
  courses?: any[];
  favorites: number[];
  toggleFavorite: (e: React.MouseEvent, course: any) => void;
  navigateTo: (view: string) => void;
  setSelectedCourse: (course: any) => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({ 
  courses: initialCourses, 
  favorites, 
  toggleFavorite, 
  navigateTo, 
  setSelectedCourse 
}) => {
  const [courses, setCourses] = useState<any[]>(initialCourses || []);

  // Sincroniza los cursos si cambian en las props desde App.tsx
  useEffect(() => {
    if (initialCourses && initialCourses.length > 0) {
      setCourses(initialCourses);
    }
  }, [initialCourses]);

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', padding: '40px 20px' }}>
      <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '40px', fontSize: '2.5rem' }}>
        Explorar Cursos
      </h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '25px',
        maxWidth: '1400px',
        margin: '0 auto',
        alignItems: 'stretch' 
      }}>
        {courses.map((course: any) => (
          <div key={course.id} style={{ display: 'flex' }}>
            <CourseCard 
              course={course} 
              onClick={() => {
                setSelectedCourse(course);
                navigateTo('course-detail');
              }}
              onFavorite={(e) => toggleFavorite(e, course)}
              isFavorite={favorites.includes(course.id)}
            />
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: '50px' }}>
          No se encontraron cursos disponibles.
        </div>
      )}
    </div>
  );
};