export default function PageLoader({ label = 'Loading' }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-cream/80 z-50">
      <div className="text-center">
        <p className="text-brown text-sm mb-2">{label}</p>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange mx-auto"></div>
      </div>
    </div>
  );
}