import { Spin } from 'antd';
import { useNavigate } from 'react-router';
import { useList, useShow } from '@refinedev/core';
import type { VolEntity } from '../../../../interfaces';
import styles from './responsible-for.module.css';

const ResponsibleFor = () => {
    const navigate = useNavigate();
    const { result: vol } = useShow<VolEntity>();

    const { result: data, query } = useList<VolEntity>({
        resource: 'volunteers',
        filters: [
            {
                field: 'responsible_id',
                operator: 'eq',
                value: vol?.id
            }
        ],
        pagination: {
            mode: 'off'
        }
    });

    const volunteers = data?.data ?? [];

    const handleCardClick = (id: number) => {
        navigate(`/volunteers/edit/${id}`);
    };

    if (query.isLoading) {
        return <Spin />;
    }

    if (volunteers.length === 0) {
        return <div className={styles.empty}>Нет волонтеров, за которых вы ответственны</div>;
    }

    return (
        <div>
            <div className={styles.header}>Ответственен за</div>
            <div className={styles.grid}>
                {volunteers.map((vol) => (
                    <div key={vol.id} className={styles.card} onClick={() => handleCardClick(vol.id)}>
                        <div className={styles.cardName}>{vol.name || '—'}</div>
                        <div className={styles.cardRow}>
                            <span className={styles.cardLabel}>Имя:</span>
                            <span>{vol.first_name || '—'}</span>
                        </div>
                        <div className={styles.cardRow}>
                            <span className={styles.cardLabel}>Фамилия:</span>
                            <span>{vol.last_name || '—'}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ResponsibleFor;
