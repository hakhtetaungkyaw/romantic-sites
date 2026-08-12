export default function OrderNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-[#1a0a12] px-6 text-center text-[#faf5f0]">
      <h1 className="font-serif text-2xl">Page not found</h1>
      <p className="text-sm text-[#faf5f0]/60">
        This link doesn&apos;t match any order.
      </p>
    </div>
  );
}
