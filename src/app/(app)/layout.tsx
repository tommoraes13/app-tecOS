import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBarActions } from "@/components/layout/top-bar";
import { getPerfil } from "@/lib/perfil";

/** Moldura das telas logadas: menu lateral + barra superior no computador; hambúrguer no celular. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const perfil = await getPerfil();
  const user = { nome: perfil?.nome ?? null, email: perfil?.email ?? null, fotoUrl: perfil?.fotoUrl ?? null };

  return (
    <div className="min-h-dvh">
      <Sidebar />
      <MobileNav actions={<TopBarActions user={user} compact />} />
      <main className="px-4 pt-6 pb-16 lg:pt-4 lg:pr-6 lg:pl-[288px]">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-6 hidden h-16 items-center justify-end rounded-xl bg-surface px-3 shadow-card lg:flex">
            <TopBarActions user={user} />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
