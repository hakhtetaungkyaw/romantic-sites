import LoginForm from "./LoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1a1a1a] px-6">
      <LoginForm next={next ?? "/admin/new-order/birthday-v1"} />
    </main>
  );
}
