import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { useAuth } from "../../context/AuthContext";
import { apiErrorMessage } from "../../services/api";
import AuthLayout from "../../layouts/AuthLayout";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Invalid email or password"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage your stores"
      footer={
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-center">
          <p className="text-sm text-gray-500">
            New business? <Link to="/register" className="text-blue-600 font-medium">Create an account</Link>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Demo: admin@demo.com &middot; manager@demo.com &middot; cashier@demo.com (password: password123)
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <InputText value={email} onChange={(e) => setEmail(e.target.value)} className="w-full" type="email" autoFocus required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <Password
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            feedback={false}
            toggleMask
            className="w-full"
            inputClassName="w-full"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex items-center gap-2">
            <i className="pi pi-exclamation-circle" />
            {error}
          </p>
        )}

        <Button type="submit" label="Sign In" className="w-full" loading={loading} />
      </form>
    </AuthLayout>
  );
}
