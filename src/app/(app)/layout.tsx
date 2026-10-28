import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { UserBox } from "@/components/layout/user-box";
import { getCurrentUser } from "@/lib/supabase/server";

/** Moldura das telas logadas: menu lateral no computador, hambúrguer no celular. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const email = user?.email ?? null;

  return (
    <div className="min-h-dvh">
      <Sidebar email={email} />
      <MobileNav footer={<UserBox email={email} />} />
      <main className="px-4 pt-6 pb-16 lg:pt-8 lg:pr-6 lg:pl-[288px]">
        <div className="mx-auto max-w-[1280px]">{children}</div>
      </main>
    </div>
  );
}
