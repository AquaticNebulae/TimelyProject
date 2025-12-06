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


// ==========================================================
//  HELPER FUNCTIONS
//  These are small tools used throughout the server
// ==========================================================

// Creates nice looking IDs like C-0001, CO-0002, P-0003
function formatId(prefix: string, n: number): string {
    return `${prefix}-${n.toString().padStart(4, "0")}`;
}


// ==========================================================
//  CSV FILE PATHS
//  All our data is stored in simple CSV files in the data folder
// ==========================================================

const csvPath = path.join(__dirname, "data", "users.csv");
const projectsCsvPath = path.join(__dirname, "data", "projects.csv");
const consultantsCsvPath = path.join(__dirname, "data", "consultants.csv");
const auditCsvPath = path.join(__dirname, "data", "audit_logs.csv");
const clientConsultantsCsvPath = path.join(__dirname, "data", "client_consultants.csv");
const clientProjectsCsvPath = path.join(__dirname, "data", "client_projects.csv");
const consultantProjectsCsvPath = path.join(__dirname, "data", "consultant_projects.csv");
const hoursLogsCsvPath = path.join(__dirname, "data", "hours_logs.csv");
const projectDetailsCsvPath = path.join(__dirname, "data", "project_details.csv");
const projectCommentsCsvPath = path.join(__dirname, "data", "project_comments.csv");
const projectAttachmentsCsvPath = path.join(__dirname, "data", "project_attachments.csv");


// ==========================================================
//  FILE SETUP
//  Makes sure all CSV files exist with proper headers
//  If a file doesn't exist, it creates it
// ==========================================================

function ensureFile(filePath: string, header: string) {
    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, header, "utf8");
    }
}

ensureFile(csvPath, "CustomerID,FirstName,MiddleName,LastName,Email,TempPassword\n");
ensureFile(projectsCsvPath, "ProjectID,ProjectName,ClientName,Status\n");
ensureFile(consultantsCsvPath, "ConsultantID,FirstName,LastName,Email,TempPassword,Role\n");
ensureFile(auditCsvPath, "LogID,Timestamp,ActionType,EntityType,EntityId,PerformedBy,Details\n");
ensureFile(clientConsultantsCsvPath, "ClientID,ConsultantID,CreatedAt\n");
ensureFile(clientProjectsCsvPath, "ClientID,ProjectID,IsCurrent,CreatedAt\n");
ensureFile(consultantProjectsCsvPath, "ConsultantID,ProjectID,CreatedAt\n");
ensureFile(hoursLogsCsvPath, "LogID,ProjectID,ConsultantID,Date,Hours,Description,CreatedAt\n");
ensureFile(projectDetailsCsvPath, "ProjectID,DateCreated,DateDue,Description,CreatedAt,UpdatedAt\n");
ensureFile(projectCommentsCsvPath, "CommentID,ProjectID,Author,CommentText,CreatedAt\n");
ensureFile(projectAttachmentsCsvPath, "AttachmentID,ProjectID,FileName,FileSize,FileType,UploadedBy,CreatedAt\n");


// ==========================================================
//  ID COUNTERS
//  Keeps track of the next ID number for each type of record
// ==========================================================

function getNextIdFromCsv(filePath: string): number {
    if (!fs.existsSync(filePath)) return 1;
    const content = fs.readFileSync(filePath, "utf8").trim();
    if (!content) return 1;
    const lines = content.split(/\r?\n/);
    const dataLines = lines.length - 1;
    return dataLines + 1;
}

let nextCustomerId = getNextIdFromCsv(csvPath);
let nextProjectId = getNextIdFromCsv(projectsCsvPath);
let nextConsultantId = getNextIdFromCsv(consultantsCsvPath);
let nextAuditId = getNextIdFromCsv(auditCsvPath);


// ==========================================================
//  AUDIT LOG
//  Records all important actions (who did what and when)
//  Good for security and tracking changes
// ==========================================================

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
//  LOGIN - THE MAIN ROLE SYSTEM
//  Checks who is logging in and assigns them a role:
//  - "admin" = full access to everything
//  - "consultant" = staff member who works on projects
//  - "client" = customer who can only see their own stuff
// ==========================================================

