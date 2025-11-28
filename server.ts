// server.ts
import express from "express";
import type { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---- Helpers ----
function formatId(prefix: string, n: number): string {
  // C-0001, CO-0001, P-0001
  return `${prefix}-${n.toString().padStart(4, "0")}`;
}

// ---- CSV paths ----
const csvPath = path.join(__dirname, "data", "users.csv");
const projectsCsvPath = path.join(__dirname, "data", "projects.csv");
const consultantsCsvPath = path.join(__dirname, "data", "consultants.csv");
const auditCsvPath = path.join(__dirname, "data", "audit_logs.csv");
const clientConsultantsCsvPath = path.join(
  __dirname,
  "data",
  "client_consultants.csv"
);
const clientProjectsCsvPath = path.join(
  __dirname,
  "data",
  "client_projects.csv"
);
const consultantProjectsCsvPath = path.join(
  __dirname,
  "data",
  "consultant_projects.csv"
);

// ---- Ensure files exist ----
function ensureFile(filePath: string, header: string) {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, header, "utf8");
  }
}

ensureFile(
  csvPath,
  "CustomerID,FirstName,MiddleName,LastName,Email,TempPassword\n"
);
ensureFile(
  projectsCsvPath,
  "ProjectID,ProjectName,ClientName,Status\n"
);
ensureFile(
  consultantsCsvPath,
  "ConsultantID,FirstName,LastName,Email,Role\n"
);
ensureFile(
  auditCsvPath,
  "LogID,Timestamp,ActionType,EntityType,EntityId,PerformedBy,Details\n"
);
ensureFile(
  clientConsultantsCsvPath,
  "ClientID,ConsultantID,CreatedAt\n"
);
ensureFile(
  clientProjectsCsvPath,
  "ClientID,ProjectID,IsCurrent,CreatedAt\n"
);
ensureFile(
  consultantProjectsCsvPath,
  "ConsultantID,ProjectID,CreatedAt\n"
);

// ---- ID counters ----
function getNextIdFromCsv(filePath: string): number {
  if (!fs.existsSync(filePath)) return 1;
  const content = fs.readFileSync(filePath, "utf8").trim();
  if (!content) return 1;
  const lines = content.split(/\r?\n/);
  const dataLines = lines.length - 1; // minus header
  return dataLines + 1;
}

let nextCustomerId = getNextIdFromCsv(csvPath);
let nextProjectId = getNextIdFromCsv(projectsCsvPath);
let nextConsultantId = getNextIdFromCsv(consultantsCsvPath);
let nextAuditId = getNextIdFromCsv(auditCsvPath);

// ---- Audit log helper ----
function appendAuditLog(
  actionType: string,
  entityType: string,
  entityId: string,
  performedBy: string,
  details: string
) {
  const timestamp = new Date().toISOString();
  const fields = [
    String(nextAuditId),
    timestamp,
    actionType,
    entityType,
    entityId,
    performedBy,
    details,
  ];

  const row =
    fields
      .map((f) => {
        const v = f ?? "";
        if (v.includes(",") || v.includes('"') || v.includes("\n")) {
          return `"${v.replace(/"/g, '""')}"`;
        }
        return v;
      })
      .join(",") + "\n";

  fs.appendFileSync(auditCsvPath, row, "utf8");
  nextAuditId += 1;
}

// ==========================================================
//  USERS / CLIENTS
// ==========================================================

