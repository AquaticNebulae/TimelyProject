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

// CSV file path: <project-root>/data/users.csv
const csvPath = path.join(__dirname, "data", "users.csv");

// Ensure folder + header row
if (!fs.existsSync(csvPath)) {
    fs.mkdirSync(path.dirname(csvPath), { recursive: true });
    fs.writeFileSync(
        csvPath,
        "CustomerID,FirstName,MiddleName,LastName,Email,TempPassword\n",
        "utf8"
    );
}

let nextCustomerId = (() => {
    const content = fs.readFileSync(csvPath, "utf8").trim();
    if (!content) return 1;
    const lines = content.split("\n");
    const dataLines = lines.length - 1;
    return dataLines + 1;
})();

// POST /api/users-csv
app.post("/api/users-csv", (req: Request, res: Response) => {
    const { firstName, middleName, lastName, email, tempPassword } = req.body;

    if (!firstName || !lastName || !email || !tempPassword) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    const fields = [
        String(nextCustomerId),
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
            console.error("Error writing CSV:", err);
            return res.status(500).json({ error: "Failed to write CSV file." });
        }
        const assignedId = nextCustomerId;
        nextCustomerId += 1;
        return res.json({ success: true, customerId: assignedId });
    });
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`CSV server running on http://localhost:${PORT}`);
});
