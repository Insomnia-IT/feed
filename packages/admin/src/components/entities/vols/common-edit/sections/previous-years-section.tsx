import { RadarChartOutlined } from '@ant-design/icons';

import styles from '../../common.module.css';

interface IEngagement {
    id: string;
    year: number;
    direction: {
        name: string;
    };
    role: {
        name: string;
    };
}

interface IPerson {
    engagements: IEngagement[];
}

export const PreviousYearsSection = ({ person }: { person: IPerson }) => {
    const engagements = person?.engagements || [];

    return (
        <>
            <p className={styles.formSection__title}>Участие во все года</p>
            <div className={styles.engagementsWrap}>
                {engagements.length > 0 &&
                    engagements.map((item: IEngagement) => (
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
