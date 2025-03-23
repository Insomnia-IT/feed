import { Form, Input, Select, Checkbox } from 'antd';

import { Rules } from 'components/form';
import HorseIcon from 'assets/icons/horse-icon';

import styles from '../../common.module.css';
import useCanAccess from '../../use-can-access';
// import type { AccessRoleEntity, DirectionEntity, IPerson, VolunteerRoleEntity } from 'interfaces';
import type { DirectionEntity, IPerson } from 'interfaces';
import { useSelect } from '@refinedev/antd';

export const PersonalInfoSection = ({
  isBlocked,
  denyBadgeEdit,
  denyFeedTypeEdit,
  feedTypeOptions,
  kitchenOptions,
  genderOptions,
  // Добавляем новые пропсы
  canEditGroupBadge,
  colorTypeOptions,
  groupBadgeOptions,
  handleQRChange,
  person
}: {
  isBlocked: boolean;
  denyBadgeEdit: boolean;
  denyFeedTypeEdit: boolean;
  feedTypeOptions: { label: string; value: string | number }[];
  kitchenOptions: { label: string; value: string | number }[];
  genderOptions: { label: string; value: string | number }[];
  // Добавляем новые пропсы
  canEditGroupBadge: boolean;
  colorTypeOptions: { label: string; value: string | number }[];
  groupBadgeOptions: { label: string; value: string | number }[];
  handleQRChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  person: IPerson | null;
}) => {
  const form = Form.useFormInstance();

  const onGroupBadgeClear = () => {
      setTimeout(() => {
          form.setFieldValue('group_badge', '');
      });
  };

  const mainRole = Form.useWatch('main_role', form);
  const allowEmptyDirections = ['FELLOW', 'ART_FELLOW', 'VIP', 'PRESS', 'CONTRACTOR'].includes(mainRole);
  const allowRoleEdit = useCanAccess({ action: 'role_edit', resource: 'volunteers' });
     const { selectProps: directionsSelectProps } = useSelect<DirectionEntity>({
          resource: 'directions',
          optionLabel: 'name',
          optionValue: 'id'
      });
  
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
            <div className={styles.badgeInfoWrap}>
                <div className={styles.badgeInfo}>
                    <Form.Item label="QR бейджа" name="qr" rules={Rules.required}>
                        <Input disabled={denyBadgeEdit} onChange={handleQRChange} />
                    </Form.Item>
                </div>
                <div className={styles.badgeInfo}>
                    <Form.Item label="Групповой бейдж" name="group_badge">
                        <Select
                            disabled={!canEditGroupBadge}
                            allowClear
                            options={groupBadgeOptions}
                            onClear={onGroupBadgeClear}
                        />
                    </Form.Item>
                </div>
            </div>
            <div className={styles.badgeInfoWrap}>
                <div className={styles.badgeInfo}>
                    <div className={styles.badgeInfoPart}>
                        <Form.Item label="Партия бейджа" name="printing_batch" className={styles.badgeInfoPartItem}>
                            <Input readOnly disabled={denyBadgeEdit} />
                        </Form.Item>
                        <Form.Item label="Номер бейджа" name="badge_number" className={styles.badgeInfoPartItem}>
                            <Input disabled={denyBadgeEdit} />
                        </Form.Item>
                    </div>
                </div>
                <div className={styles.badgeInfo}>
                    <Form.Item label="Цвет бейджа" name="color_type">
                        <Select disabled={true} options={colorTypeOptions} />
                    </Form.Item>
                </div>
                <div className={styles.hrInput}>
                    <Form.Item
                        label="Служба / Локация"
                        name="directions"
                        rules={allowEmptyDirections ? undefined : Rules.required}
                    >
                        <Select disabled={!allowRoleEdit && !!person} mode="multiple" {...directionsSelectProps} />
                    </Form.Item>
                </div>
            </div>
        </>
    );
};
