// client/src/reportWebVitals.js

/**
 * Measures and reports core web vitals performance metrics.
 * This function is typically called from index.js.
 * @param {Function} [onPerfEntry] - A callback function to be invoked when a web vital metric is measured.
 *                                   The function will receive the metric object as its argument.
 *                                   Example: reportWebVitals(console.log)
 */
const reportWebVitals = onPerfEntry => {
  // Check if onPerfEntry is provided and is actually a function
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Dynamically import the 'web-vitals' library.
    // This avoids including the library in the main bundle if performance reporting isn't used.
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // Call the specific functions from the library to measure each metric.
      // Each function will call the provided onPerfEntry callback with the metric data.
      getCLS(onPerfEntry); // Cumulative Layout Shift
      getFID(onPerfEntry); // First Input Delay
      getFCP(onPerfEntry); // First Contentful Paint
      getLCP(onPerfEntry); // Largest Contentful Paint
      getTTFB(onPerfEntry); // Time to First Byte
    });
  }
};

export default reportWebVitals;