app.post("/api/login", (req: Request, res: Response) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    const emailLower = email.trim().toLowerCase();

    try {
        // STEP 1: Check if they're a hardcoded admin
        // These are the main admin accounts that always exist
        const adminAccounts = [
            { email: "fryv@timely.com", password: "admin123", customerId: "admin-1", name: "Admin Fryv" },
            { email: "mardij@timely.com", password: "admin123", customerId: "admin-2", name: "Admin Mardij" },
        ];

        for (const admin of adminAccounts) {
            if (admin.email.toLowerCase() === emailLower && admin.password === password) {
                appendAuditLog("LOGIN", "admin", admin.customerId, email, `Admin logged in: ${admin.name}`);
                return res.json({
                    success: true,
                    user: {
                        customerId: admin.customerId,
                        name: admin.name,
                        email: admin.email,
                        role: "admin"
                    }
                });
            }
        }

        // STEP 2: Check if they're a consultant from the consultants CSV
        // Consultants have their own passwords stored in the CSV
        if (fs.existsSync(consultantsCsvPath)) {
            const content = fs.readFileSync(consultantsCsvPath, "utf8").trim();
            if (content) {
                const lines: string[] = content.split(/\r?\n/);
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i];
                    if (!line || !line.trim()) continue;

                    const cols = line.split(",");
                    // CSV columns: ConsultantID, FirstName, LastName, Email, TempPassword, Role
                    const consultantEmail = (cols[3] ?? "").toLowerCase();
                    const consultantPassword = cols[4] ?? "";

                    if (consultantEmail === emailLower && consultantPassword === password) {
                        const numericId = Number(cols[0] ?? i);
                        const user = {
                            customerId: cols[0] ?? "",
                            consultantCode: formatId("CO", numericId),
                            name: `${cols[1] ?? ""} ${cols[2] ?? ""}`.trim(),
                            email: cols[3] ?? "",
                            role: "consultant"
                        };

                        appendAuditLog("LOGIN", "consultant", user.consultantCode, email, `Consultant logged in: ${user.name}`);
                        return res.json({ success: true, user });
                    }
                }
            }
        }

        // STEP 3: Check if they're a client from the users CSV
        // Clients use the tempPassword that was set when their account was created
        if (fs.existsSync(csvPath)) {
            const content = fs.readFileSync(csvPath, "utf8").trim();
            if (content) {
                const lines: string[] = content.split(/\r?\n/);
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i];
                    if (!line || !line.trim()) continue;

                    const cols = line.split(",");
                    // CSV columns: CustomerID, FirstName, MiddleName, LastName, Email, TempPassword
                    const userEmail = (cols[4] ?? "").toLowerCase();
                    const userPassword = cols[5] ?? "";

                    if (userEmail === emailLower && userPassword === password) {
                        const numericId = Number(cols[0] ?? i);
                        const user = {
                            customerId: cols[0] ?? "",
                            clientCode: formatId("C", numericId),
                            name: `${cols[1] ?? ""} ${cols[3] ?? ""}`.trim(),
                            email: cols[4] ?? "",
                            role: "client"
                        };

                        appendAuditLog("LOGIN", "client", user.clientCode, email, `Client logged in: ${user.name}`);
                        return res.json({ success: true, user });
                    }
                }
            }
        }

        // If we get here, no matching account was found
        return res.status(401).json({ error: "Invalid email or password." });

    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Server error during login." });
    }
});


// ==========================================================
//  USERS / CLIENTS
//  Create, read, and delete client accounts
//  Clients are customers who use your services
// ==========================================================

// Create a new client (used by Email Generator)
app.post("/api/users-csv", (req: Request, res: Response) => {
    const { firstName, middleName, lastName, email, tempPassword, performedBy } = req.body || {};

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

        return res.json({ success: true, customerId: numericId, clientCode });
    });
});

// Get all clients as a list
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

// Delete a client
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
            [header, ...newRows].filter((l) => l && l.trim().length > 0).join("\n") + "\n";

        fs.writeFileSync(csvPath, newContent, "utf8");

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

