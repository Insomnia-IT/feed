import { Form, Input, Select, Image, Button, Popconfirm } from 'antd';
import { useState } from 'react';

import { Rules } from 'components/form';
import HorseIcon from 'assets/icons/horse-icon';

import styles from '../../common.module.css';
import useCanAccess from '../../use-can-access';
// import type { AccessRoleEntity, DirectionEntity, IPerson, VolunteerRoleEntity } from 'interfaces';
import type { DirectionEntity, IPerson } from 'interfaces';
import { useSelect } from '@refinedev/antd';
import { DeleteOutlined } from '@ant-design/icons';

export const VolInfoSection = ({
  isBlocked,
  denyBadgeEdit,
  // denyFeedTypeEdit,
  // feedTypeOptions,
  // kitchenOptions,
  // genderOptions,
  canEditGroupBadge,
  colorTypeOptions,
  groupBadgeOptions,
  // handleQRChange,
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

  // const volPhoto = form.getFieldValue('photo');
  const volPhoto = 'https://sun1-85.userapi.com/s/v1/ig2/ortGZiVTcUqsOrQYxnjLm7MGA6ZRTLMDTs57g0ObQR7Tcg7Sn58SSkLevJyPNMfK5MCpbdJV33SLQd8IgEbPJv_o.jpg?quality=95&crop=428,36,1544,1544&as=32x32,48x48,72x72,108x108,160x160,240x240,360x360,480x480,540x540,640x640,720x720,1080x1080,1280x1280,1440x1440&ava=1&cs=400x400';

  const deletePhoto = () => {
    setTimeout(() => {
      form.setFieldsValue({ photo: '' });
      setImageError(false);
      console.log('Фото удалено');
    });
  };

  return (
    <>
      <div className={styles.formSection__title}>
        Волонтер
        {isBlocked && (
          <div className={styles.bannedWrap}>
            <span className={styles.bannedDescr}>Забанен</span>
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
            <Form.Item label="Позывной" name="nick_name">
              <Input readOnly={denyBadgeEdit} />
            </Form.Item>
            <Form.Item label="Имя" name="first_name">
              <Input readOnly={denyBadgeEdit} />
            </Form.Item>
            <Form.Item label="Фамилия" name="last_name">
              <Input readOnly={denyBadgeEdit} />
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
        <Form.Item label="Цвет бейджа" name="color_type">
          <Select disabled={true} options={colorTypeOptions} />
        </Form.Item>
      </div >

{/* 




      ===
      <div className={styles.formSection__title}>
        Волонтер
        {isBlocked && (
          <div className={styles.bannedWrap}>
            <span className={styles.bannedDescr}>Забанен</span>
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
          <div className={styles.nickNameFirstNameLastNameWrap}>
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
          <div className={styles.nickNameFirstNameLastNameWrap}>
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
      </div> */}
    </>
  );
};
