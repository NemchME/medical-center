import { Outlet, Link } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-cosmic flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-primary-500/30">
            M
          </div>
          <span className="text-3xl font-bold text-white tracking-tight">
            medicina
          </span>
        </Link>
        <div className="glass rounded-2xl p-8 shadow-2xl animate-slide-up">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
