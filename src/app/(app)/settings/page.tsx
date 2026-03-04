"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useUser } from "@clerk/nextjs";
import { useTopbar } from "@/components/layout/topbar-context";
import { CustomToggle } from "@/components/ui/custom-toggle";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomCheckbox } from "@/components/ui/custom-checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff } from "lucide-react";

type TabId = "account" | "integrations" | "preferences";

const tabs: { id: TabId; label: string }[] = [
  { id: "account", label: "Account" },
  { id: "integrations", label: "Integrations" },
  { id: "preferences", label: "Preferences" },
];

const MODEL_OPTIONS: { value: string; label: string }[] = [
  { value: "meta-llama/llama-3.2-3b-instruct:free", label: "Llama 3.2 3B" },
  { value: "google/gemma-2-9b-it:free", label: "Gemma 2 9B" },
  { value: "mistralai/mistral-7b-instruct:free", label: "Mistral 7B" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("account");
  const { user } = useUser();
  const { setAction } = useTopbar();
  const saveRef = useRef<() => void>(() => {});

  useEffect(() => {
    setAction({ label: "Save", onClick: () => saveRef.current() });
    return () => setAction(null);
  }, [setAction, activeTab]);

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-[rgba(255,255,255,0.06)] mb-6 px-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-[13px] font-medium cursor-pointer transition-all duration-150 ${
              activeTab === tab.id
                ? "text-[#f2f2f2] border-b-2 border-[#ff4000]"
                : "text-[#4a4a4a] hover:text-[#888] border-b-2 border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "account" && <AccountTab user={user} saveRef={saveRef} />}
      {activeTab === "integrations" && <IntegrationsTab saveRef={saveRef} />}
      {activeTab === "preferences" && <PreferencesTab saveRef={saveRef} />}
    </div>
  );
}

function AccountTab({
  user,
  saveRef,
}: {
  user: ReturnType<typeof useUser>["user"];
  saveRef: React.MutableRefObject<() => void>;
}) {
  saveRef.current = () => toast("Account is managed by Clerk.");
  return (
    <div className="flex flex-col gap-5 max-w-[480px]">
      <div>
        <p className="text-[16px] font-semibold text-[#f2f2f2]">
          {user?.firstName} {user?.lastName}
        </p>
        <p className="text-[13px] text-[#888] mt-0.5">{user?.primaryEmailAddress?.emailAddress}</p>
      </div>
      <Link
        href="https://accounts.clerk.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[13px] text-[#ff4000] hover:underline"
      >
        Manage account →
      </Link>
    </div>
  );
}

function IntegrationsTab({ saveRef }: { saveRef: React.MutableRefObject<() => void> }) {
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [openRouterKeyVisible, setOpenRouterKeyVisible] = useState(false);
  const [openRouterModel, setOpenRouterModel] = useState(MODEL_OPTIONS[0].value);

  useEffect(() => {
    fetch("/api/integrations/gmail")
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: { connected?: boolean; email?: string }) => {
        setGmailConnected(!!d.connected);
        setGmailEmail(d.email ?? null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/integrations/calendar")
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: { connected?: boolean }) => setCalendarConnected(!!d.connected))
      .catch(() => {});
  }, []);

  saveRef.current = () => {
    toast("Integrations saved.");
  };

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between py-4 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <p className="text-[14px] font-medium text-[#f2f2f2]">Gmail</p>
          <p className="text-[13px] text-[#888]">
            {gmailConnected && gmailEmail ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e]" />
                {gmailEmail} · Connected
              </span>
            ) : (
              "Not connected"
            )}
          </p>
        </div>
        {gmailConnected ? (
          <button
            type="button"
            onClick={() => {
              fetch("/api/integrations/gmail", { method: "DELETE" }).then((r) => {
                if (r.ok) {
                  setGmailConnected(false);
                  setGmailEmail(null);
                  toast("Disconnected.");
                }
              });
            }}
            className="text-[13px] font-medium text-[#f87171] hover:underline"
          >
            Disconnect
          </button>
        ) : (
          <a
            href="/api/auth/google"
            className="bg-[#ff4000] hover:bg-[#e63900] text-white text-[13px] font-semibold px-4 py-1.5 rounded-[8px] inline-block"
          >
            Connect Gmail
          </a>
        )}
      </div>

      <div className="flex items-center justify-between py-4 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <p className="text-[14px] font-medium text-[#f2f2f2]">Calendar</p>
          <p className="text-[13px] text-[#888]">
            {calendarConnected ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e]" />
                Connected
              </span>
            ) : (
              "Not connected"
            )}
          </p>
        </div>
        {calendarConnected ? (
          <button
            type="button"
            onClick={() => {
              fetch("/api/integrations/calendar", { method: "DELETE" }).then((r) => {
                if (r.ok) {
                  setCalendarConnected(false);
                  toast("Disconnected.");
                }
              });
            }}
            className="text-[13px] font-medium text-[#f87171] hover:underline"
          >
            Disconnect
          </button>
        ) : (
          <a
            href="/api/auth/google"
            className="bg-[#ff4000] hover:bg-[#e63900] text-white text-[13px] font-semibold px-4 py-1.5 rounded-[8px] inline-block"
          >
            Connect Calendar
          </a>
        )}
      </div>

      <div className="bg-[#1e1e1e] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-5 mt-4">
        <p className="text-[14px] font-semibold text-[#f2f2f2]">OpenRouter</p>
        <p className="text-[12px] text-[#888] mt-0.5">Enables AI email writing</p>
        <div className="mt-4">
          <label className="block text-[13px] font-medium text-[#f2f2f2] mb-1">API Key</label>
          <div className="relative">
            <Input
              type={openRouterKeyVisible ? "text" : "password"}
              value={openRouterKey}
              onChange={(e) => setOpenRouterKey(e.target.value)}
              placeholder="sk-..."
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setOpenRouterKeyVisible((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4a4a4a] hover:text-[#f2f2f2] p-1"
              aria-label={openRouterKeyVisible ? "Hide" : "Show"}
            >
              {openRouterKeyVisible ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
            </button>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-[13px] font-medium text-[#f2f2f2] mb-1">Model</label>
          <CustomSelect
            value={openRouterModel}
            onChange={setOpenRouterModel}
            options={MODEL_OPTIONS}
            placeholder="Select model"
          />
        </div>
        <button
          type="button"
          onClick={() => saveRef.current()}
          className="mt-4 bg-[#ff4000] hover:bg-[#e63900] text-white text-[13px] font-semibold px-4 py-1.5 rounded-[8px]"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function PreferencesTab({ saveRef }: { saveRef: React.MutableRefObject<() => void> }) {
  const [tone, setTone] = useState<"professional" | "friendly" | "casual">("professional");
  const [signature, setSignature] = useState("");
  const [sendConfirmation, setSendConfirmation] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { email_signature?: string; default_tone?: string; send_confirmation?: boolean } | null) => {
        if (d) {
          if (d.email_signature != null) setSignature(d.email_signature);
          if (d.default_tone != null) setTone((d.default_tone as typeof tone) || "professional");
          if (d.send_confirmation != null) setSendConfirmation(d.send_confirmation);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  saveRef.current = async () => {
    const res = await fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email_signature: signature,
        default_tone: tone,
        send_confirmation: sendConfirmation,
      }),
    });
    if (res.ok) toast("Preferences saved.");
    else toast("Failed to save preferences.");
  };

  return (
    <div className="flex flex-col gap-6 max-w-[480px]">
      <div>
        <label className="block text-[13px] font-medium text-[#f2f2f2] mb-1">Default Tone</label>
        <p className="text-[12px] text-[#888] mb-2">Used for AI-generated emails when no tone is selected.</p>
        <CustomToggle
          options={[
            { value: "professional", label: "Professional" },
            { value: "friendly", label: "Friendly" },
            { value: "casual", label: "Casual" },
          ]}
          value={tone}
          onChange={(v) => setTone(v as typeof tone)}
        />
      </div>
      <div>
        <label className="block text-[13px] font-medium text-[#f2f2f2] mb-1">Email Signature</label>
        <Textarea
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="Optional signature"
          className="min-h-[120px]"
        />
        <p className="text-[11px] text-[#4a4a4a] mt-1">Appended to every email you send</p>
      </div>
      <div>
        <CustomCheckbox
          checked={sendConfirmation}
          onChange={setSendConfirmation}
          label="Always preview before sending"
        />
      </div>
      <button
        type="button"
        onClick={() => saveRef.current()}
        className="bg-[#ff4000] hover:bg-[#e63900] text-white text-[13px] font-semibold px-4 py-1.5 rounded-[8px] w-fit"
      >
        Save Preferences
      </button>
    </div>
  );
}