// Download clients as a CSV file
app.get("/api/users-report/csv", (req: Request, res: Response) => {
    if (!fs.existsSync(csvPath)) {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=users.csv");
        return res.send("CustomerID,FirstName,MiddleName,LastName,Email,TempPassword\n");
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=users.csv");
    const stream = fs.createReadStream(csvPath);
    stream.pipe(res);
});


// ==========================================================
//  CONSULTANTS
//  Create, read, and delete consultant accounts
//  Consultants are staff members who work on client projects
// ==========================================================

// Create a new consultant
app.post("/api/consultants", (req: Request, res: Response) => {
    const { firstName, lastName, email, tempPassword, role, performedBy } = req.body || {};

    if (!firstName || !lastName || !email) {
        return res.status(400).json({ error: "firstName, lastName and email are required." });
    }

    const numericId = nextConsultantId;
    const consultantCode = formatId("CO", numericId);

    // Default password if none provided
    const password = tempPassword || "consultant123";

    const fields = [
        String(numericId),
        firstName || "",
        lastName || "",
        email || "",
        password,
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
            return res.status(500).json({ error: "Failed to write consultants CSV." });
        }
        nextConsultantId += 1;

        appendAuditLog(
            "CREATE_CONSULTANT",
            "consultant",
            consultantCode,
            performedBy || "unknown_admin",
            `Consultant created: ${firstName} ${lastName} (${email})`
        );

        return res.json({ success: true, consultantId: numericId, consultantCode });
    });
});

// Get all consultants as a list
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
                tempPassword: cols[4] ?? "",
                role: cols[5] ?? "",
            });
        }

        return res.json({ data });
    } catch (err) {
        console.error("Error reading consultants CSV:", err);
        return res.status(500).json({ error: "Failed to read consultants CSV." });
    }
});

// Delete a consultant
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
            [header, ...newRows].filter((l) => l && l.trim().length > 0).join("\n") + "\n";

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
        return res.status(500).json({ error: "Failed to delete consultant." });
    }
});


// ==========================================================
//  PROJECTS
//  Create, read, and delete projects
//  Projects are work items that clients pay for
// ==========================================================

// Create a new project
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

// Get all projects as a list
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

// Delete a project
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
            [header, ...newRows].filter((l) => l && l.trim().length > 0).join("\n") + "\n";

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

