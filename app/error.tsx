'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-heading font-medium mb-2">Something went wrong</h2>
        <p className="text-gray-500 mb-4">{error.message}</p>
        <button onClick={reset} className="px-4 py-2 bg-primary text-white rounded-full">Try again</button>
      </div>
    </div>
  );
}
