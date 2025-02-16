import styles from './mass-edit.module.css';
import { Typography } from 'antd';
import React from 'react';
const { Title } = Typography;

interface MassEditProps {
    selectedVolunteers?: any[];
    isAllSelected?: boolean;
}

export const MassEdit: React.FC<MassEditProps> = ({ selectedVolunteers = [], isAllSelected = false }) => {
    if (selectedVolunteers.length === 0 && !isAllSelected) {
        return null;
    }

    return (
        <div className={styles.block}>
            <header>
                <Title level={4}>
                    Множественный выбор
                    <span className={styles.counter}> {isAllSelected ? 'Все' : selectedVolunteers.length}</span>
                </Title>
            </header>
            <section>список волонтеров</section>
            <section className={styles.action}>
                <header>
                    <Title level={5}>Быстрые действия</Title>
                </header>
            </section>
        </div>
    );
};
