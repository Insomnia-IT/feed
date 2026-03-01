import { type ComponentProps, type MouseEvent as ReactMouseEvent } from 'react';
import cn from 'classnames';

import css from './modal.module.css';

interface ModalProps extends ComponentProps<'div'> {
    active?: boolean;
    classModal?: string;
    classTitle?: string;
    onClose?: () => void;
    title?: string;
    noClose?: boolean;
}

export const Modal = (props: ModalProps) => {
    const { active, children, classModal, classTitle, onClose, title } = props;
    const isOpen = !!active;

    const handleClose = (): void => {
        if (onClose) {
            onClose();
        }
    };

    const handlePopupClick = (e: ReactMouseEvent<HTMLDivElement, MouseEvent>): void => {
        e.stopPropagation();
    };

    return (
        <div onMouseDown={handleClose} className={cn(css.backPopup, { [css.show]: isOpen })}>
            <div onMouseDown={handlePopupClick} className={cn(css.modal, {}, [classModal])}>
                <div className={cn(css.head)}>
                    <h2 className={cn(css.title, {}, [classTitle])}>{title}</h2>
                </div>
                {children}
            </div>
        </div>
    );
};
