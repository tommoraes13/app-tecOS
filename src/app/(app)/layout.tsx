import { ViewerProvider } from "@/components/detalhes/viewer";
import { BuscaGlobal } from "@/components/layout/busca-global";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBarActions } from "@/components/layout/top-bar";
import { PuxarParaAtualizar } from "@/components/layout/puxar-para-atualizar";
import { getPerfil } from "@/lib/perfil";

/** Moldura das telas logadas: menu lateral + barra superior no computador; hambúrguer no celular. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const perfil = await getPerfil();
  const user = { nome: perfil?.nome ?? null, email: perfil?.email ?? null, fotoUrl: perfil?.fotoUrl ?? null };

  return (
    <ViewerProvider>
      <div className="min-h-dvh">
        <PuxarParaAtualizar />
        <Sidebar />
        <MobileNav
          actions={
            <>
              <BuscaGlobal compact />
              <TopBarActions user={user} compact />
            </>
          }
        />
        <main className="px-4 pt-6 pb-[calc(96px+env(safe-area-inset-bottom))] lg:pt-4 lg:pr-6 lg:pb-16 lg:pl-[288px]">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-6 hidden h-16 items-center justify-between gap-4 rounded-xl bg-surface px-3 shadow-card lg:flex">
              <BuscaGlobal />
              <TopBarActions user={user} />
            </div>
            {children}
          </div>
        </main>
      </div>
    </ViewerProvider>
  );
}
