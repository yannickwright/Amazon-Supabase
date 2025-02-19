import ButtonAccount from "@/components/ButtonAccount";

export const dynamic = "force-dynamic";

// This is a private page: It's protected by the layout.js component which ensures the user is authenticated.
// It's a server compoment which means you can fetch data (like the user profile) before the page is rendered.
// See https://shipfa.st/docs/tutorials/private-page
export default async function Dashboard() {
  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-xl mx-auto space-y-8">
        <ButtonAccount />
        <h1 className="text-3xl md:text-4xl font-extrabold">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/dashboard/returns"
            className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
          >
            <div className="card-body">
              <h2 className="card-title">Returns Analysis</h2>
              <p className="text-base-content/70">
                View Amazon Customer Returns Data
              </p>
            </div>
          </a>

          <a
            href="/dashboard/shipments"
            className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
          >
            <div className="card-body">
              <h2 className="card-title">Shipments</h2>
              <p className="text-base-content/70">
                View FBA Inbound Shipment Data
              </p>
            </div>
          </a>

          <a
            href="/dashboard/settings"
            className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
          >
            <div className="card-body">
              <h2 className="card-title">Settings</h2>
              <p className="text-base-content/70">Manage your data sources</p>
            </div>
          </a>
          {/* Add more dashboard cards here as needed */}
        </div>
      </section>
    </main>
  );
}
