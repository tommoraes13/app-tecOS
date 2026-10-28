import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** Tela provisória do esqueleto: cabeçalho, botão principal e estado vazio. */
export function PlaceholderScreen({
  title,
  description,
  icon,
  emptyTitle,
  emptyText,
  cta,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  emptyTitle: string;
  emptyText: string;
  cta?: string;
}) {
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          cta ? (
            <Button variant="cta" icon={<Plus />} disabled title="Disponível na próxima fase">
              {cta}
            </Button>
          ) : null
        }
      />
      <Card>
        <EmptyState icon={icon} title={emptyTitle} description={emptyText} />
      </Card>
    </>
  );
}
