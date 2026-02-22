import { useUser } from "@insforge/react";
import { useEffect, useState } from "react";
import {
  Contact,
  createContact,
  deleteContact,
  fetchContacts,
  updateContact,
} from "../services/database";

export default function ContactsPage() {
  const { user } = useUser();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    tags: [] as string[],
  });

  useEffect(() => {
    if (!user) return;
    loadContacts();
  }, [user, search]);

  async function loadContacts() {
    if (!user) return;
    try {
      const { data, error } = await fetchContacts(user.id, search);
      if (error) throw error;
      setContacts(data || []);
    } catch (err) {
      console.error("Failed to load contacts:", err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      if (editingId) {
        await updateContact(editingId, formData);
      } else {
        await createContact(user.id, formData);
      }
      await loadContacts();
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        tags: [],
      });
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      console.error("Failed to save contact:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this contact?")) return;
    try {
      await deleteContact(id);
      await loadContacts();
    } catch (err) {
      console.error("Failed to delete contact:", err);
    }
  }

  function handleEdit(contact: Contact) {
    setFormData({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || "",
      phone: contact.phone || "",
      tags: contact.tags || [],
    });
    setEditingId(contact.id);
    setShowForm(true);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Contacts</h2>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              first_name: "",
              last_name: "",
              email: "",
              phone: "",
              tags: [],
            });
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "Add Contact"}
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded"
        />
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded shadow mb-6"
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="First name *"
              required
              value={formData.first_name}
              onChange={(e) =>
                setFormData({ ...formData, first_name: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="Last name *"
              required
              value={formData.last_name}
              onChange={(e) =>
                setFormData({ ...formData, last_name: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
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
        {contacts.map((contact) => (
          <div key={contact.id} className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold text-gray-800">
              {contact.first_name} {contact.last_name}
            </h3>
            {contact.email && (
              <p className="text-sm text-gray-600">{contact.email}</p>
            )}
            {contact.phone && (
              <p className="text-sm text-gray-600">{contact.phone}</p>
            )}
            {contact.tags?.length > 0 && (
              <div className="mt-2 flex gap-1 flex-wrap">
                {contact.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleEdit(contact)}
                className="text-sm px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(contact.id)}
                className="text-sm px-2 py-1 text-red-600 hover:bg-red-50 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
