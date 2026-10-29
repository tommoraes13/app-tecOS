import { NavList } from "./nav-list";
import { Wordmark } from "./wordmark";

/** Menu lateral fixo em card, a partir de 1024px (Design System > Sidebar). */
export function Sidebar() {
  return (
    <aside className="fixed top-4 bottom-4 left-4 z-20 hidden w-[248px] flex-col rounded-xl bg-surface p-3 pt-5 shadow-card lg:flex">
      <Wordmark className="px-3 pb-4" />
      <div className="flex-1 overflow-y-auto">
        <NavList />
      </div>
    </aside>
  );
}
