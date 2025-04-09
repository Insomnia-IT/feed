import { Form, Input, Select, Image, Button, Popconfirm } from 'antd';
import { useState } from 'react';
import { Rules } from 'components/form';
import HorseIcon from 'assets/icons/horse-icon';
import styles from '../../common.module.css';
import useCanAccess from '../../use-can-access';
import type { DirectionEntity, IPerson } from 'interfaces';
import { useSelect } from '@refinedev/antd';
import { DeleteOutlined } from '@ant-design/icons';


export const VolInfoSection = ({
  isBlocked,
  denyBadgeEdit,
  canEditGroupBadge,
  colorTypeOptions,
  groupBadgeOptions,
  person
}: {
  isBlocked: boolean;
  denyBadgeEdit: boolean;
  denyFeedTypeEdit: boolean;
  feedTypeOptions: { label: string; value: string | number }[];
  kitchenOptions: { label: string; value: string | number }[];
  genderOptions: { label: string; value: string | number }[];
  canEditGroupBadge: boolean;
  colorTypeOptions: { label: string; value: string | number }[];
  groupBadgeOptions: { label: string; value: string | number }[];
  handleQRChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  person: IPerson | null;
}) => {
  const form = Form.useFormInstance();
  const [imageError, setImageError] = useState(false);

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

  const volPhoto = form.getFieldValue('photo');

  const deletePhoto = () => {
    setTimeout(() => {
      form.setFieldsValue({ photo: '' });
      setImageError(false);
    });
  };

  const badgeColorMap: Record<number, string> = {
    1: '#f5222d',
    2: '#52c41a',
    3: '#1890ff',
    4: '#722ed1',
    5: '#fa8c16',
    6: '#fadb14',
    7: '#d9d9d9'
  };

  const getColorCircle = (color: string) => (
    <span
      className={styles.badgeColorCircle}
      style={{ backgroundColor: color }}
    />
  );

  const colorTypeOptionsWithBadges = colorTypeOptions.map(({ label, value }) => {
    const color = badgeColorMap[value as number] || 'default';
    return {
      value,
      label: (
        <span className={styles.badgeColorContainer}>
          {getColorCircle(color)}
          {label}
        </span>
      )
    };
  });


  return (
    <>
      <div className={styles.formSection__title}>
        Волонтер
        {isBlocked && (
          <div className={styles.bannedWrap}>
            <span className={styles.bannedDescr}>Заблокирован</span>
          </div>
        )}
      </div>
      <div className={styles.personalWrap}>
        <div className={styles.photoWrap}>
          {volPhoto && !imageError ? (
            <>
              <Image
                src={volPhoto}
                alt="Фото волонтера"
                width={112}
                height={112}
                style={{ objectFit: 'cover', borderRadius: '2px', border: '1px solid #D9D9D9' }}
                onError={() => setImageError(true)}
              />

              <Popconfirm
                title="Удалить фото"
                description="Вы уверены, что хотите удалить фото?"
                okText="Да"
                cancelText="Нет"
                okButtonProps={{ style: { background: '#ff4d4f', borderColor: '#ff4d4f' } }}
                onConfirm={deletePhoto}
              >
                <Button
                  className={styles.deleteButton}
                  danger
                  type="link"
                  icon={<DeleteOutlined />}
                  style={{ right: '0px', position: 'static', fontSize: '12px' }}

                >Удалить фото
                </Button>
              </Popconfirm>
            </>

          ) : (
            <HorseIcon />
          )}

        </div>
        <div>
          <Form.Item name="photo" shouldUpdate>
            <Input type="hidden" />
          </Form.Item>
        </div>
        <div className={styles.personalInfoWrap}>
          <div className={styles.twoColumnsWrap}>
            <Form.Item label="Надпись на бейдже" name="name" rules={Rules.required}>
              <Input readOnly={denyBadgeEdit} />
            </Form.Item>
            <Form.Item label="Групповой бейдж" name="group_badge">
              <Select
                disabled={!canEditGroupBadge}
                allowClear
                options={groupBadgeOptions}
                onClear={onGroupBadgeClear}
              />
            </Form.Item>
          </div>
          <div className={styles.threeColumnsWrap}>
            <Form.Item label="Имя" name="first_name">
              <Input readOnly={denyBadgeEdit} />
            </Form.Item>
            <Form.Item label="Фамилия" name="last_name">
              <Input readOnly={denyBadgeEdit} />
            </Form.Item>
            <Form.Item label="Позывной" name="nick_name">
              <Input readOnly={denyBadgeEdit} disabled={true} />
            </Form.Item>
          </div>
        </div>
      </div>
      <div className={styles.threeColumnsWrap}>
        <Form.Item
          label="Служба / Локация"
          name="directions"
          rules={allowEmptyDirections ? undefined : Rules.required}
        >
          <Select disabled={!allowRoleEdit && !!person} mode="multiple" {...directionsSelectProps} />
        </Form.Item>
        <Form.Item label="Номер бейджа" name="badge_number" className={styles.badgeInfoPartItem}>
          <Input disabled={denyBadgeEdit} />
        </Form.Item>
        <Form.Item label="Цвет бейджа" name="color_type" className={styles.inputWithEllips} >
          <Select disabled={true} options={colorTypeOptionsWithBadges} />
        </Form.Item>
      </div >
    </>
  );
};
