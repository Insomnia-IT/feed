import type { ReactNode } from 'react';
import { Col, Row, Typography } from 'antd';

import styles from './filters.module.css';

export const FilterFieldShell = ({
    children,
    isMobile,
    title
}: {
    children: ReactNode;
    isMobile?: boolean;
    title: string;
}) => (
    <Col className={`${styles.filterField} ${isMobile ? styles.mobileFilterField : ''}`.trim()}>
        <Row>
            <Typography.Text type="secondary">{title}</Typography.Text>
        </Row>
        <Row>{children}</Row>
    </Col>
);
