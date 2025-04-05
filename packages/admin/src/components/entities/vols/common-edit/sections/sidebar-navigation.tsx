import styles from '../../common.module.css';

export const SidebarNavigation = ({
    activeAnchor,
    denyBadgeEdit
}: {
    activeAnchor: string;
    denyBadgeEdit: boolean;
}) => {
    return (
        <div className={styles.edit__nav}>
            <ul className={styles.navList}>
                <li
                    className={`${styles.navList__item} ${activeAnchor === 'section1' ? styles.active : ''}`}
                    data-id="section1"
                >
                    Волонтер
                </li>
                <li
                    className={`${styles.navList__item} ${activeAnchor === 'section2' ? styles.active : ''}`}
                    data-id="section2"
                >
                    Даты на поле
                </li>
                <li
                    className={`${styles.navList__item} ${activeAnchor === 'section3' ? styles.active : ''}`}
                    data-id="section3"
                >
                    Личная информация
                </li>
                <li
                    className={`${styles.navList__item} ${activeAnchor === 'section4' ? styles.active : ''}`}
                    data-id="section4"
                    style={{ display: denyBadgeEdit ? 'none' : '' }}
                >
                    HR информация
                </li>
                <li
                    className={`${styles.navList__item} ${activeAnchor === 'section5' ? styles.active : ''}`}
                    data-id="section5"
                >
                    Кастомные Поля
                </li>
                <li
                    className={`${styles.navList__item} ${activeAnchor === 'section6' ? styles.active : ''}`}
                    data-id="section6"
                >
                    Дополнительно
                </li>
                <li
                    className={`${styles.navList__item} ${activeAnchor === 'section7' ? styles.active : ''}`}
                    data-id="section7"
                >
                    Участие в прошлых годах
                </li>
            </ul>
        </div>
    );
};
