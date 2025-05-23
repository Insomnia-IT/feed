import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useNavigationGuard = (onNavigationAttempt: (path: string) => void) => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a');
            
            if (link) {
                console.log('Link clicked:', link.href);
                
                try {
                    const url = new URL(link.href);
                    const path = url.pathname;
                    
                    console.log('Current path:', window.location.pathname);
                    console.log('Target path:', path);
                    
                    // Игнорируем текущий путь и якоря
                    if (path === window.location.pathname || path.startsWith('#')) {
                        console.log('Ignoring navigation - same path or anchor');
                        return;
                    }

                    // Проверяем, что это не страница редактирования волонтера
                    if (!path.startsWith('/volunteers/edit/')) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Preventing navigation and calling onNavigationAttempt');
                        onNavigationAttempt(path);
                    }
                } catch (error) {
                    console.error('Error processing navigation:', error);
                }
            }
        };

        // Добавляем обработчик с флагом capture для перехвата события до его всплытия
        document.addEventListener('click', handleClick, true);
        
        return () => {
            document.removeEventListener('click', handleClick, true);
        };
    }, [onNavigationAttempt]);
}; 