// Create client (EmailGenerator)
app.post("/api/users-csv", (req: Request, res: Response) => {
  const {
    firstName,
    middleName,
    lastName,
    email,
    tempPassword,
    performedBy,
  } = req.body || {};

  if (!firstName || !lastName || !email || !tempPassword) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const numericId = nextCustomerId;
  const clientCode = formatId("C", numericId);

  const fields = [
    String(numericId),
    firstName,
    middleName || "",
    lastName,
    email,
    tempPassword,
  ];

  const row =
    fields
      .map((f) => {
        const v = f ?? "";
        if (v.includes(",") || v.includes('"') || v.includes("\n")) {
          return `"${v.replace(/"/g, '""')}"`;
        }
        return v;
      })
      .join(",") + "\n";

  fs.appendFile(csvPath, row, (err) => {
    if (err) {
      console.error("Error writing users CSV:", err);
      return res.status(500).json({ error: "Failed to write CSV file." });
    }
    nextCustomerId += 1;

    appendAuditLog(
      "CREATE_CLIENT",
      "client",
      clientCode,
      performedBy || "unknown_admin",
      `Client created: ${firstName} ${lastName} (${email})`
    );

    return res.json({
      success: true,
      customerId: numericId,
      clientCode,
    });
  });
});

// Get clients report (JSON)
app.get("/api/users-report", (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(csvPath)) {
      return res.json({ data: [] });
    }

    const content = fs.readFileSync(csvPath, "utf8").trim();
    if (!content) {
      return res.json({ data: [] });
    }

    const lines: string[] = content.split(/\r?\n/);
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || !line.trim()) continue;

      const cols = line.split(",");
      const numericId = Number(cols[0] ?? i);
      data.push({
        customerId: cols[0] ?? "",
        clientCode: formatId("C", numericId),
        firstName: cols[1] ?? "",
        middleName: cols[2] ?? "",
        lastName: cols[3] ?? "",
        email: cols[4] ?? "",
        tempPassword: cols[5] ?? "",
      });
    }

    return res.json({ data });
  } catch (err) {
    console.error("Error reading users CSV:", err);
    return res.status(500).json({ error: "Failed to read CSV file." });
  }
});

// Delete client
app.post("/api/users-delete", (req: Request, res: Response) => {
  const { customerId, performedBy } = req.body || {};

  if (!customerId) {
    return res.status(400).json({ error: "customerId is required." });
  }

  if (!fs.existsSync(csvPath)) {
    return res.status(404).json({ error: "CSV file not found." });
  }

  try {
    const content = fs.readFileSync(csvPath, "utf8").trim();
    if (!content) {
      return res.status(404).json({ error: "No data to delete." });
    }

    const lines: string[] = content.split(/\r?\n/);
    const header = lines[0];
    const rows = lines.slice(1);

    const idStr = String(customerId);
    const newRows: string[] = [];
    let deletedRow: string | null = null;

    for (const line of rows) {
      if (!line || !line.trim()) continue;
      const cols = line.split(",");
      if (cols[0] === idStr) {
        deletedRow = line;
        continue;
      }
      newRows.push(line);
    }

    if (!deletedRow) {
      return res.status(404).json({ error: "User not found." });
    }

    const newContent =
      [header, ...newRows].filter((l) => l && l.trim().length > 0).join("\n") +
      "\n";

    fs.writeFileSync(csvPath, newContent, "utf8");

    // Audit
    const cols = deletedRow.split(",");
    const numericId = Number(cols[0] ?? idStr);
    const clientCode = formatId("C", numericId);
    const fullName = `${cols[1] ?? ""} ${cols[3] ?? ""}`.trim();
    const email = cols[4] ?? "";

    appendAuditLog(
      "DELETE_CLIENT",
      "client",
      clientCode,
      performedBy || "unknown_admin",
      `Client deleted: ${fullName} (${email})`
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({ error: "Failed to delete user." });
  }
});

// Download clients CSV
app.get("/api/users-report/csv", (req: Request, res: Response) => {
  if (!fs.existsSync(csvPath)) {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=users.csv");
    return res.send(
      "CustomerID,FirstName,MiddleName,LastName,Email,TempPassword\n"
    );
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=users.csv");
  const stream = fs.createReadStream(csvPath);
  stream.pipe(res);
});

// ==========================================================
//  PROJECTS
// ==========================================================

// Create project
app.post("/api/projects", (req: Request, res: Response) => {
  const { projectName, clientName, status, performedBy } = req.body || {};

  if (!projectName) {
    return res.status(400).json({ error: "projectName is required." });
  }

  const numericId = nextProjectId;
  const projectCode = formatId("P", numericId);

  const fields = [
    String(numericId),
    projectName || "",
    clientName || "",
    status || "",
  ];

  const row =
    fields
      .map((f) => {
        const v = f ?? "";
        if (v.includes(",") || v.includes('"') || v.includes("\n")) {
          return `"${v.replace(/"/g, '""')}"`;
        }
        return v;
      })
      .join(",") + "\n";

  fs.appendFile(projectsCsvPath, row, (err) => {
    if (err) {
      console.error("Error writing projects CSV:", err);
      return res.status(500).json({ error: "Failed to write projects CSV." });
    }
    nextProjectId += 1;

    appendAuditLog(
      "CREATE_PROJECT",
      "project",
      projectCode,
      performedBy || "unknown_admin",
      `Project created: ${projectName}`
    );

    return res.json({ success: true, projectId: numericId, projectCode });
  });
});

// Get projects
app.get("/api/projects", (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(projectsCsvPath)) {
      return res.json({ data: [] });
    }

    const content = fs.readFileSync(projectsCsvPath, "utf8").trim();
    if (!content) {
      return res.json({ data: [] });
    }

    const lines: string[] = content.split(/\r?\n/);
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || !line.trim()) continue;
      const cols = line.split(",");
      const numericId = Number(cols[0] ?? i);
      data.push({
        projectId: cols[0] ?? "",
        projectCode: formatId("P", numericId),
        projectName: cols[1] ?? "",
        clientName: cols[2] ?? "",
        status: cols[3] ?? "",
      });
    }

    return res.json({ data });
  } catch (err) {
    console.error("Error reading projects CSV:", err);
    return res.status(500).json({ error: "Failed to read projects CSV." });
  }
});

