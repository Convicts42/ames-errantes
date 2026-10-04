import { Workspace } from "../../components/workspace";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense fallback={<p>Ouverture de votre espace…</p>}>
      <Workspace />
    </Suspense>
  );
}
