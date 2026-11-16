import { ViewerProvider } from "@/components/detalhes/viewer";
import { BuscaGlobal } from "@/components/layout/busca-global";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBarActions } from "@/components/layout/top-bar";
import { PuxarParaAtualizar } from "@/components/layout/puxar-para-atualizar";
import { redirect } from "next/navigation";
import { Sair24h } from "@/components/layout/sair-24h";
import { MenuRodape } from "@/components/layout/menu-rodape";
import { getPerfil } from "@/lib/perfil";

const DIA_MS = 24 * 60 * 60 * 1000;

/** Moldura das telas logadas: menu lateral + barra superior no computador; hambúrguer no celular. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const perfil = await getPerfil();
  // Opção "Sair depois de 24 horas": passou do prazo desde o login, encerra a sessão.
  const expiraEm = perfil?.sairApos24h && perfil.loginEm ? perfil.loginEm * 1000 + DIA_MS : null;
  if (expiraEm && Date.now() >= expiraEm) redirect("/auth/expirou");
  const user = { nome: perfil?.nome ?? null, email: perfil?.email ?? null, fotoUrl: perfil?.fotoUrl ?? null };

  return (
    <ViewerProvider>
      <div className="min-h-dvh">
        <PuxarParaAtualizar />
        {expiraEm ? <Sair24h expiraEm={expiraEm} /> : null}
        <Sidebar />
        <MobileNav
          actions={
            <>
              <BuscaGlobal compact />
              <TopBarActions user={user} compact />
            </>
          }
        />
        <main className="px-4 pt-6 pb-[calc(128px+env(safe-area-inset-bottom))] lg:pt-4 lg:pr-6 lg:pb-16 lg:pl-[288px]">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-6 hidden h-16 items-center justify-between gap-4 rounded-xl bg-surface px-3 shadow-card lg:flex">
              <BuscaGlobal />
              <TopBarActions user={user} />
            </div>
            {children}
          </div>
        </main>
        <MenuRodape />
      </div>
    </ViewerProvider>
  );
}
