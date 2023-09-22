import React, { useEffect, useState } from 'react';
import { Button, Form, Grid, Header, Image, Message, Segment } from 'semantic-ui-react';
import { Link, useNavigate } from 'react-router-dom';
import { API, getLogo, showError, showInfo, showSuccess } from '../helpers';
import Turnstile from 'react-turnstile';

const pdtOptions = [
  { key: 'cto', value: 'CTO办公室', text: 'CTO办公室' },
  { key: 'zh', value: '智慧园区', text: '智慧园区' },
  { key: 'doa', value: '数字化办公', text: '数字化办公' },
  { key: 'ph', value: '公有云', text: '公有云' },
  { key: 'hh', value: '混合云', text: '混合云' },
  { key: 'cbu', value: '车BU', text: '车BU' },
  { key: 'abg', value: 'ABG', text: 'ABG' },
];

const RegisterForm = () => {
  const [inputs, setInputs] = useState({
    username: '',
    password: '',
    password2: '',
    email: '',
    verification_code: '',
    pdt: ''
  });
  const { username, password, password2, pdt } = inputs;
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loading, setLoading] = useState(false);
  const logo = getLogo();
  let affCode = new URLSearchParams(window.location.search).get('aff');
  if (affCode) {
    localStorage.setItem('aff', affCode);
  }

  useEffect(() => {
    let status = localStorage.getItem('status');
    if (status) {
      status = JSON.parse(status);
      setShowEmailVerification(status.email_verification);
      if (status.turnstile_check) {
        setTurnstileEnabled(true);
        setTurnstileSiteKey(status.turnstile_site_key);
      }
    }
  });

  let navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    console.log(name, value);
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  }

  function handleSelect(_event, options) {
    const { name, value } = options;
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  }

  async function handleSubmit(e) {

    if (!username) {
      showInfo('请输入用户名！');
      return;
    }
    if (username && !/^[\u4E00-\u9FA5]+$/.test(username)) {
      showInfo('用户名只能用中文！');
      return;
    }

    if (password.length < 8) {
      showInfo('密码长度不得小于 8 位！');
      return;
    }
    if (password !== password2) {
      showInfo('两次输入的密码不一致');
      return;
    }
    if (pdt === '') {
      showInfo('请选择PDT');
      return;
    }
    if (username && password) {
      if (turnstileEnabled && turnstileToken === '') {
        showInfo('请稍后几秒重试，Turnstile 正在检查用户环境！');
        return;
      }
      setLoading(true);
      if (!affCode) {
        affCode = localStorage.getItem('aff');
      }
      inputs.aff_code = affCode;
      const res = await API.post(
        `/api/user/register?turnstile=${turnstileToken}`,
        inputs
      );
      const { success, message } = res.data;
      if (success) {
        navigate('/login');
        showSuccess('注册成功！');
      } else {
        showError(message);
      }
      setLoading(false);
    }
  }

  const sendVerificationCode = async () => {
    if (inputs.email === '') return;
    if (turnstileEnabled && turnstileToken === '') {
      showInfo('请稍后几秒重试，Turnstile 正在检查用户环境！');
      return;
    }
    setLoading(true);
    const res = await API.get(
      `/api/verification?email=${inputs.email}&turnstile=${turnstileToken}`
    );
    const { success, message } = res.data;
    if (success) {
      showSuccess('验证码发送成功，请检查你的邮箱！');
    } else {
      showError(message);
    }
    setLoading(false);
  };

  return (
    <Grid textAlign='center' style={{ marginTop: '48px' }}>
      <Grid.Column style={{ maxWidth: 450 }}>
        <Header as='h2' color='' textAlign='center'>
          <Image src={logo} /> 新用户注册
        </Header>
        <Form size='large'>
          <Segment>
            <Form.Input
              fluid
              icon='user'
              iconPosition='left'
              placeholder='输入用户名，中文，最长 12 位'
              onChange={handleChange}
              name='username'
            />
            <Form.Input
              fluid
              icon='lock'
              iconPosition='left'
              placeholder='输入密码，最短 8 位，最长 20 位'
              onChange={handleChange}
              name='password'
              type='password'
            />
            <Form.Input
              fluid
              icon='lock'
              iconPosition='left'
              placeholder='输入密码，最短 8 位，最长 20 位'
              onChange={handleChange}
              name='password2'
              type='password'
            />
            <Form.Select
              fluid
              placeholder='请选择PDT'
              name='pdt'
              options = { pdtOptions }
              onChange={(e, options) => handleSelect(e, options)}
            />

            {showEmailVerification ? (
              <>
                <Form.Input
                  fluid
                  icon='mail'
                  iconPosition='left'
                  placeholder='输入邮箱地址'
                  onChange={handleChange}
                  name='email'
                  type='email'
                  action={
                    <Button onClick={sendVerificationCode} disabled={loading}>
                      获取验证码
                    </Button>
                  }
                />
                <Form.Input
                  fluid
                  icon='lock'
                  iconPosition='left'
                  placeholder='输入验证码'
                  onChange={handleChange}
                  name='verification_code'
                />
              </>
            ) : (
              <></>
            )}
            {turnstileEnabled ? (
              <Turnstile
                sitekey={turnstileSiteKey}
                onVerify={(token) => {
                  setTurnstileToken(token);
                }}
              />
            ) : (
              <></>
            )}
            <Button
              color='green'
              fluid
              size='large'
              onClick={handleSubmit}
              loading={loading}
            >
              注册
            </Button>
          </Segment>
        </Form>
        <Message>
          已有账户？
          <Link to='/login' className='btn btn-link'>
            点击登录
          </Link>
        </Message>
      </Grid.Column>
    </Grid>
  );
};

export default RegisterForm;
