import ButtonAccount from "@/components/ButtonAccount";
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic";

// This is a private page: It's protected by the layout.js component which ensures the user is authenticated.
// It's a server compoment which means you can fetch data (like the user profile) before the page is rendered.
// See https://shipfa.st/docs/tutorials/private-page
export default async function Dashboard() {
  const supabase = createClient();

  // Get total of unit_price using count to determine pagination
  const { count: totalCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .not("unit_price", "is", null);

  let allPrices = [];
  const pageSize = 1000;
  let page = 0;

  while (page * pageSize < totalCount) {
    const { data: prices } = await supabase
      .from("orders")
      .select("unit_price")
      .not("unit_price", "is", null)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (prices?.length) allPrices = [...allPrices, ...prices];
    page++;
  }

  const totalValue =
    allPrices.reduce(
      (sum, order) => sum + (parseFloat(order.unit_price) || 0),
      0
    ) || 0;

  // Get total quantity ordered with pagination
  let allQuantities = [];
  page = 0;

  while (page * pageSize < totalCount) {
    const { data: quantities } = await supabase
      .from("orders")
      .select("quantity_ordered")
      .not("quantity_ordered", "is", null)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (quantities?.length) allQuantities = [...allQuantities, ...quantities];
    page++;
  }

  const totalOrdered =
    allQuantities.reduce(
      (sum, order) => sum + (parseInt(order.quantity_ordered) || 0),
      0
    ) || 0;

  return (
    <>
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
      {/* Stats Overview */}
      <div className="bg-white border-2 border-base-300 rounded-2xl shadow-[0_0_15px_2px_rgba(0,0,0,0.1)] w-full max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-base-300">
          <div className="p-6">
            <div className="text-gray-600">Total Order Value</div>
            <div className="text-2xl font-bold">
              £
              {totalValue.toLocaleString("en-GB", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="text-green-500 text-sm">↑ 12%</div>
          </div>
          <div className="p-6">
            <div className="text-gray-600">Total Units Ordered</div>
            <div className="text-2xl font-bold">
              {totalOrdered.toLocaleString()}
            </div>
            <div className="text-red-500 text-sm">↓ 2%</div>
          </div>
          <div className="p-6">
            <div className="text-gray-600">Total Fees</div>
            <div className="text-2xl font-bold">£1,423</div>
            <div className="text-green-500 text-sm">↑ 8%</div>
          </div>
          <div className="p-6">
            <div className="text-gray-600">FBA Items</div>
            <div className="text-2xl font-bold">78%</div>
            <div className="text-red-500 text-sm">↓ 5%</div>
          </div>
        </div>
      </div>
    </>
  );
}
