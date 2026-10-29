/**
 * Proteção contra sair de um formulário sem salvar.
 * O formulário aberto registra uma função; quem navega por código (busca, janelas)
 * chama `navegarComGuarda` em vez de router.push direto.
 */
type Guarda = (href: string) => boolean; // true = a saída foi interceptada

let guarda: Guarda | null = null;

export function registrarGuarda(g: Guarda | null) {
  guarda = g;
}

export function navegarComGuarda(href: string, push: (href: string) => void) {
  if (guarda && guarda(href)) return;
  push(href);
}
