import { Form, Input, Select, Checkbox } from 'antd';

import { Rules } from 'components/form';
import HorseIcon from 'assets/icons/horse-icon';

import styles from '../../common.module.css';

export const PersonalInfoSection = ({
    isBlocked,
    denyBadgeEdit,
    denyFeedTypeEdit,
    feedTypeOptions,
    kitchenOptions,
    genderOptions
}: {
    isBlocked: boolean;
    denyBadgeEdit: boolean;
    denyFeedTypeEdit: boolean;
    feedTypeOptions: { label: string; value: string | number }[];
    kitchenOptions: { label: string; value: string | number }[];
    genderOptions: { label: string; value: string | number }[];
}) => {
    return (
        <>
            <div className={styles.formSection__title}>
                Персональная информация
                {isBlocked && (
                    <div className={styles.bannedWrap}>
                        <span className={styles.bannedDescr}>Забанен</span>
                    </div>
                )}
            </div>
            <div className={styles.personalWrap}>
                <div className={styles.photoWrap}>
                    <HorseIcon />
                </div>
                <div className={styles.personalInfoWrap}>
                    <div className={styles.nickNameLastnameWrap}>
                        <div className={`${styles.nameInput} ${styles.padInp}`}>
                            <Form.Item label="Надпись на бейдже" name="name" rules={Rules.required}>
                                <Input readOnly={denyBadgeEdit} />
                            </Form.Item>
                            
                        </div>
                        <div className={`${styles.nameInput} ${styles.padInp}`}>
                            <Form.Item label="Имя" name="first_name">
                                <Input readOnly={denyBadgeEdit} />
                            </Form.Item>
                        </div>
                        <div className={styles.nameInput}>
                            <Form.Item label="Фамилия" name="last_name">
                                <Input readOnly={denyBadgeEdit} />
                            </Form.Item>
                        </div>
                        <div className={styles.phoneInput}>
                            <Form.Item label="Telegram" name={['person', 'telegram']}>
                                <Input />
                            </Form.Item>
                        </div>
                    </div>
                    <div className={styles.nickNameLastnameWrap}>
                        <div className={styles.phoneInput}>
                            <Form.Item label="Телефон" name="phone">
                                <Input type="phone" />
                            </Form.Item>
                        </div>
                        <div className={styles.genderSelect}>
                            <Form.Item label="Пол волонтера" name="gender">
                                <Select disabled={denyBadgeEdit} options={genderOptions} />
                            </Form.Item>
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.kitchenTypeWrap}>
                <div className={styles.kitchenSelect}>
                    <Form.Item label="Кухня" name="kitchen" rules={Rules.required}>
                        <Select options={kitchenOptions} />
                    </Form.Item>
                </div>
                <div className={styles.typeMeal}>
                    <Form.Item label="Тип питания" name="feed_type" rules={Rules.required}>
                        <Select disabled={denyFeedTypeEdit} options={feedTypeOptions} />
                    </Form.Item>
                </div>
            </div>
            <div className={styles.isActiveCheckboxWrap}>
                <div className={styles.isActiveCheckbox}>
                    <Form.Item name="is_vegan" valuePropName="checked">
                        <Checkbox>Веган</Checkbox>
                    </Form.Item>
                </div>
            </div>
        </>
    );
};
