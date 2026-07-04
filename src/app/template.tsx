// template.tsx перемонтируется на каждой навигации —
// даёт анимацию входа для всех страниц.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-up">{children}</div>;
}
