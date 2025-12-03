import React, { useMemo, useState } from "react";

const API_BASE = "http://localhost:4000";

const EmailGenerator: React.FC = () => {
  // --- FORM STATE ---
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [clientNumber, setClientNumber] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");

  // --- GENERATED VALUES ---
  const [tempPassword, setTempPassword] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // NOTE: since there is no real DB yet, Client ID is just a placeholder string.
  const clientId = useMemo(() => {
    if (!clientNumber.trim()) return "Will be assigned by database later";
    return `Pending-${clientNumber.trim()}`;
  }, [clientNumber]);

  // Company email based on last name + first initial
  const companyEmail = useMemo(() => {
    const f = firstName.trim();
    const l = lastName.trim();
    if (!f || !l) return "";
    const firstInitial = f[0].toLowerCase();
    const last = l.replace(/\s+/g, "").toLowerCase();
    return `${last}${firstInitial}@timely.com`;
  }, [firstName, lastName]);

  // --- HELPERS ---
  function showStatus(msg: string) {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  }

  function showError(msg: string) {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4000);
  }

  function copyToClipboard(value: string, label: string) {
    if (!value) {
      showError(`Nothing to copy for ${label}.`);
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(
        () => showStatus(`${label} copied to clipboard.`),
        () => showError("Could not copy to clipboard.")
      );
    } else {
      // Fallback for older browsers
      const tempInput = document.createElement("input");
      tempInput.value = value;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      showStatus(`${label} copied to clipboard.`);
    }
  }

  // Strong-ish password generator (frontend only)
  function generateStrongPassword() {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghijkmnopqrstuvwxyz";
    const digits = "23456789";
    const symbols = "!@$%^&*?";
    const all = upper + lower + digits + symbols;

    const pick = (s: string) => s[Math.floor(Math.random() * s.length)];

    let pwd = pick(upper) + pick(lower) + pick(digits) + pick(symbols);
    while (pwd.length < 12) {
      pwd += pick(all);
    }

    pwd = pwd
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    setTempPassword(pwd);
    showStatus("Secure temporary password generated.");
  }

  // Fake invite link (just for UI/demo)
  function createInviteLink() {
    if (!companyEmail || !personalEmail.trim()) {
      showError("Company email and personal email are required for invite link.");
      return;
    }

    const token = Math.random().toString(36).slice(2, 12);
    const link = `https://timely.example.com/invite?email=${encodeURIComponent(
      companyEmail
    )}&token=${token}`;
    setInviteLink(link);
    showStatus("Secure invite link generated.");
  }

  function sendMailtoInvite() {
    if (!personalEmail.trim()) {
      showError("Client personal email is required.");
      return;
    }

    const fullName = `${firstName} ${middleName ? middleName + " " : ""}${lastName}`.trim();
    const subject = `Your Timely account information`;

    const bodyLines = [
      fullName ? `Hello ${fullName},` : "Hello,",
      "",
      "Your Timely account has been prepared by the administrator.",
      companyEmail
        ? `Company login email: ${companyEmail}`
        : "Company login email: (to be assigned)",
      tempPassword
        ? `Temporary password: ${tempPassword}`
        : "Temporary password: (to be assigned)",
      clientNumber ? `Client number: ${clientNumber}` : "",
      clientId ? `Client ID (database): ${clientId}` : "",
      inviteLink ? `Invite link: ${inviteLink}` : "",
      "",
      "Please log in and change your password immediately after first sign-in.",
      "",
      "Best regards,",
      "Timely Admin",
    ].filter(Boolean);

    const body = encodeURIComponent(bodyLines.join("\n"));

    const mailtoUrl = `mailto:${encodeURIComponent(
      personalEmail.trim()
    )}?subject=${encodeURIComponent(subject)}&body=${body}`;

    window.location.href = mailtoUrl;
  }

  // Save user to CSV (backend API)
  async function saveUserToCsvFile() {
    if (!firstName.trim() || !lastName.trim()) {
      showError("First name and last name are required.");
      return;
    }
    if (!companyEmail) {
      showError("Company email is missing. Check first and last name.");
      return;
    }
    if (!tempPassword) {
      showError("Generate a temporary password first.");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${API_BASE}/api/users-csv`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          middleName: middleName.trim(),
          lastName: lastName.trim(),
          email: companyEmail,
          tempPassword: tempPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save user to CSV.");
      }

      const data = await response.json();
      showStatus(`User saved to CSV file (CustomerID = ${data.customerId}).`);
    } catch (err: any) {
      showError(err.message || "Error saving user to CSV file.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center bg-slate-100 pt-16">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8 m-4">
        <h1 className="text-2xl font-bold mb-2 text-slate-900">
          Admin – Client Registration &amp; Invite
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Use this screen to create a new client or consultant: enter their info, generate a
          company email and temporary password, and prepare an invite email. Data is currently
          stored in a shared CSV file on the server.
        </p>

        {statusMessage && (
          <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {statusMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        {/* NAME ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Middle (optional)"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        {/* CLIENT NUMBER + PERSONAL EMAIL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Client number / ID (optional)"
            value={clientNumber}
            onChange={(e) => setClientNumber(e.target.value)}
          />
          <div className="md:col-span-2">
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Client personal email (receives invite)"
              value={personalEmail}
              onChange={(e) => setPersonalEmail(e.target.value)}
            />
          </div>
        </div>

        {/* CLIENT ID (DATABASE) DISPLAY - purely visual for now */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-slate-600 mb-1">
            Client ID (database)
          </div>
          <div className="w-full rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-slate-800">
            {clientId}
          </div>
        </div>

        {/* COMPANY EMAIL DISPLAY */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-slate-600 mb-1">
            Company email (lastname + firstInitial @ timely.com)
          </div>
          <div className="w-full rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-slate-800">
            {companyEmail || "Enter first and last name to generate company email."}
          </div>
        </div>

        {/* PASSWORD + INVITE LINK */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <div>
            <div className="text-xs font-semibold text-slate-600 mb-1">
              Temporary password
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
                placeholder="Generate a strong password"
                value={tempPassword}
                readOnly
              />
              <button
                type="button"
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={generateStrongPassword}
              >
                Generate
              </button>
              <button
                type="button"
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-200 text-slate-800 hover:bg-slate-300"
                onClick={() => copyToClipboard(tempPassword, "Password")}
              >
                Copy
              </button>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-600 mb-1">
              Secure invite link
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Click 'Create link' to generate"
                value={inviteLink}
                readOnly
              />
              <button
                type="button"
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-violet-500 text-white hover:bg-violet-600"
                onClick={createInviteLink}
              >
                Create link
              </button>
              <button
                type="button"
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-200 text-slate-800 hover:bg-slate-300"
                onClick={() => copyToClipboard(inviteLink, "Invite link")}
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-sky-500 text-white hover:bg-sky-600"
            onClick={() => copyToClipboard(companyEmail, "Company email")}
          >
            Copy Company Email
          </button>

          <button
            type="button"
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={sendMailtoInvite}
          >
            Send Invite Email (mailto)
          </button>

          <button
            type="button"
            disabled={saving}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              saving
                ? "bg-amber-300 text-amber-900 cursor-not-allowed"
                : "bg-amber-500 hover:bg-amber-600 text-white"
            }`}
            onClick={saveUserToCsvFile}
          >
            {saving ? "Saving..." : "Save to shared CSV file"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailGenerator;
