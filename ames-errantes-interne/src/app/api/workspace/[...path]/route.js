import { listAnimals, listRequests } from "@ames/core/site/repository.mjs";
import {
  activity,
  getPublication,
  publishDocument,
  unpublishDocument,
} from "@ames/core/publications.mjs";
import {
  endpoint,
  json,
  body,
  requireUser,
  requireOwner,
  tokenFrom,
  cookie,
} from "../../../../server/http.mjs";
import {
  hasUsers,
  session,
  login,
  logout,
  setup,
  createUser,
  listUsers,
  changePassword,
  sessionSeconds,
} from "@ames/core/auth.mjs";
import {
  listDocuments,
  searchDocuments,
  getDocument,
  createDocument,
  updateDocument,
  listRevisions,
  getRevision,
  restoreRevision,
  listTasks,
  saveTask,
  exportProject,
} from "@ames/core/workspace/store.mjs";
import { getDatabase } from "@ames/core/database.mjs";
import { AppError } from "@ames/core/workspace/errors.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = endpoint(async (request, { params }) => {
  const { path } = await params,
    route = path.join("/");
  if (route === "session")
    return json({
      user: await session(tokenFrom(request)),
      setupRequired: !(await hasUsers()),
    });
  const user = await requireUser(request);
  if (route === "overview")
    return json({
      siteUrl: process.env.PUBLIC_SITE_URL || "http://localhost:4173",
      documents: await listDocuments(),
      tasks: await listTasks(),
      users: await listUsers(),
      backupDay:
        (
          await getDatabase().query(
            "SELECT value FROM maintenance WHERE key='lastBackup'",
          )
        ).rows[0]?.value || null,
    });
  if (route === "management")
    return json({
      animals: await listAnimals({ admin: true }),
      requests: await listRequests(),
    });
  if (route === "activity") return json({ events: await activity() });
  if (path[0] === "documents" && path[2] === "publication" && path.length === 3)
    return json({ publication: await getPublication(path[1]) });
  if (route === "documents") {
    const query = new URL(request.url).searchParams.get("q");
    return json({
      documents:
        query !== null ? await searchDocuments(query) : await listDocuments(),
    });
  }
  if (path[0] === "documents" && path.length === 2)
    return json({
      document: await getDocument(path[1]),
    });
  if (path[0] === "documents" && path[2] === "history" && path.length === 3)
    return json({
      revisions: await listRevisions(path[1]),
    });
  if (path[0] === "documents" && path[2] === "history" && path.length === 4)
    return json({
      revision: await getRevision(path[1], path[3]),
    });
  if (route === "tasks")
    return json({
      tasks: await listTasks(),
    });
  if (route === "users")
    return json({
      users: await listUsers(),
    });
  if (route === "export")
    return json(await exportProject(), 200, {
      "Content-Disposition": `attachment; filename="ames-errantes-${new Date().toISOString().slice(0, 10)}.json"`,
    });
  throw new AppError(404, "Cette page est introuvable.");
});
export const POST = endpoint(async (request, { params }) => {
  const { path } = await params,
    route = path.join("/");
  if (route === "login") {
    const input = await body(request),
      token = await login(input);
    return json(
      {
        user: await session(token),
      },
      200,
      {
        "Set-Cookie": cookie(token, sessionSeconds),
      },
    );
  }
  if (route === "setup") {
    const input = await body(request);
    await setup(input);
    const token = await login(input);
    return json(
      {
        user: await session(token),
      },
      201,
      {
        "Set-Cookie": cookie(token, sessionSeconds),
      },
    );
  }
  const user = await requireUser(request),
    input = await body(request);
  if (path[0] === "documents" && path[2] === "publish" && path.length === 3)
    return json({ publication: await publishDocument(path[1], input, user) });
  if (path[0] === "documents" && path[2] === "unpublish" && path.length === 3) {
    await unpublishDocument(path[1]);
    return json({ publication: null });
  }
  if (route === "logout") {
    await logout(tokenFrom(request));
    return json(
      {
        ok: true,
      },
      200,
      {
        "Set-Cookie": cookie("", 0),
      },
    );
  }
  if (route === "documents")
    return json(
      {
        document: await createDocument(input, user),
      },
      201,
    );
  if (path[0] === "documents" && path[2] === "restore" && path.length === 3)
    return json({
      document: await restoreRevision(path[1], input, user),
    });
  if (route === "tasks")
    return json(
      {
        task: await saveTask(null, input, user),
      },
      201,
    );
  if (route === "users") {
    requireOwner(user);
    return json(
      {
        user: await createUser(input),
      },
      201,
    );
  }
  if (route === "password") {
    await changePassword(user, input);
    return json(
      {
        ok: true,
      },
      200,
      {
        "Set-Cookie": cookie("", 0),
      },
    );
  }
  throw new AppError(404, "Cette action est introuvable.");
});
export const PUT = endpoint(async (request, { params }) => {
  const user = await requireUser(request),
    input = await body(request),
    { path } = await params;
  if (path[0] === "documents" && path.length === 2)
    return json({
      document: await updateDocument(path[1], input, user),
    });
  if (path[0] === "tasks" && path.length === 2)
    return json({
      task: await saveTask(path[1], input, user),
    });
  throw new AppError(404, "Cette action est introuvable.");
});
