import { Icon } from "@/icons/registry";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui-compat/Button";
import { InputText } from "@/components/ui/inputtext";
import { InputPassword as Password } from "@/components/ui-compat/InputPassword";
import { useAuth } from "../../context/AuthContext";
import { apiErrorMessage } from "../../services/api";
import AuthLayout from "../../layouts/AuthLayout";

export default function RegisterOrgPage() {
  const { registerOrganization } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ organizationName: "", adminName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerOrganization(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create your account"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your business"
      subtitle="Set up your organization and admin account"
      footer={
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card px-4 py-3 text-center">
          <p className="text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-violet-600 font-medium">Sign in</Link>
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
          <InputText value={form.organizationName} onChange={(e) => update("organizationName", e.target.value)} className="w-full" autoFocus required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
          <InputText value={form.adminName} onChange={(e) => update("adminName", e.target.value)} className="w-full" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <InputText type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <Password
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
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

        <Button type="submit" label="Create Account" className="w-full" loading={loading} />
      </form>
    </AuthLayout>
  );
}