// Delete project
app.post("/api/projects-delete", (req: Request, res: Response) => {
  const { projectId, performedBy } = req.body || {};

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required." });
  }

  if (!fs.existsSync(projectsCsvPath)) {
    return res.status(404).json({ error: "Projects CSV not found." });
  }

  try {
    const content = fs.readFileSync(projectsCsvPath, "utf8").trim();
    if (!content) {
      return res.status(404).json({ error: "No projects to delete." });
    }

    const lines: string[] = content.split(/\r?\n/);
    const header = lines[0];
    const rows = lines.slice(1);

    const idStr = String(projectId);
    const newRows: string[] = [];
    let deletedRow: string | null = null;

    for (const line of rows) {
      if (!line || !line.trim()) continue;
      const cols = line.split(",");
      if (cols[0] === idStr) {
        deletedRow = line;
        continue;
      }
      newRows.push(line);
    }

    if (!deletedRow) {
      return res.status(404).json({ error: "Project not found." });
    }

    const newContent =
      [header, ...newRows].filter((l) => l && l.trim().length > 0).join("\n") +
      "\n";

    fs.writeFileSync(projectsCsvPath, newContent, "utf8");

    const cols = deletedRow.split(",");
    const numericId = Number(cols[0] ?? idStr);
    const projectCode = formatId("P", numericId);
    const projectName = cols[1] ?? "";

    appendAuditLog(
      "DELETE_PROJECT",
      "project",
      projectCode,
      performedBy || "unknown_admin",
      `Project deleted: ${projectName}`
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("Error deleting project:", err);
    return res.status(500).json({ error: "Failed to delete project." });
  }
});

