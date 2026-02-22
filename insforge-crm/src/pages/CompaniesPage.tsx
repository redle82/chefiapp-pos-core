import { useUser } from "@insforge/react";
import { useEffect, useState } from "react";
import {
  Company,
  createCompany,
  fetchCompanies,
  updateCompany,
} from "../services/database";

export default function CompaniesPage() {
  const { user } = useUser();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    website: "",
    phone: "",
  });

  useEffect(() => {
    if (!user) return;
    loadCompanies();
  }, [user]);

  async function loadCompanies() {
    if (!user) return;
    try {
      const { data, error } = await fetchCompanies(user.id);
      if (error) throw error;
      setCompanies(data || []);
    } catch (err) {
      console.error("Failed to load companies:", err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      if (editingId) {
        await updateCompany(editingId, formData);
      } else {
        await createCompany(user.id, formData);
      }
      await loadCompanies();
      setFormData({ name: "", industry: "", website: "", phone: "" });
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      console.error("Failed to save company:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(company: Company) {
    setFormData({
      name: company.name,
      industry: company.industry || "",
      website: company.website || "",
      phone: company.phone || "",
    });
    setEditingId(company.id);
    setShowForm(true);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Companies</h2>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ name: "", industry: "", website: "", phone: "" });
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "Add Company"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded shadow mb-6"
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Company name *"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="Industry"
              value={formData.industry}
              onChange={(e) =>
                setFormData({ ...formData, industry: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded"
            />
            <input
              type="url"
              placeholder="Website"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : editingId ? "Update" : "Create"}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => (
          <div key={company.id} className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold text-gray-800 text-lg">
              {company.name}
            </h3>
            {company.industry && (
              <p className="text-sm text-gray-600">{company.industry}</p>
            )}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener"
                className="text-sm text-blue-600 hover:underline"
              >
                {company.website}
              </a>
            )}
            {company.phone && (
              <p className="text-sm text-gray-600">{company.phone}</p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleEdit(company)}
                className="text-sm px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