// Assign a project to a client (and optionally consultants)
app.post("/api/projects/assign", (req: Request, res: Response) => {
    const { clientId, projectId, consultantIds, performedBy } = req.body || {};
    if (!clientId || !projectId) {
        return res.status(400).json({ error: "clientId and projectId are required." });
    }

    const now = new Date().toISOString();

    // Mark old projects as not current, add new one as current
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
        [header, ...newRows].filter((l) => l && l.trim().length > 0).join("\n") + "\n";
    fs.writeFileSync(clientProjectsCsvPath, newContent, "utf8");

    // Also assign consultants to the project if provided
    if (Array.isArray(consultantIds) && consultantIds.length > 0) {
        let cContent = fs.readFileSync(consultantProjectsCsvPath, "utf8").trim();
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

        const finalRows = cRows.filter((l) => l && l.trim().length > 0).concat(extraRows);
        const finalContent =
            [cHeader, ...finalRows].filter((l) => l && l.trim().length > 0).join("\n") + "\n";
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
//  CLIENT-CONSULTANT ASSIGNMENTS
//  Links clients to the consultants who work with them
// ==========================================================

// Assign a consultant to a client
app.post("/api/client-consultants/assign", (req: Request, res: Response) => {
    const { clientId, consultantId, performedBy } = req.body || {};
    if (!clientId || !consultantId) {
        return res.status(400).json({ error: "clientId and consultantId are required." });
    }

    // Make sure both exist
    const clientContent = fs.readFileSync(csvPath, "utf8").trim();
    const consultantContent = fs.readFileSync(consultantsCsvPath, "utf8").trim();
    if (!clientContent || !consultantContent) {
        return res.status(400).json({ error: "No clients or consultants found." });
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
        return res.status(400).json({ error: "Client or consultant does not exist." });
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

    const finalRows = rows.filter((l) => l && l.trim().length > 0).concat(newRow);
    const finalContent =
        [header, ...finalRows].filter((l) => l && l.trim().length > 0).join("\n") + "\n";

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

// Get all client-consultant assignments
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
//  AUDIT LOGS / ACTIVITY FEED
//  Shows recent activity in the system
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
//  HOURS LOGGING
//  Track how many hours consultants spend on projects
// ==========================================================

// Log hours worked
app.post("/api/hours-logs", (req: Request, res: Response) => {
    const { projectId, consultantId, date, hours, description, performedBy } = req.body || {};

    if (!projectId || !consultantId || !date || hours === undefined) {
        return res.status(400).json({ error: "projectId, consultantId, date, and hours are required." });
    }

    const numericId = getNextIdFromCsv(hoursLogsCsvPath);
    const logCode = formatId("HL", numericId);

    const fields = [
        String(numericId),
        String(projectId),
        String(consultantId),
        date || "",
        String(hours),
        description || "",
        new Date().toISOString()
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

    fs.appendFile(hoursLogsCsvPath, row, (err) => {
        if (err) {
            console.error("Error writing hours logs CSV:", err);
            return res.status(500).json({ error: "Failed to write hours log." });
        }

        appendAuditLog(
            "LOG_HOURS",
            "hours_log",
            logCode,
            performedBy || "unknown_admin",
            `Hours logged: ${hours}h for consultant ${consultantId} on project ${projectId}`
        );

        return res.json({ success: true, logId: numericId, logCode });
    });
});

// Get hours for a specific project
app.get("/api/hours-logs/:projectId", (req: Request, res: Response) => {
    const { projectId } = req.params;

    try {
        if (!fs.existsSync(hoursLogsCsvPath)) {
            return res.json({ data: [] });
        }

        const content = fs.readFileSync(hoursLogsCsvPath, "utf8").trim();
        if (!content) {
            return res.json({ data: [] });
        }

        const lines: string[] = content.split(/\r?\n/);
        const data: any[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line || !line.trim()) continue;

            const cols = line.split(",");

            if (cols[1] === String(projectId)) {
                data.push({
                    logId: cols[0] ?? "",
                    projectId: cols[1] ?? "",
                    consultantId: cols[2] ?? "",
                    date: cols[3] ?? "",
                    hours: parseFloat(cols[4] ?? "0"),
                    description: cols[5] ?? "",
                    createdAt: cols[6] ?? ""
                });
            }
        }

        return res.json({ data });
    } catch (err) {
        console.error("Error reading hours logs CSV:", err);
        return res.status(500).json({ error: "Failed to read hours logs." });
    }
});

// Get all hours (optionally filter by consultant)
app.get("/api/hours-logs", (req: Request, res: Response) => {
    const { consultantId } = req.query;

    try {
        if (!fs.existsSync(hoursLogsCsvPath)) {
            return res.json({ data: [] });
        }

        const content = fs.readFileSync(hoursLogsCsvPath, "utf8").trim();
        if (!content) {
            return res.json({ data: [] });
        }

        const lines: string[] = content.split(/\r?\n/);
        const data: any[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line || !line.trim()) continue;

            const cols = line.split(",");

            const log = {
                logId: cols[0] ?? "",
                projectId: cols[1] ?? "",
                consultantId: cols[2] ?? "",
                date: cols[3] ?? "",
                hours: parseFloat(cols[4] ?? "0"),
                description: cols[5] ?? "",
                createdAt: cols[6] ?? ""
            };

            if (consultantId && log.consultantId !== String(consultantId)) continue;

            data.push(log);
        }

        return res.json({ data });
    } catch (err) {
        console.error("Error reading hours logs CSV:", err);
        return res.status(500).json({ error: "Failed to read hours logs." });
    }
});

// Delete an hours log entry
app.post("/api/hours-logs-delete", (req: Request, res: Response) => {
    const { logId, performedBy } = req.body || {};

    if (!logId) {
        return res.status(400).json({ error: "logId is required." });
    }

    if (!fs.existsSync(hoursLogsCsvPath)) {
        return res.status(404).json({ error: "Hours logs CSV not found." });
    }

    try {
        const content = fs.readFileSync(hoursLogsCsvPath, "utf8").trim();
        if (!content) {
            return res.status(404).json({ error: "No hours logs to delete." });
        }

        const lines: string[] = content.split(/\r?\n/);
        const header = lines[0];
        const rows = lines.slice(1);

        const idStr = String(logId);
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
            return res.status(404).json({ error: "Hours log not found." });
        }

        const newContent =
            [header, ...newRows].filter((l) => l && l.trim().length > 0).join("\n") + "\n";

        fs.writeFileSync(hoursLogsCsvPath, newContent, "utf8");

        const cols = deletedRow.split(",");
        const numericId = Number(cols[0] ?? idStr);
        const logCode = formatId("HL", numericId);

        appendAuditLog(
            "DELETE_HOURS_LOG",
            "hours_log",
            logCode,
            performedBy || "unknown_admin",
            `Hours log deleted: ${cols[4]}h on ${cols[3]}`
        );

        return res.json({ success: true });
    } catch (err) {
        console.error("Error deleting hours log:", err);
        return res.status(500).json({ error: "Failed to delete hours log." });
    }
});


// ==========================================================
//  PROJECT DETAILS
//  Extra info about projects (dates, descriptions, etc)
// ==========================================================

// Create or update project details
app.post("/api/project-details", (req: Request, res: Response) => {
    const { projectId, dateCreated, dateDue, description, performedBy } = req.body || {};

    if (!projectId) {
        return res.status(400).json({ error: "projectId is required." });
    }

    try {
        let content = "";
        if (fs.existsSync(projectDetailsCsvPath)) {
            content = fs.readFileSync(projectDetailsCsvPath, "utf8").trim();
        }
        let lines: string[] = content ? content.split(/\r?\n/) : [];

        if (lines.length === 0) {
            lines = ["ProjectID,DateCreated,DateDue,Description,CreatedAt,UpdatedAt"];
        }

        const header = lines[0];
        const rows = lines.slice(1);
        const newRows: string[] = [];
        let found = false;

        const now = new Date().toISOString();

        for (const line of rows) {
            if (!line || !line.trim()) continue;
            const cols = line.split(",");

            if (cols[0] === String(projectId)) {
                found = true;
                const fields = [
                    String(projectId),
                    dateCreated || cols[1] || "",
                    dateDue || cols[2] || "",
                    description || cols[3] || "",
                    cols[4] || now,
                    now
                ];

                const row = fields
                    .map((f) => {
                        const v = f ?? "";
                        if (v.includes(",") || v.includes('"') || v.includes("\n")) {
                            return `"${v.replace(/"/g, '""')}"`;
                        }
                        return v;
                    })
                    .join(",");

                newRows.push(row);
            } else {
                newRows.push(line);
            }
        }

        if (!found) {
            const fields = [
                String(projectId),
                dateCreated || "",
                dateDue || "",
                description || "",
                now,
                now
            ];

            const row = fields
                .map((f) => {
                    const v = f ?? "";
                    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
                        return `"${v.replace(/"/g, '""')}"`;
                    }
                    return v;
                })
                .join(",");

            newRows.push(row);
        }

        const newContent =
            [header, ...newRows].filter((l) => l && l.trim().length > 0).join("\n") + "\n";

        fs.writeFileSync(projectDetailsCsvPath, newContent, "utf8");

        appendAuditLog(
            found ? "UPDATE_PROJECT_DETAILS" : "CREATE_PROJECT_DETAILS",
            "project_details",
            `P${projectId}`,
            performedBy || "unknown_admin",
            `Project details ${found ? 'updated' : 'created'} for project ${projectId}`
        );

        return res.json({ success: true });
    } catch (err) {
        console.error("Error saving project details:", err);
        return res.status(500).json({ error: "Failed to save project details." });
    }
});

// Get details for a specific project
app.get("/api/project-details/:projectId", (req: Request, res: Response) => {
    const { projectId } = req.params;

    try {
        if (!fs.existsSync(projectDetailsCsvPath)) {
            return res.json({ data: null });
        }

        const content = fs.readFileSync(projectDetailsCsvPath, "utf8").trim();
        if (!content) {
            return res.json({ data: null });
        }

        const lines: string[] = content.split(/\r?\n/);

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line || !line.trim()) continue;

            const cols = line.split(",");

            if (cols[0] === String(projectId)) {
                return res.json({
                    data: {
                        projectId: cols[0] ?? "",
                        dateCreated: cols[1] ?? "",
                        dateDue: cols[2] ?? "",
                        description: cols[3] ?? "",
                        createdAt: cols[4] ?? "",
                        updatedAt: cols[5] ?? ""
                    }
                });
            }
        }

        return res.json({ data: null });
    } catch (err) {
        console.error("Error reading project details:", err);
        return res.status(500).json({ error: "Failed to read project details." });
    }
});


// ==========================================================
//  PROJECT COMMENTS
//  Notes and messages attached to projects
// ==========================================================

// Add a comment to a project
app.post("/api/project-comments", (req: Request, res: Response) => {
    const { projectId, author, commentText, performedBy } = req.body || {};

    if (!projectId || !author || !commentText) {
        return res.status(400).json({ error: "projectId, author, and commentText are required." });
    }

    const numericId = getNextIdFromCsv(projectCommentsCsvPath);
    const commentCode = formatId("CM", numericId);

    const fields = [
        String(numericId),
        String(projectId),
        author || "",
        commentText || "",
        new Date().toISOString()
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

    fs.appendFile(projectCommentsCsvPath, row, (err) => {
        if (err) {
            console.error("Error writing comment CSV:", err);
            return res.status(500).json({ error: "Failed to write comment." });
        }

        appendAuditLog(
            "CREATE_COMMENT",
            "comment",
            commentCode,
            performedBy || author,
            `Comment added to project ${projectId}`
        );

        return res.json({ success: true, commentId: numericId, commentCode });
    });
});

// Get all comments for a project
app.get("/api/project-comments/:projectId", (req: Request, res: Response) => {
    const { projectId } = req.params;

    try {
        if (!fs.existsSync(projectCommentsCsvPath)) {
            return res.json({ data: [] });
        }

        const content = fs.readFileSync(projectCommentsCsvPath, "utf8").trim();
        if (!content) {
            return res.json({ data: [] });
        }

        const lines: string[] = content.split(/\r?\n/);
        const data: any[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line || !line.trim()) continue;

            const cols = line.split(",");

            if (cols[1] === String(projectId)) {
                data.push({
                    commentId: cols[0] ?? "",
                    projectId: cols[1] ?? "",
                    author: cols[2] ?? "",
                    commentText: cols[3] ?? "",
                    createdAt: cols[4] ?? ""
                });
            }
        }

        return res.json({ data });
    } catch (err) {
        console.error("Error reading comments CSV:", err);
        return res.status(500).json({ error: "Failed to read comments." });
    }
});


// ==========================================================
//  PROJECT ATTACHMENTS
//  Files uploaded to projects (just metadata, not actual files)
// ==========================================================

// Record a file attachment
app.post("/api/project-attachments", (req: Request, res: Response) => {
    const { projectId, fileName, fileSize, fileType, uploadedBy } = req.body || {};

    if (!projectId || !fileName) {
        return res.status(400).json({ error: "projectId and fileName are required." });
    }

    const numericId = getNextIdFromCsv(projectAttachmentsCsvPath);
    const attachmentCode = formatId("AT", numericId);

    const fields = [
        String(numericId),
        String(projectId),
        fileName || "",
        fileSize || "",
        fileType || "",
        uploadedBy || "",
        new Date().toISOString()
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

    fs.appendFile(projectAttachmentsCsvPath, row, (err) => {
        if (err) {
            console.error("Error writing attachment CSV:", err);
            return res.status(500).json({ error: "Failed to write attachment." });
        }

        appendAuditLog(
            "UPLOAD_ATTACHMENT",
            "attachment",
            attachmentCode,
            uploadedBy || "unknown_admin",
            `File uploaded: ${fileName} to project ${projectId}`
        );

        return res.json({ success: true, attachmentId: numericId, attachmentCode });
    });
});

// Get all attachments for a project
app.get("/api/project-attachments/:projectId", (req: Request, res: Response) => {
    const { projectId } = req.params;

    try {
        if (!fs.existsSync(projectAttachmentsCsvPath)) {
            return res.json({ data: [] });
        }

        const content = fs.readFileSync(projectAttachmentsCsvPath, "utf8").trim();
        if (!content) {
            return res.json({ data: [] });
        }

        const lines: string[] = content.split(/\r?\n/);
        const data: any[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line || !line.trim()) continue;

            const cols = line.split(",");

            if (cols[1] === String(projectId)) {
                data.push({
                    attachmentId: cols[0] ?? "",
                    projectId: cols[1] ?? "",
                    fileName: cols[2] ?? "",
                    fileSize: cols[3] ?? "",
                    fileType: cols[4] ?? "",
                    uploadedBy: cols[5] ?? "",
                    createdAt: cols[6] ?? ""
                });
            }
        }

        return res.json({ data });
    } catch (err) {
        console.error("Error reading attachments CSV:", err);
        return res.status(500).json({ error: "Failed to read attachments." });
    }
});


// ==========================================================
//  START THE SERVER
// ==========================================================

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`CSV server running on http://localhost:${PORT}`);
});