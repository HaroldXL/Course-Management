import { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import "./Login.css";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const response = await authService.login(
        values.keyLogin,
        values.password
      );

      if (response.isSuccess) {
        message.success(response.message || "Đăng nhập thành công!");
        navigate("/management");
      } else {
        message.error(response.message || "Đăng nhập thất bại!");
      }
    } catch (error) {
      console.error("Login error:", error);
      message.error("Có lỗi xảy ra khi đăng nhập!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Đăng nhập</h1>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={handleLogin}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            name="keyLogin"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập email hoặc tên đăng nhập!",
              },
            ]}
          >
            <Input
              variant="filled"
              prefix={<UserOutlined />}
              placeholder="Email hoặc tên đăng nhập"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập mật khẩu!",
              },
            ]}
          >
            <Input.Password
              variant="filled"
              prefix={<LockOutlined />}
              placeholder="Mật khẩu"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
              style={{
                backgroundColor: "#1890ff",
                borderRadius: "8px",
                height: "45px",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              Đăng nhập
            </Button>
          </Form.Item>

          <div className="login-footer">
            <span>Chưa có tài khoản? </span>
            <a onClick={() => navigate("/register")}>Đăng ký ngay</a>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;
