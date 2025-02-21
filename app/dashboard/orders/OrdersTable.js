"use client";

import { useState } from "react";

export default function OrdersTable({ orders }) {
  const itemsPerPage = 15;
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = orders.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white border-2 border-base-300 rounded-2xl shadow-[0_0_15px_2px_rgba(0,0,0,0.1)]">
      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>SKU</th>
              <th>ASIN</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
              <th>Status</th>
              <th>Order Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.order_id}</td>
                <td>{order.sku}</td>
                <td>{order.asin}</td>
                <td>{order.quantity_ordered}</td>
                <td>£{parseFloat(order.unit_price).toFixed(2)}</td>
                <td>
                  £
                  {(
                    parseFloat(order.unit_price) *
                    parseInt(order.quantity_ordered)
                  ).toFixed(2)}
                </td>
                <td>{order.order_status}</td>
                <td>
                  {new Date(order.created_at).toLocaleDateString("en-GB")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center gap-2 p-4">
        <button
          className="btn btn-sm"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className="flex items-center gap-1">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="btn btn-sm"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
