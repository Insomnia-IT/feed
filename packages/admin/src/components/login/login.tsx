import { Button, Card, Checkbox, Col, Form, Input, Layout, Row, Segmented, Typography } from 'antd';
import { useLogin } from '@pankod/refine-core';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';

import logo from '../../assets/images/logo.svg';

import {
    authContainerStyles,
    containerStyles,
    imageContainer,
    layoutStyles,
    loginFormStyles,
    qrFormStyles,
    titleStyles
} from './styles';

const { Title } = Typography;
export interface ILoginForm {
    username: string;
    password: string;
    remember: boolean;
    isQR: boolean;
}

const rowStyle = {
    height: '100dvh'
};

type OptionValue = 'qr' | 'login';

export const LoginPage: FC = () => {
    const [form] = Form.useForm<ILoginForm>();
    const [selectedOption, setSelectedOption] = useState<OptionValue>('qr');

    const { isLoading, mutate: login } = useLogin<ILoginForm>();
    const scanner = useRef<QrScanner | null>(null);
    const video = useRef<HTMLVideoElement | null>(null);

    const loadingRef = useRef(false);

    const onScan = useCallback((qr: string) => {
        if (loadingRef.current) {
            return;
        }

        loadingRef.current = true;
        login({
            username: qr,
            password: '',
            isQR: true,
            remember: false
        });

        setTimeout(() => {
            loadingRef.current = false;
        }, 1000);
    }, []);

    useEffect(() => {
        if (selectedOption !== 'qr' || !video.current) return;

        const s = new QrScanner(
            video.current,
            ({ data }) => {
                void onScan(data.replace(/[^A-Za-z0-9]/g, ''));
            },
            {
                onDecodeError: () => {
                    // no handle
                },
                highlightScanRegion: true,
                highlightCodeOutline: true
            }
        );

        scanner.current = s;

        void s.start();

        return () => {
            s.destroy();
        };
    }, [onScan, selectedOption]);

    const onVideoReady = (ref: HTMLVideoElement) => {
        video.current = ref;
    };

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        function onHardwareScan({ detail: { scanCode } }): void {
            void onScan(scanCode.replace(/[^A-Za-z0-9]/g, ''));
        }

        document.addEventListener('scan', onHardwareScan);

        return (): void => {
            document.removeEventListener('scan', onHardwareScan);
        };
    }, [onScan]);

    const loginForm = (
        <div style={loginFormStyles}>
            <Card>
                <Form<ILoginForm>
                    layout="vertical"
                    form={form}
                    onFinish={(values) => login(values)}
                    requiredMark={false}
                    initialValues={{ remember: false }}
                >
                    <Form.Item
                        name="username"
                        rules={[
                            {
                                required: true,
                                message: 'Пожалуйста, введите логин'
                            }
                        ]}
                    >
                        <Input size="large" placeholder="Логин" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: 'Пожалуйста, введите пароль'
                            }
                        ]}
                    >
                        <Input type="password" placeholder="Пароль" size="large" />
                    </Form.Item>
                    <div style={{ marginBottom: '28px' }}>
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                            <Checkbox style={{ fontSize: '14px' }}>Запомнить меня</Checkbox>
                        </Form.Item>
                    </div>
                    <Button type="primary" size="large" htmlType="submit" loading={isLoading} block>
                        Войти
                    </Button>
                </Form>
            </Card>
        </div>
    );

    const qrForm = (
        <div style={authContainerStyles}>
            <video ref={onVideoReady} style={qrFormStyles} />
        </div>
    );

    function renderOptionLabel(text: string) {
        return (
            <div style={{ padding: 6 }}>
                <div>{text}</div>
            </div>
        );
    }

    return (
        <Layout style={layoutStyles}>
            <Row justify="center" align="middle" style={rowStyle}>
                <Col xs={22} style={containerStyles}>
                    <div style={imageContainer}>
                        <img src={logo} alt="Логотип фестиваля" style={{ height: '44px' }} />
                        <Title level={4} style={titleStyles}>
                            Вход в Кормитель
                        </Title>
                    </div>

                    {selectedOption === 'qr' ? qrForm : loginForm}

                    <Segmented
                        options={[
                            {
                                label: renderOptionLabel('Сканировать QR-код'),
                                value: 'qr'
                            },
                            {
                                label: renderOptionLabel('Логин и пароль'),
                                value: 'login'
                            }
                        ]}
                        block
                        onChange={(value) => setSelectedOption(value as OptionValue)}
                        style={{ marginTop: '14px' }}
                    />
                </Col>
            </Row>
        </Layout>
    );
};