// Assign project → client (+ consultants)
app.post("/api/projects/assign", (req: Request, res: Response) => {
  const { clientId, projectId, consultantIds, performedBy } = req.body || {};
  if (!clientId || !projectId) {
    return res
      .status(400)
      .json({ error: "clientId and projectId are required." });
  }

  const now = new Date().toISOString();

  // Update client current project
  let content = fs.readFileSync(clientProjectsCsvPath, "utf8").trim();
  let lines: string[] = content ? content.split(/\r?\n/) : [];
  if (lines.length === 0) {
    lines = ["ClientID,ProjectID,IsCurrent,CreatedAt"];
  }

  const header = lines[0];
  const rows = lines.slice(1);
  const newRows: string[] = [];

  for (const line of rows) {
    if (!line || !line.trim()) continue;
    const cols = line.split(",");
    if (cols[0] === String(clientId)) {
      cols[2] = "false";
      newRows.push(cols.join(","));
    } else {
      newRows.push(line);
    }
  }

  newRows.push(`${clientId},${projectId},true,${now}`);
  const newContent =
    [header, ...newRows].filter((l) => l && l.trim().length > 0).join("\n") +
    "\n";
  fs.writeFileSync(clientProjectsCsvPath, newContent, "utf8");

  // Consultant workloads
  if (Array.isArray(consultantIds) && consultantIds.length > 0) {
    let cContent = fs.readFileSync(
      consultantProjectsCsvPath,
      "utf8"
    ).trim();
    let cLines: string[] = cContent ? cContent.split(/\r?\n/) : [];
    if (cLines.length === 0) {
      cLines = ["ConsultantID,ProjectID,CreatedAt"];
    }
    const cHeader = cLines[0];
    const cRows = cLines.slice(1);
    const existing: Set<string> = new Set();

    for (const line of cRows) {
      if (!line || !line.trim()) continue;
      const cols = line.split(",");
      existing.add(`${cols[0]},${cols[1]}`);
    }

    const extraRows: string[] = [];
    for (const cid of consultantIds) {
      const key = `${cid},${projectId}`;
      if (!existing.has(key)) {
        extraRows.push(`${cid},${projectId},${now}`);
      }
    }

    const finalRows = cRows
      .filter((l) => l && l.trim().length > 0)
      .concat(extraRows);
    const finalContent =
      [cHeader, ...finalRows]
        .filter((l) => l && l.trim().length > 0)
        .join("\n") + "\n";
    fs.writeFileSync(consultantProjectsCsvPath, finalContent, "utf8");
  }

  appendAuditLog(
    "ASSIGN_PROJECT",
    "project_assignment",
    `C${clientId}-P${projectId}`,
    performedBy || "unknown_admin",
    `Project ${projectId} assigned to client ${clientId}`
  );

  return res.json({ success: true });
});

// ==========================================================
//  CONSULTANTS
// ==========================================================

// Create consultant
app.post("/api/consultants", (req: Request, res: Response) => {
  const { firstName, lastName, email, role, performedBy } = req.body || {};

  if (!firstName || !lastName || !email) {
    return res
      .status(400)
      .json({ error: "firstName, lastName and email are required." });
  }

  const numericId = nextConsultantId;
  const consultantCode = formatId("CO", numericId);

  const fields = [
    String(numericId),
    firstName || "",
    lastName || "",
    email || "",
    role || "",
  ];

  const row =
    fields
      .map((f) => {
        const v = f ?? "";
        if (v.includes(",") || v.includes('"') || v.includes("\n")) {
          return `"${v.replace(/"/g, '""')}"`;
        }
        return v;
      })
      .join(",") + "\n";

  fs.appendFile(consultantsCsvPath, row, (err) => {
    if (err) {
      console.error("Error writing consultants CSV:", err);
      return res
        .status(500)
        .json({ error: "Failed to write consultants CSV." });
    }
    nextConsultantId += 1;

    appendAuditLog(
      "CREATE_CONSULTANT",
      "consultant",
      consultantCode,
      performedBy || "unknown_admin",
      `Consultant created: ${firstName} ${lastName} (${email})`
    );

    return res.json({
      success: true,
      consultantId: numericId,
      consultantCode,
    });
  });
});

