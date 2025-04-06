import { Form, Input, Select, Checkbox, Divider } from 'antd';

import { Rules } from 'components/form';

import styles from '../../common.module.css';

export const PersonalInfoSection = ({
  denyBadgeEdit,
  denyFeedTypeEdit,
  feedTypeOptions,
  kitchenOptions,
  genderOptions,
  handleQRChange
}: {
  denyBadgeEdit: boolean;
  denyFeedTypeEdit: boolean;
  feedTypeOptions: { label: string; value: string | number }[];

  kitchenOptions: { label: string; value: string | number }[];
  genderOptions: { label: string; value: string | number }[];
  handleQRChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {

  return (
    <>
      <p className={styles.formSection__title}>Личная информация</p>

      <div className={styles.twoEqualColumnsWrap}>
        <Form.Item label="Кухня" name="kitchen" rules={Rules.required}>
          <Select options={kitchenOptions} />
        </Form.Item>
        <Form.Item label="Тип питания" name="feed_type" rules={Rules.required}>
          <Select disabled={denyFeedTypeEdit} options={feedTypeOptions} />
        </Form.Item>
      </div>

      <div className={styles.threeColumnsWrap}>
        <Form.Item label="Телефон" name="phone">
          <Input type="phone" />
        </Form.Item>
        <Form.Item label="Telegram" name={['person', 'telegram']}>
          <Input disabled={true} />
        </Form.Item>
        <Form.Item label="Пол волонтера" name="gender">
          <Select disabled={denyBadgeEdit} options={genderOptions} />
        </Form.Item>
      </div>
      <div className={styles.twoColumnsStartWrap}>
        <Form.Item name="is_vegan" valuePropName="checked">
          <Checkbox>Веган</Checkbox>
        </Form.Item>
        <Form.Item name="is_child" valuePropName="checked">
          <Checkbox>Это ребенок</Checkbox>
        </Form.Item>
      </div>

      <Divider style={{ marginTop: '0px' }} />

      <div className={styles.badgeInfo}>
        <Form.Item label="QR бейджа" name="qr" rules={Rules.required}>
          <Input disabled={denyBadgeEdit} onChange={handleQRChange} />
        </Form.Item>
        <Form.Item name="is_badged_leader" valuePropName="checked">
          <Checkbox>Бейдж у Руководителя</Checkbox>
        </Form.Item>
      </div>

    </>
  );
};
