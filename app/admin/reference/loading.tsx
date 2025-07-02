export default function AdminReferenceLoading() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Reference Skeleton */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl p-6">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="h-16 w-full bg-gray-100 dark:bg-gray-900 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Documentation Skeleton */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl p-8">
            <div className="space-y-4">
              <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>

              <div className="h-6 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-8"></div>
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>

              <div className="h-32 w-full bg-gray-100 dark:bg-gray-900 rounded animate-pulse mt-4"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
