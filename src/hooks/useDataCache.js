import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for data fetching with intelligent caching
 * Prevents loading indicator from showing when data is already cached
 * @param {Function} fetchFunction - Async function to fetch data
 * @param {Array} dependencies - Dependencies array like useEffect
 * @param {number} cacheTime - Cache duration in ms (default: 5 minutes)
 * @returns {Object} { data, isLoading, error, refetch }
 */
export const useDataCache = (fetchFunction, dependencies = [], cacheTime = 5 * 60 * 1000) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const cacheRef = useRef({
    data: null,
    timestamp: null,
    isValid: false
  });

  const isCacheValid = () => {
    if (!cacheRef.current.isValid) return false;
    const age = Date.now() - cacheRef.current.timestamp;
    return age < cacheTime;
  };

  const fetchData = async () => {
    try {
      // If cache is valid, use it without showing loading
      if (isCacheValid()) {
        setData(cacheRef.current.data);
        setIsLoading(false);
        return;
      }

      // Show loading only if no cached data exists
      if (!cacheRef.current.data) {
        setIsLoading(true);
      }

      const result = await fetchFunction();
      
      // Update cache
      cacheRef.current.data = result;
      cacheRef.current.timestamp = Date.now();
      cacheRef.current.isValid = true;

      setData(result);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load data');
      // Keep old data if fetch fails
      if (!cacheRef.current.data) {
        setData(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  const refetch = async () => {
    // Invalidate cache and refetch
    cacheRef.current.isValid = false;
    await fetchData();
  };

  return { data, isLoading, error, refetch };
};

export default useDataCache;
