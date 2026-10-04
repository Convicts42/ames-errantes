import { cookies } from "next/headers";
import { getSession, sessionCookie } from "../../server/auth.mjs";
import { listAnimals, listRequests } from "../../server/repository.mjs";
import { PageFrame } from "../../components/page-frame";
import { AdminLogin } from "../../components/admin/login";
import { Dashboard } from "../../components/admin/dashboard";
import "../../styles/admin.css";

export const runtime = "nodejs";
export const metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const store = await cookies();
  const admin = getSession(store.get(sessionCookie)?.value);
  return (
    <PageFrame page={{ slug: "admin", label: "Administration" }}>
      <div className="admin-shell shell">
        <div className="admin-heading">
          <span className="eyebrow">L’ESPACE DE L’ÉQUIPE</span>
          <h1>
            {admin ? "Prenons soin de la suite." : "Bienvenue, à nouveau."}
          </h1>
          <p>
            {admin
              ? "Les compagnons, les nouvelles demandes et votre compte."
              : "Connectez-vous pour gérer les compagnons et les demandes."}
          </p>
        </div>
        {admin ? (
          <Dashboard
            username={admin.username}
            initialAnimals={listAnimals({ admin: true })}
            initialRequests={listRequests()}
          />
        ) : (
          <AdminLogin />
        )}
      </div>
    </PageFrame>
  );
}
