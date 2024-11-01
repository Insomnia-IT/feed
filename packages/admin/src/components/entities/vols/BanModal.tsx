import { Modal, Form, Input, Button, Row, Col } from '@pankod/refine-antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface IProps {
    isBlocked: boolean;
    visible: boolean;
    onCancel: () => void;
    onSubmit: (reason: string) => void;
}

const BanModal: React.FC<IProps> = ({ isBlocked, visible, onCancel, onSubmit }) => {
    const [form] = Form.useForm();

    const handleFinish = () => {
        form.validateFields().then((values) => {
            onSubmit(values.reason);
            form.resetFields();
        });
    };

    return (
        <Modal
            title={
                <Row align='middle' gutter={8}>
                    <Col>
                        <ExclamationCircleOutlined style={{ fontSize: 24, color: 'orange' }} />
                    </Col>
                    <Col>{isBlocked ? 'Разблокировка Волонтера' : 'Блокировка Волонтера'}</Col>
                </Row>
            }
            closable={true}
            footer={null}
            centered
            open={visible}
            cancelText={`${isBlocked ? 'Разблокировать волонтера' : 'Заблокировать Волонтера'}`}
            okText={'Оставить'}
            onOk={handleFinish}
            onCancel={onCancel}
        >
            <p>
                {isBlocked
                    ? `Бейдж Волонтера активируется: Волонтер сможет питаться на кухнях и получит доступ ко всем плюшкам. Волонтера можно будет заблокировать`
                    : `Бейдж Волонтера деактивируется: Волонтер не сможет питаться на кухнях и потеряет доступ ко всем плюшкам. Волонтера можно будет разблокировать`}
            </p>
            <Form form={form} name='form-block' onFinish={handleFinish} layout='vertical'>
                <Form.Item
                    label={`${isBlocked ? 'Причина разблокировки' : 'Причина блокировки'}`}
                    name='reason'
                    rules={[
                        {
                            required: true,
                            message: isBlocked ? 'Укажите причину разблокировки' : 'Укажите причину блокировки',
                            min: 3
                        }
                    ]}
                >
                    <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} />
                </Form.Item>
                <div style={{ textAlign: 'right' }}>
                    <Button type={isBlocked ? 'primary' : 'default'} danger={!isBlocked} htmlType='submit'>
                        {isBlocked ? 'Разблокировать волонтера' : 'Заблокировать Волонтера'}
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default BanModal;