// Get consultants
app.get("/api/consultants", (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(consultantsCsvPath)) {
      return res.json({ data: [] });
    }

    const content = fs.readFileSync(consultantsCsvPath, "utf8").trim();
    if (!content) {
      return res.json({ data: [] });
    }

    const lines: string[] = content.split(/\r?\n/);
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || !line.trim()) continue;
      const cols = line.split(",");
      const numericId = Number(cols[0] ?? i);
      data.push({
        consultantId: cols[0] ?? "",
        consultantCode: formatId("CO", numericId),
        firstName: cols[1] ?? "",
        lastName: cols[2] ?? "",
        email: cols[3] ?? "",
        role: cols[4] ?? "",
      });
    }

    return res.json({ data });
  } catch (err) {
    console.error("Error reading consultants CSV:", err);
    return res
      .status(500)
      .json({ error: "Failed to read consultants CSV." });
  }
});

// Delete consultant
app.post("/api/consultants-delete", (req: Request, res: Response) => {
  const { consultantId, performedBy } = req.body || {};

  if (!consultantId) {
    return res.status(400).json({ error: "consultantId is required." });
  }

  if (!fs.existsSync(consultantsCsvPath)) {
    return res.status(404).json({ error: "Consultants CSV not found." });
  }

  try {
    const content = fs.readFileSync(consultantsCsvPath, "utf8").trim();
    if (!content) {
      return res.status(404).json({ error: "No consultants to delete." });
    }

    const lines: string[] = content.split(/\r?\n/);
    const header = lines[0];
    const rows = lines.slice(1);

    const idStr = String(consultantId);
    const newRows: string[] = [];
    let deletedRow: string | null = null;

    for (const line of rows) {
      if (!line || !line.trim()) continue;
      const cols = line.split(",");
      if (cols[0] === idStr) {
        deletedRow = line;
        continue;
      }
      newRows.push(line);
    }

    if (!deletedRow) {
      return res.status(404).json({ error: "Consultant not found." });
    }

    const newContent =
      [header, ...newRows].filter((l) => l && l.trim().length > 0).join("\n") +
      "\n";

    fs.writeFileSync(consultantsCsvPath, newContent, "utf8");

    const cols = deletedRow.split(",");
    const numericId = Number(cols[0] ?? idStr);
    const consultantCode = formatId("CO", numericId);
    const fullName = `${cols[1] ?? ""} ${cols[2] ?? ""}`.trim();
    const email = cols[3] ?? "";

    appendAuditLog(
      "DELETE_CONSULTANT",
      "consultant",
      consultantCode,
      performedBy || "unknown_admin",
      `Consultant deleted: ${fullName} (${email})`
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("Error deleting consultant:", err);
    return res
      .status(500)
      .json({ error: "Failed to delete consultant." });
  }
});

// ==========================================================
//  CLIENT–CONSULTANT ASSIGNMENTS
// ==========================================================

app.post("/api/client-consultants/assign", (req: Request, res: Response) => {
  const { clientId, consultantId, performedBy } = req.body || {};
  if (!clientId || !consultantId) {
    return res
      .status(400)
      .json({ error: "clientId and consultantId are required." });
  }

  // sanity: check client & consultant exist
  const clientContent = fs.readFileSync(csvPath, "utf8").trim();
  const consultantContent = fs.readFileSync(
    consultantsCsvPath,
    "utf8"
  ).trim();
  if (!clientContent || !consultantContent) {
    return res
      .status(400)
      .json({ error: "No clients or consultants found." });
  }

  const clientLines: string[] = clientContent.split(/\r?\n/).slice(1);
  const consultantLines: string[] = consultantContent.split(/\r?\n/).slice(1);

  let clientExists = false;
  for (const line of clientLines) {
    if (!line || !line.trim()) continue;
    const cols = line.split(",");
    if (cols[0] === String(clientId)) {
      clientExists = true;
      break;
    }
  }

  let consultantExists = false;
  for (const line of consultantLines) {
    if (!line || !line.trim()) continue;
    const cols = line.split(",");
    if (cols[0] === String(consultantId)) {
      consultantExists = true;
      break;
    }
  }

  if (!clientExists || !consultantExists) {
    return res
      .status(400)
      .json({ error: "Client or consultant does not exist." });
  }

  let mapContent = fs.readFileSync(clientConsultantsCsvPath, "utf8").trim();
  let mapLines: string[] = mapContent ? mapContent.split(/\r?\n/) : [];
  if (mapLines.length === 0) {
    mapLines = ["ClientID,ConsultantID,CreatedAt"];
  }

  const header = mapLines[0];
  const rows = mapLines.slice(1);
  const existingPairs = new Set<string>();

  for (const line of rows) {
    if (!line || !line.trim()) continue;
    const cols = line.split(",");
    existingPairs.add(`${cols[0]},${cols[1]}`);
  }

  const key = `${clientId},${consultantId}`;
  if (existingPairs.has(key)) {
    return res.json({ success: true, message: "Already assigned." });
  }

  const createdAt = new Date().toISOString();
  const newRow = `${clientId},${consultantId},${createdAt}`;

  const finalRows = rows
    .filter((l) => l && l.trim().length > 0)
    .concat(newRow);

  const finalContent =
    [header, ...finalRows].filter((l) => l && l.trim().length > 0).join("\n") +
    "\n";

  fs.writeFileSync(clientConsultantsCsvPath, finalContent, "utf8");

  appendAuditLog(
    "ASSIGN_CONSULTANT",
    "client_consultant",
    `C${clientId}-CO${consultantId}`,
    performedBy || "unknown_admin",
    `Consultant ${consultantId} assigned to client ${clientId}`
  );

  return res.json({ success: true });
});

// List assignments
app.get("/api/client-consultants", (req: Request, res: Response) => {
  const { clientId, consultantId } = req.query;

  if (!fs.existsSync(clientConsultantsCsvPath)) {
    return res.json({ data: [] });
  }

  const content = fs.readFileSync(clientConsultantsCsvPath, "utf8").trim();
  if (!content) return res.json({ data: [] });

  const lines: string[] = content.split(/\r?\n/).slice(1);
  const data: any[] = [];

  for (const line of lines) {
    if (!line || !line.trim()) continue;
    const cols = line.split(",");
    const row = {
      clientId: cols[0],
      consultantId: cols[1],
      createdAt: cols[2],
    };
    if (clientId && row.clientId !== String(clientId)) continue;
    if (consultantId && row.consultantId !== String(consultantId)) continue;
    data.push(row);
  }

  return res.json({ data });
});

// ==========================================================
//  AUDIT / NOTIFICATIONS
// ==========================================================

app.get("/api/audit-logs/latest", (req: Request, res: Response) => {
  const limit = Number(req.query.limit ?? 10);

  if (!fs.existsSync(auditCsvPath)) return res.json({ data: [] });

  const content = fs.readFileSync(auditCsvPath, "utf8").trim();
  if (!content) return res.json({ data: [] });

  const lines: string[] = content.split(/\r?\n/);
  const rows: string[] = lines.slice(1).filter((l) => l && l.trim().length > 0);

  const start = Math.max(0, rows.length - limit);
  const recent = rows.slice(start);
  const data: any[] = [];

  for (const line of recent) {
    const cols = line.split(",");
    data.push({
      logId: cols[0] ?? "",
      timestamp: cols[1] ?? "",
      actionType: cols[2] ?? "",
      entityType: cols[3] ?? "",
      entityId: cols[4] ?? "",
      performedBy: cols[5] ?? "",
      details: cols[6] ?? "",
    });
  }

  return res.json({ data });
});

// ==========================================================
//  START SERVER
// ==========================================================

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`CSV server running on http://localhost:${PORT}`);
});
