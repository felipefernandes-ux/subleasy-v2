import { ShieldCheckIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { getAdminIdentity } from "@/lib/superadmin/auth";
import { Avatar } from "./ui";

/** Quem está logado, no rodapé do menu. Server Component: a página o passa ao shell como `footer`. */
export async function AdminBadge() {
  const admin = await getAdminIdentity();
  return (
    <div className="flex items-center gap-2.5 rounded-sa-control px-2 py-1.5">
      <Avatar name={admin.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sa-sm font-semibold text-sa-ink">{admin.name}</p>
        {admin.twoFactor ? (
          <p className="flex items-center gap-1 text-sa-xs text-mint-700">
            <ShieldCheckIcon className="size-3.5" weight="fill" aria-hidden />
            2FA ativo
          </p>
        ) : (
          <p className="flex items-center gap-1 text-sa-xs text-warning-500">
            <WarningIcon className="size-3.5" weight="fill" aria-hidden />
            2FA desligado
          </p>
        )}
      </div>
    </div>
  );
}
