import { LoginPage } from '../../components/LoginPage';

export default function Login() {
  const handleLogin = () => null;
  return <LoginPage onLogin={handleLogin} onBack={() => {}} />;
}
