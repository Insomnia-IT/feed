import { RadarChartOutlined } from '@ant-design/icons';

import type { PersonEntity } from 'interfaces';

import styles from '../../common.module.css';

export const PreviousYearsSection = ({ person }: { person: PersonEntity | null }) => {
    const engagements = person?.engagements || [];

    return (
        <>
            <p className={styles.formSection__title}>Участие в прошлых годах</p>
            <div className={styles.engagementsWrap}>
                {engagements.length > 0 &&
                    engagements.map((item) => (
                        <div key={item.id}>
                            <span className={styles.engagementsDescr}>{`${item.year} год`}</span>
                            <RadarChartOutlined style={{ marginRight: '3px' }} />
                            <span className={styles.engagementsDescr}>{item.direction.name}</span>
                            <span className={styles.engagementsDescr}>{`(${item.role.name})`}</span>
                        </div>
                    ))}
            </div>
        </>
    );
};
