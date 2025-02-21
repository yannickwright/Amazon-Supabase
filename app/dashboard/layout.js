import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import config from "@/config";
import ButtonAccount from "@/components/ButtonAccount";
import Link from "next/link";

// This is a server-side component to ensure the user is logged in.
// If not, it will redirect to the login page.
// It's applied to all subpages of /dashboard in /app/dashboard/*** pages
// You can also add custom static UI elements like a Navbar, Sidebar, Footer, etc..
// See https://shipfa.st/docs/tutorials/private-page
export default async function LayoutPrivate({ children }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(config.auth.loginUrl);
  }

  return (
    <div className="flex h-screen bg-base-100">
      {/* Sidebar */}
      <div className="w-64 bg-base-200 border-r border-base-300">
        <div className="p-4">
          <h1 className="text-xl font-bold flex items-center gap-2 text-base-content">
            <span className="text-primary">📦</span> FBA Tools
          </h1>
        </div>

        <nav className="mt-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 text-base-content hover:bg-base-300"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/returns"
            className="flex items-center gap-3 px-4 py-3 text-base-content hover:bg-base-300"
          >
            Returns
          </Link>
          <Link
            href="/dashboard/shipments"
            className="flex items-center gap-3 px-4 py-3 text-base-content hover:bg-base-300"
          >
            Shipments
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-4 py-3 text-base-content hover:bg-base-300"
          >
            Settings
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-base-100">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-end mb-8">
            <ButtonAccount />
          </div>

          {/* Page Content */}
          {children}
        </div>
      </div>
    </div>
  );
}
