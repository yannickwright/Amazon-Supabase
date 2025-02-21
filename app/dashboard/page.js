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
        <div className="card bg-white w-full max-w-[1200px] mx-auto border-2 border-base-300 rounded-2xl shadow-[0_0_15px_2px_rgba(0,0,0,0.1)]">
          <div className="card-body">
            <div className="text-gray-600">Total Returns</div>
            <div className="text-2xl font-bold">2,221</div>
            <div className="text-green-500 text-sm">↑ 12%</div>
          </div>
        </div>
        <div className="card bg-white w-full max-w-[1200px] mx-auto border-2 border-base-300 rounded-2xl shadow-[0_0_15px_2px_rgba(0,0,0,0.1)]">
          <div className="card-body">
            <div className="text-gray-600">Active Shipments</div>
            <div className="text-2xl font-bold">14</div>
            <div className="text-red-500 text-sm">↓ 2%</div>
          </div>
        </div>
        <div className="card bg-white w-full max-w-[1200px] mx-auto border-2 border-base-300 rounded-2xl shadow-[0_0_15px_2px_rgba(0,0,0,0.1)]">
          <div className="card-body">
            <div className="text-gray-600">Total Fees</div>
            <div className="text-2xl font-bold">£1,423</div>
            <div className="text-green-500 text-sm">↑ 8%</div>
          </div>
        </div>
        <div className="card bg-white w-full max-w-[1200px] mx-auto border-2 border-base-300 rounded-2xl shadow-[0_0_15px_2px_rgba(0,0,0,0.1)]">
          <div className="card-body">
            <div className="text-gray-600">FBA Items</div>
            <div className="text-2xl font-bold">78%</div>
            <div className="text-red-500 text-sm">↓ 5%</div>
          </div>
        </div>
      </div>
    </>
  );
}
