import { useEffect } from 'react';

type UseModalEnterSubmitParams = {
    open: boolean;
    onSubmit: () => void;
};

export const useModalEnterSubmit = ({ open, onSubmit }: UseModalEnterSubmitParams) => {
    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Enter' || event.repeat) {
                return;
            }

            const target = event.target;
            if (target instanceof HTMLTextAreaElement) {
                return;
            }
            if (target instanceof HTMLInputElement && !['button', 'submit', 'reset'].includes(target.type)) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            onSubmit();
        };

        document.addEventListener('keydown', handleKeyDown, true);
        return () => document.removeEventListener('keydown', handleKeyDown, true);
    }, [onSubmit, open]);
};
