import { useMemo, useRef, useState } from "react";
// Not finished
function slugifyName(s: string) {
    return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z]/g, "");
}

export default function EmailGenerator({
    domain = "timely.com",
}: {
    domain?: string;
}) {
    const [first, setFirst] = useState("");
    const [middle, setMiddle] = useState("");
    const [last, setLast] = useState("");
    const [clientEmail, setClientEmail] = useState("");

    const [secureLink, setSecureLink] = useState<string>("");
    const [sending, setSending] = useState(false);
    const successBox = useRef<HTMLDivElement>(null);

    const companyEmail = useMemo(() => {
        const f = slugifyName(first);
        const l = slugifyName(last);
        if (!f || !l) return "";
        const email = `${l}${f[0]}@${domain}`;
        return email;
    }, [first, last, domain]);

    const copy = async (text: string) => {
        if (!text) return;
        await navigator.clipboard.writeText(text);
        successBox.current?.classList.remove("hidden");
        setTimeout(() => successBox.current?.classList.add("hidden"), 2000);
    };

    const openMailto = () => {
        if (!clientEmail || !companyEmail) return;
        const subject = encodeURIComponent("Your Timely account");
        const body = encodeURIComponent(
            `Hello ${first},\n\nYour new company email is: ${companyEmail}\n\nPlease use the secure link below to set your password:\n${secureLink || "(link will be inserted later)"}\n\nThanks,\nTimely Admin`
        );
        window.location.href = `mailto:${clientEmail}?subject=${subject}&body=${body}`;
    };

    const createSecureInvite = async () => {
        try {
            if (!clientEmail || !companyEmail) return;
            setSending(true);

            const res = await fetch("/api/invites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clientEmail,
                    companyEmail,
                    first,
                    middle,
                    last,
                }),
            });

            if (!res.ok) throw new Error("Failed to create invite");
            const data = await res.json();
            setSecureLink(data.url);

          

            successBox.current?.classList.remove("hidden");
            setTimeout(() => successBox.current?.classList.add("hidden"), 2000);
        } catch (e) {
            console.error(e);
            alert("Could not create secure link.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="bg-white p-8 max-w-xl mx-auto rounded-3xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Email Generator</h2>

            <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                        className="border rounded-xl px-3 py-2"
                        placeholder="First name"
                        value={first}
                        onChange={(e) => setFirst(e.target.value)}
                    />
                    <input
                        className="border rounded-xl px-3 py-2"
                        placeholder="Middle (optional)"
                        value={middle}
                        onChange={(e) => setMiddle(e.target.value)}
                    />
                    <input
                        className="border rounded-xl px-3 py-2"
                        placeholder="Last name"
                        value={last}
                        onChange={(e) => setLast(e.target.value)}
                    />
                </div>

                <input
                    className="border rounded-xl px-3 py-2"
                    placeholder="Client personal email (to receive invite)"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    type="email"
                />

                <div className="p-4 bg-gray-100 text-center rounded-xl text-lg select-all">
                    {companyEmail || "lastname + firstInitial @ " + domain}
                </div>

                <div className="flex gap-3 justify-center">
                    <button
                        type="button"
                        onClick={() => copy(companyEmail)}
                        disabled={!companyEmail}
                        className="px-5 py-3 rounded-xl text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 transition"
                    >
                        Copy Company Email
                    </button>

                    <button
                        type="button"
                        onClick={createSecureInvite}
                        disabled={!clientEmail || !companyEmail || sending}
                        className="px-5 py-3 rounded-xl text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 transition"
                    >
                        {sending ? "Creating Link..." : "Create Secure Invite Link"}
                    </button>

                    <button
                        type="button"
                        onClick={openMailto}
                        disabled={!clientEmail || !companyEmail}
                        className="px-5 py-3 rounded-xl text-white bg-green-500 hover:bg-green-600 disabled:opacity-50 transition"
                    >
                        Send Email (mailto)
                    </button>
                </div>

                {secureLink && (
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl break-all">
                        Secure Link: <a className="underline" href={secureLink}>{secureLink}</a>
                    </div>
                )}

                <div
                    ref={successBox}
                    className="hidden bg-green-100 text-green-700 text-sm p-2 rounded-xl text-center"
                >
                    Copied!
                </div>
            </div>
        </div>
    );
}
