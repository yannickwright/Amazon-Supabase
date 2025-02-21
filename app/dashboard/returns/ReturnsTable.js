"use client";

import { useState } from "react";

export default function ReturnsTable({ returns }) {
  const itemsPerPage = 15;
  const [currentPage, setCurrentPage] = useState(1);

  // Group returns by ASIN
  const groupedReturns = returns.reduce((acc, item) => {
    const existingItem = acc.find((i) => i.asin === item.asin);
    if (existingItem) {
      existingItem.quantity_returned += item.quantity_returned;
      existingItem.refund_amount += parseFloat(item.refund_amount) || 0;
    } else {
      acc.push({
        id: item.id,
        asin: item.asin,
        quantity_returned: item.quantity_returned,
        refund_amount: parseFloat(item.refund_amount) || 0,
      });
    }
    return acc;
  }, []);

  // Sort by quantity (highest first)
  const sortedReturns = groupedReturns.sort(
    (a, b) => b.quantity_returned - a.quantity_returned
  );

  // Calculate pagination
  const totalPages = Math.ceil(sortedReturns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReturns = sortedReturns.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="bg-white border-2 border-base-300 rounded-2xl shadow-[0_0_15px_2px_rgba(0,0,0,0.1)]">
      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>ASIN</th>
              <th>Total Returns</th>
              <th>Total Refund</th>
            </tr>
          </thead>
          <tbody>
            {paginatedReturns.map((returnItem) => (
              <tr key={returnItem.id}>
                <td>{returnItem.asin}</td>
                <td>{returnItem.quantity_returned}</td>
                <td>£{returnItem.refund_amount.toFixed(2)}</td>
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
