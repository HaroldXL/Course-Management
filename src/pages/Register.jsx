import { useState } from "react";
import { Form, Input, Button, message, Select } from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import "./Register.css";

const Register = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      const response = await authService.register(
        values.fullName,
        values.email,
        values.phoneNumber,
        values.password,
        values.role
      );

      if (response.isSuccess) {
        message.success(response.message || "Đăng ký thành công!");
        navigate("/login");
      } else {
        message.error(response.message || "Đăng ký thất bại!");
      }
    } catch (error) {
      console.error("Register error:", error);
      message.error("Có lỗi xảy ra khi đăng ký!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <div className="register-header">
          <h1>Đăng ký</h1>
          <p>Tạo tài khoản mới</p>
        </div>

        <Form
          form={form}
          name="register"
          onFinish={handleRegister}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            name="fullName"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập họ và tên!",
              },
            ]}
          >
            <Input
              variant="filled"
              prefix={<UserOutlined />}
              placeholder="Họ và tên"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập email!",
              },
              {
                type: "email",
                message: "Email không hợp lệ!",
              },
            ]}
          >
            <Input
              variant="filled"
              prefix={<MailOutlined />}
              placeholder="Email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="phoneNumber"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập số điện thoại!",
              },
            ]}
          >
            <Input
              variant="filled"
              prefix={<PhoneOutlined />}
              placeholder="Số điện thoại"
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
              {
                min: 6,
                message: "Mật khẩu phải có ít nhất 6 ký tự!",
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

          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              {
                required: true,
                message: "Vui lòng xác nhận mật khẩu!",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Mật khẩu không khớp!"));
                },
              }),
            ]}
          >
            <Input.Password
              variant="filled"
              prefix={<LockOutlined />}
              placeholder="Xác nhận mật khẩu"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="Vai trò"
            initialValue={0}
            rules={[
              {
                required: true,
                message: "Vui lòng chọn vai trò!",
              },
            ]}
          >
            <Select
              variant="filled"
              size="large"
              placeholder="Chọn vai trò"
              options={[
                { label: "Admin", value: 0 },
                { label: "Manager", value: 1 },
                { label: "Moderator", value: 2 },
                { label: "Examiner", value: 3 },
              ]}
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
              Đăng ký
            </Button>
          </Form.Item>

          <div className="register-footer">
            <span>Đã có tài khoản? </span>
            <a onClick={() => navigate("/login")}>Đăng nhập</a>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Register;
