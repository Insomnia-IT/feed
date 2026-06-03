import { Form, Select, Checkbox, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

import { Rules } from 'components/form';

import styles from '../../common.module.css';

export const FeedingSection = ({
    denyBadgeEdit,
    denyFeedTypeEdit,
    feedTypeOptions,
    kitchenOptions
}: {
    denyBadgeEdit: boolean;
    denyFeedTypeEdit: boolean;
    feedTypeOptions: { label: string; value: string | number }[];
    kitchenOptions: { label: string; value: string | number }[];
}) => {
    return (
        <>
            <div className={styles.formSection__title}>
                <h4>Питание</h4>
            </div>

            <div className={styles.feedingFieldRow}>
                <Form.Item
                    className={styles.feedingFieldFeedType}
                    label={
                        <span>
                            Тип питания
                            <Tooltip title="Базовый тип на весь период. Исключения по датам задаются ниже: при бесплатном типе — платные дни, при платном — бесплатные за счёт фестиваля.">
                                <InfoCircleOutlined className={styles.labelHint} />
                            </Tooltip>
                        </span>
                    }
                    name="feed_type"
                    rules={Rules.required}
                >
                    <Select disabled={denyFeedTypeEdit} options={feedTypeOptions} />
                </Form.Item>
                <Form.Item className={styles.feedingFieldKitchen} label="Кухня" name="kitchen" rules={Rules.required}>
                    <Select options={kitchenOptions} disabled={denyBadgeEdit} />
                </Form.Item>
                <Form.Item label=" " colon={false} className={styles.feedingCheckboxesFormItem}>
                    <div className={styles.feedingCheckboxesRow}>
                        <Form.Item name="is_vegan" valuePropName="checked" noStyle>
                            <Checkbox>Веган</Checkbox>
                        </Form.Item>
                        <Form.Item name="infant" valuePropName="checked" noStyle>
                            <Checkbox>&lt;18 лет</Checkbox>
                        </Form.Item>
                    </div>
                </Form.Item>
            </div>
        </>
    );
};
