import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select,
  message 
} from 'antd';
import { 
  UserOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined 
} from '@ant-design/icons';
import { getAllUsers, createUser, updateUser, deleteUser, UserProfile } from '../../services/userService';
import './UserManagement.css';

const { Option } = Select;

type User = UserProfile;

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const userList = await getAllUsers();
      setUsers(userList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to fetch users');
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditMode(false);
    setCurrentUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditUser = (user: User) => {
    setEditMode(true);
    setCurrentUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      role: user.role
    });
    setModalVisible(true);
  };

  const handleDeleteUser = async (userId: number | string) => {
    try {
      setLoading(true);
      const result = await deleteUser(userId);
      if (result.success) {
        setUsers(users.filter(user => user.id !== userId));
        message.success(result.message || 'User deleted successfully');
      } else {
        message.error(result.message || 'Failed to delete user');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error('Failed to delete user');
      setLoading(false);
    }
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      if (editMode && currentUser) {
        // Update existing user
        const updatedUser = await updateUser(currentUser.id, values);
        setUsers(users.map(user => 
          user.id === currentUser.id ? updatedUser : user
        ));
        message.success('User updated successfully');
        setModalVisible(false);
      } else {
        // Create new user
        const newUser = await createUser(values);
        setUsers([...users, newUser]);
        message.success('User created successfully');
        setModalVisible(false);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error saving user:', error);
      message.error('Failed to save user');
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        let color = '';
        if (role === 'admin') color = '#f50';
        else if (role === 'kb_manager') color = '#108ee9';
        else color = '#87d068';
        
        return <span style={{ color }}>{role}</span>;
      }
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => date ? new Date(date).toLocaleString() : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEditUser(record)}
          >
            Edit
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDeleteUser(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="user-management-container">
      <Card 
        title="User Management" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddUser}
          >
            Add User
          </Button>
        }
      >
        <Table 
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title={editMode ? "Edit User" : "Add User"}
        open={modalVisible}
        onOk={handleFormSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please enter a username' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter an email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="Email" />
          </Form.Item>
          {!editMode && (
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter a password' }]}
            >
              <Input.Password placeholder="Password" />
            </Form.Item>
          )}
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select placeholder="Select a role">
              <Option value="admin">Admin</Option>
              <Option value="kb_manager">Knowledge Base Manager</Option>
              <Option value="user">User</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement; 