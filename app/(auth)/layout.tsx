export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-0 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 text-white font-bold text-xl mb-4">
            🔍
          </div>
          <h1 className="text-2xl font-bold text-white">API Lens</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Monitor, budget, and attribute AI API costs
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
