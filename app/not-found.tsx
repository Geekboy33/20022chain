import Link from "next/link";

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <h1 className="text-6xl font-extrabold text-[#0a0a0a] tracking-tight mb-2">404</h1>
      <p className="text-sm text-[#888] mb-6">Page not found on 20022Chain</p>
      <Link href="/" className="btn-primary">Back to Explorer</Link>
    </div>
  );
}
