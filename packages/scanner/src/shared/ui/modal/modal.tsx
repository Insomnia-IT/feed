import React, { useEffect, useState } from 'react';
import cn from 'classnames';

import css from './modal.module.css';

interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
    active?: boolean;
    classModal?: string;
    classTitle?: string;
    onClose?: () => void;
    title?: string;
    noClose?: boolean;
}

const Modal = (props: ModalProps): React.ReactElement => {
    const { active, children, classModal, classTitle, noClose, onClose, title } = props;

    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setIsOpen(!!active);
    }, [active]);

    const handleClose = (): void => {
        if (onClose) {
            onClose();
        }
        setIsOpen(false);
    };

    const handlePopupClick = (e): void => {
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

export default Modal;
