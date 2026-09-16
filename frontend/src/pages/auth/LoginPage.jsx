import { Icon } from "@/icons/registry";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui-compat/Button";
import { InputText } from "@/components/ui/inputtext";
import { InputPassword as Password } from "@/components/ui-compat/InputPassword";
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card px-4 py-3 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            New business? <Link to="/register" className="text-violet-600 font-medium">Create an account</Link>
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Demo: admin@demo.com &middot; manager@demo.com &middot; cashier@demo.com (password: password123)
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <InputText value={email} onChange={(e) => setEmail(e.target.value)} className="w-full" type="email" autoFocus required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
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
            <Icon className="pi-exclamation-circle" />
            {error}
          </p>
        )}

        <Button type="submit" label="Sign In" className="w-full" loading={loading} />
      </form>
    </AuthLayout>
  );
}
