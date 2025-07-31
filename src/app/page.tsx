'use client';

import { useState, useEffect } from 'react';
import { Sale } from '@/types/notion';

// Component imports
import SalesTable from '@/components/SalesTable';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Dashboard() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sales data function
  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null);

      const salesRes = await fetch('/api/notion/sales');

      if (!salesRes.ok) {
        throw new Error('Failed to fetch sales data');
      }

      const salesData = await salesRes.json();
      setSales(salesData.sales || []);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching sales data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch sales data on component mount
  useEffect(() => {
    fetchSalesData();
  }, []);


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Appointments Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            View and Manage Appointments
          </p>
        </header>

        <main className="mt-6 sm:mt-8">
          <SalesTable sales={sales} />
        </main>
      </div>
    </div>
  );
}
