import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@insforge/react";
import { useState } from "react";
import "./App.css";
import CompaniesPage from "./pages/CompaniesPage";
import ContactsPage from "./pages/ContactsPage";
import DealsPage from "./pages/DealsPage";

type Page = "contacts" | "companies" | "deals";

function App() {
  const { user, isLoaded } = useUser();
  const [currentPage, setCurrentPage] = useState<Page>("deals");

  if (!isLoaded)
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <SignedOut>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-6">CRM Platform</h1>
            <SignInButton>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex gap-6">
              <h1 className="text-2xl font-bold text-gray-800">CRM</h1>
              <button
                onClick={() => setCurrentPage("deals")}
                className={`px-4 py-2 rounded ${
                  currentPage === "deals"
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Deals
              </button>
              <button
                onClick={() => setCurrentPage("contacts")}
                className={`px-4 py-2 rounded ${
                  currentPage === "contacts"
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Contacts
              </button>
              <button
                onClick={() => setCurrentPage("companies")}
                className={`px-4 py-2 rounded ${
                  currentPage === "companies"
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Companies
              </button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <UserButton />
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {currentPage === "deals" && <DealsPage />}
          {currentPage === "contacts" && <ContactsPage />}
          {currentPage === "companies" && <CompaniesPage />}
        </main>
      </SignedIn>
    </div>
  );
}

export default App;
