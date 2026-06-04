import { Form, Select, Checkbox } from 'antd';

import { Rules } from 'components/form';
import type { FeedTypeEntity } from 'interfaces';

import styles from '../../common.module.css';
import { FeedingCalendarField } from './feeding-calendar-field';
import { resolveFeedTypeId } from './feeding-calendar-utils';

export const FeedingSection = ({
    denyBadgeEdit,
    denyFeedTypeEdit,
    kitchenOptions,
    feedTypes
}: {
    denyBadgeEdit: boolean;
    denyFeedTypeEdit: boolean;
    kitchenOptions: { label: string; value: string | number }[];
    feedTypes: FeedTypeEntity[];
}) => {
    const form = Form.useFormInstance();
    const feedTypeId = Form.useWatch('feed_type', form);

    const childFeedTypeId = feedTypes.find(({ code }) => code === 'CHILD')?.id;
    const noFeedTypeId = feedTypes.find(({ code }) => code === 'NO')?.id;

    const isChild = childFeedTypeId !== undefined && feedTypeId === childFeedTypeId;
    const isNoFeed = noFeedTypeId !== undefined && feedTypeId === noFeedTypeId;
    const showCalendar = !isChild && !isNoFeed;

    const handleChildChange = (checked: boolean) => {
        if (checked) {
            if (childFeedTypeId !== undefined) {
                form.setFieldValue('feed_type', childFeedTypeId);
            }
            form.setFieldValue('paid_arrivals', []);
            return;
        }

        const defaultFreeId = resolveFeedTypeId({ feedTypes, code: 'FREE' });
        if (defaultFreeId !== undefined) {
            form.setFieldValue('feed_type', defaultFreeId);
        }
    };

    return (
        <>
            <div className={styles.formSection__title}>
                <h4>Питание</h4>
            </div>

            <div className={styles.feedingFieldRow}>
                <Form.Item className={styles.feedingFieldKitchen} label="Кухня" name="kitchen" rules={Rules.required}>
                    <Select options={kitchenOptions} disabled={denyBadgeEdit} />
                </Form.Item>
                <Form.Item label=" " colon={false} className={styles.feedingCheckboxesFormItem}>
                    <div className={styles.feedingCheckboxesRow}>
                        <Form.Item name="is_vegan" valuePropName="checked" noStyle>
                            <Checkbox>Веган</Checkbox>
                        </Form.Item>
                        <Checkbox
                            checked={isChild}
                            disabled={denyFeedTypeEdit}
                            onChange={(event) => handleChildChange(event.target.checked)}
                        >
                            Ребёнок
                        </Checkbox>
                        <Form.Item name="infant" valuePropName="checked" noStyle>
                            <Checkbox>&lt;18 лет</Checkbox>
                        </Form.Item>
                    </div>
                </Form.Item>
            </div>

            <Form.Item name="feed_type" hidden rules={Rules.required} />

            {isChild ? (
                <p className={styles.sectionHint}>
                    Ребёнок питается бесплатно на весь период. Календарь питания не требуется.
                </p>
            ) : null}

            {isNoFeed ? (
                <p className={styles.sectionHint}>У волонтёра тип «без питания» — календарь недоступен.</p>
            ) : null}

            {showCalendar ? (
                <Form.Item name="paid_arrivals" noStyle initialValue={[]}>
                    <FeedingCalendarField feedTypes={feedTypes} disabled={denyFeedTypeEdit} />
                </Form.Item>
            ) : null}
        </>
    );
};
