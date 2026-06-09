import { ExportOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { useList, useShow } from '@refinedev/core';
import type { VolEntity } from '../../../../interfaces';
import commonStyles from '../common.module.css';
import styles from './responsible-for.module.css';

const openVolunteerInNewTab = (id: number) => {
    window.open(`${window.location.origin}/volunteers/edit/${id}`, '_blank', 'noopener,noreferrer');
};

const ResponsibleFor = () => {
    const { result: vol } = useShow<VolEntity>();

    const { result: data, query } = useList<VolEntity>({
        resource: 'volunteers',
        filters: [
            {
                field: 'responsible_id',
                operator: 'eq',
                value: vol ? vol.id : -1
            }
        ],
        pagination: {
            mode: 'off'
        }
    });

    const volunteers = data?.data ?? [];

    if (query.isLoading) {
        return <Spin />;
    }

    if (volunteers.length === 0) {
        return <div className={styles.empty}>Нет волонтеров, за которых вы ответственны</div>;
    }

    return (
        <>
            <div className={commonStyles.formSection__title}>
                <h4>Ответственен за</h4>
            </div>
            <div className={styles.grid}>
                {volunteers.map((vol) => (
                    <div
                        key={vol.id}
                        className={styles.card}
                        title="Открыть в новой вкладке"
                        onClick={() => openVolunteerInNewTab(vol.id)}
                    >
                        <div className={styles.cardHeader}>
                            <div className={styles.cardName}>{vol.name || '—'}</div>
                            <ExportOutlined className={styles.cardOpenIcon} aria-hidden />
                        </div>
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
        </>
    );
};

export default ResponsibleFor;
