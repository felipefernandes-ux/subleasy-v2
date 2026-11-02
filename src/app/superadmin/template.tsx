/** Refaz a entrada a cada troca de página do Super Admin: fade curto, sem bloquear a navegação. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-[sa-tab-in_0.28s_cubic-bezier(0.2,0.7,0.2,1)_both] motion-reduce:animate-none">{children}</div>;
}
