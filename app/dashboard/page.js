import ButtonAccount from "@/components/ButtonAccount";

export const dynamic = "force-dynamic";

// This is a private page: It's protected by the layout.js component which ensures the user is authenticated.
// It's a server compoment which means you can fetch data (like the user profile) before the page is rendered.
// See https://shipfa.st/docs/tutorials/private-page
export default async function Dashboard() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="text-base-content/70">Total Returns</div>
            <div className="text-2xl font-bold">2,221</div>
            <div className="text-success text-sm">↑ 12%</div>
          </div>
        </div>
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="text-base-content/70">Active Shipments</div>
            <div className="text-2xl font-bold">14</div>
            <div className="text-error text-sm">↓ 2%</div>
          </div>
        </div>
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="text-base-content/70">Total Fees</div>
            <div className="text-2xl font-bold">£1,423</div>
            <div className="text-success text-sm">↑ 8%</div>
          </div>
        </div>
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="text-base-content/70">FBA Items</div>
            <div className="text-2xl font-bold">78%</div>
            <div className="text-error text-sm">↓ 5%</div>
          </div>
        </div>
      </div>
    </>
  );
}
