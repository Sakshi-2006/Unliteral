"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  AudioLines,
  BookOpen,
  Check,
  FileText,
  History as HistoryIcon,
  Info,
  Languages,
  Menu,
  Plus,
  Settings,
  Star,
  UserRound,
  Video,
  X,
} from "lucide-react";
import {
  defaultRequest,
  localize,
  languages,
  readStored,
  uid,
  writeStored,
  type LocalizationRequest,
  type LocalizationResult,
} from "../lib/localizationEngine";
import {
  AUDIO_ACCEPT,
  VIDEO_ACCEPT,
  validateAudioFile,
  validateVideoFile,
} from "../lib/mediaValidation";

type Mode = "text" | "script" | "audio" | "video";
type View = "workspace" | "history" | "reviews" | "settings" | "account";
type Event = { id: string; mode: Mode; name: string; createdAt: string };
type Project = {
  id: string;
  name: string;
  contentType: Mode;
  createdAt: string;
  updatedAt: string;
};
type Profile = {
  fullName: string;
  email: string;
  designation: string;
  customDesignation: string;
  organization: string;
  bio: string;
  profileImage: string;
};
const emptyProfile: Profile = {
  fullName: "",
  email: "",
  designation: "Filmmaker",
  customDesignation: "",
  organization: "",
  bio: "",
  profileImage: "",
};
function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <i />
        <i />
        <i />
      </span>
      <b>UNLITERAL</b>
    </div>
  );
}
function Lang({
  value,
  onChange,
  source = false,
}: {
  value: string;
  onChange: (v: string) => void;
  source?: boolean;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {languages
        .filter((x) => source || x.name !== "Auto Detect")
        .map((x) => (
          <option key={x.name}>{x.name}</option>
        ))}
    </select>
  );
}
function Header({
  eyebrow,
  title,
  onNew,
}: {
  eyebrow: string;
  title: string;
  onNew: () => void;
}) {
  return (
    <div className="page-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      <button
        className="outline-btn"
        onClick={() => {
          onNew();
          window.dispatchEvent(new Event("unliteral:new-project"));
        }}
      >
        <Plus size={15} /> New project
      </button>
    </div>
  );
}
function Sidebar({
  view,
  setView,
  user,
  logout,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: {
  view: View;
  setView: (v: View) => void;
  user: string;
  logout: () => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  const nav: [View, string, React.ReactNode][] = [
    ["workspace", "Workspace", <BookOpen size={16} />],
    ["history", "History", <HistoryIcon size={16} />],
    ["reviews", "Reviews", <Star size={16} />],
    ["settings", "Settings", <Settings size={16} />],
    ["account", "User Account", <UserRound size={16} />],
  ];
  return (
    <>
      <div
        className={mobileOpen ? "sidebar-backdrop open" : "sidebar-backdrop"}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
      >
        <button
          className="brand-button"
          onClick={() => {
            setCollapsed(!collapsed);
            setMobileOpen(false);
          }}
        >
          <Brand />
        </button>
        {nav.map(([v, l, icon]) => (
          <button
            key={v}
            aria-label={l}
            className={view === v ? "nav-item active" : "nav-item"}
            onClick={() => {
              setView(v);
              setMobileOpen(false);
            }}
          >
            {icon}
            <span>{l}</span>
          </button>
        ))}
        <div className="side-bottom">
          <div className="user-chip">
            <span className="avatar">{user?.[0]?.toUpperCase() || "U"}</span>
            <span>
              <b>{user || "User"}</b>
              <small>User Account</small>
            </span>
            <button aria-label="Log out" onClick={logout}>
              ×
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
function NewProjectModal({
  close,
  choose,
}: {
  close: () => void;
  choose: (m: Mode) => void;
}) {
  return (
    <div className="modal">
      <section className="panel dialog project-dialog">
        <div className="panel-head">
          <b>NEW PROJECT</b>
          <button className="icon-btn" onClick={close}>
            <X size={16} />
          </button>
        </div>
        <div className="section-title">SELECT CONTENT TYPE</div>
        <div className="type-grid">
          {(["text", "script", "audio", "video"] as Mode[]).map((m) => (
            <button key={m} className="type-choice" onClick={() => choose(m)}>
              {m === "audio" ? (
                <AudioLines />
              ) : m === "video" ? (
                <Video />
              ) : (
                <FileText />
              )}
              <b>{m[0].toUpperCase() + m.slice(1)}</b>
              <small>Open workspace</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
function TextWorkspace({
  mode,
  addEvent,
  saveProject,
}: {
  mode: "text" | "script";
  addEvent: (m: Mode, n: string) => void;
  saveProject: (m: Mode) => void;
}) {
  const [req, setReq] = useState<LocalizationRequest>({ ...defaultRequest });
  const [result, setResult] = useState<LocalizationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (!req.text.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/localize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      const data = res.ok ? await res.json() : localize(req);
      setResult(data);
      addEvent(mode, `${mode[0].toUpperCase() + mode.slice(1)} localized`);
    } catch {
      const data = localize(req);
      setResult(data);
      addEvent(mode, `${mode[0].toUpperCase() + mode.slice(1)} localized`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Header
        eyebrow={`WORKSPACE / ${mode.toUpperCase()}`}
        title={
          mode === "text" ? "Make it feel native." : "Keep every beat intact."
        }
        onNew={() => {}}
      />
      <div className="studio-grid">
        <section className="panel input-panel">
          <div className="panel-head">
            YOUR SOURCE <span className="tiny-status">● GEMINI READY</span>
          </div>
          <div className="lang-row">
            <Lang
              source
              value={req.sourceLanguage}
              onChange={(v) => setReq({ ...req, sourceLanguage: v })}
            />
            <ArrowRight size={15} />
            <Lang
              value={req.targetLanguage}
              onChange={(v) => setReq({ ...req, targetLanguage: v })}
            />
          </div>
          <textarea
            value={req.text}
            onChange={(e) => setReq({ ...req, text: e.target.value })}
            placeholder={
              mode === "script"
                ? "Paste your script scene here…"
                : "Paste dialogue here…"
            }
          />
          <label>
            Scene context
            <input
              value={req.sceneContext}
              onChange={(e) => setReq({ ...req, sceneContext: e.target.value })}
              placeholder="Comedy, street conversation…"
            />
          </label>
          <div className="button-row">
            <button
              className="gold-btn"
              disabled={busy || !req.text.trim()}
              onClick={run}
            >
              {busy ? "Gemini is adapting…" : "Localize dialogue"}{" "}
              <ArrowRight size={15} />
            </button>
            <button
              className="outline-btn"
              type="button"
              onClick={() => saveProject(mode)}
            >
              Save project
            </button>
          </div>
        </section>
        <section className="panel result-panel">
          {result ? (
            <>
              <div className="section-title">LOCALIZED OUTPUT</div>
              <div className="quote-box">{result.localizedText}</div>
              <div className="section-title">ADAPTATION BREAKDOWN</div>
              {result.adaptations.map((x) => (
                <p key={x}>
                  <Check size={14} /> {x}
                </p>
              ))}
            </>
          ) : (
            <div className="empty-result">
              <Languages size={24} />
              <h2>
                Context in.
                <br />
                <em>Culture out.</em>
              </h2>
              <p>Your localized dialogue will appear here.</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
function MediaWorkspace({
  mode,
  addEvent,
  saveProject,
}: {
  mode: "audio" | "video";
  addEvent: (m: Mode, n: string) => void;
  saveProject: (m: Mode) => void;
}) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [mediaError, setMediaError] = useState("");
  const [audioTranscript, setAudioTranscript] = useState("");
  const [videoTranscript, setVideoTranscript] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [localizedTranscript, setLocalizedTranscript] =
    useState<LocalizationResult | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const recognition = useRef<any>(null);
  const chunks = useRef<Blob[]>([]);
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);
  const transcript = mode === "audio" ? audioTranscript : videoTranscript;
  const setTranscript =
    mode === "audio" ? setAudioTranscript : setVideoTranscript;
  const file = mode === "audio" ? audioFile : videoFile;
  const validateFile = (candidate: File) =>
    mode === "audio"
      ? validateAudioFile(candidate)
      : validateVideoFile(candidate);
  const accept = mode === "audio" ? AUDIO_ACCEPT : VIDEO_ACCEPT;
  const handleFile = (candidate: File | null) => {
    if (!candidate) return;
    const validation = validateFile(candidate);
    setMediaError(validation.accepted ? "" : validation.reason);
    if (!validation.accepted) return;
    console.log("[v0] audio file selected", {
      originalFilename: candidate.name,
      extension: validation.extension,
      fileType: candidate.type || "empty",
      normalizedMimeType:
        mode === "audio" && ["mpeg", "mp3"].includes(validation.extension)
          ? "audio/mpeg"
          : candidate.type || "application/octet-stream",
      fileSize: candidate.size,
    });
    if (mode === "audio") {
      setAudioTranscript("");
      setLocalizedTranscript(null);
      setAudioFile(candidate);
      setAudioUrl(URL.createObjectURL(candidate));
    } else {
      setVideoTranscript("");
      setLocalizedTranscript(null);
      setVideoFile(candidate);
      setVideoUrl(URL.createObjectURL(candidate));
    }
  };
  const clear = () => {
    if (mode === "audio") {
      setAudioFile(null);
      setAudioTranscript("");
      setLocalizedTranscript(null);
      setAudioUrl("");
      setSeconds(0);
      setRecording(false);
      localStorage.removeItem("unliteral_audio_workspace");
    } else {
      setVideoFile(null);
      setVideoTranscript("");
      setLocalizedTranscript(null);
      setVideoUrl("");
      localStorage.removeItem("unliteral_video_workspace");
    }
  };
  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setMediaError(
        "Audio recording is not supported in this browser. You can upload an audio file instead.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      chunks.current = [];
      r.ondataavailable = (e) => chunks.current.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: r.mimeType });
        setAudioFile(new File([blob], "recording.webm", { type: r.mimeType }));
        setAudioUrl(URL.createObjectURL(blob));
        addEvent("audio", "Audio recorded");
      };
      r.start();
      recorder.current = r;
      const Recognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (Recognition) {
        const sr = new Recognition();
        sr.continuous = true;
        sr.interimResults = true;
        sr.lang = "en-US";
        sr.onresult = (event: any) => {
          let finalText = "";
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const text = event.results[i][0].transcript;
            if (event.results[i].isFinal) finalText += text + " ";
            else interim += text;
          }
          if (finalText) setTranscript((prev) => `${prev} ${finalText}`.trim());
          setMediaError(interim ? "LIVE TRANSCRIPT: " + interim : "");
        };
        sr.onerror = () =>
          setMediaError(
            "Live speech recognition is unavailable. Recording continues without live captions.",
          );
        sr.start();
        recognition.current = sr;
      }
      setMediaError("");
      setRecording(true);
    } catch {
      setMediaError(
        "Microphone access was denied. Please allow microphone access in your browser settings to record audio.",
      );
    }
  };
  const [targetLanguage, setTargetLanguage] = useState(
    defaultRequest.targetLanguage,
  );
  const [processingStage, setProcessingStage] = useState("");
  const generateTranscript = async () => {
    if (!file) return;
    setTranscribing(true);
    setProcessingStage(
      mode === "video" ? "Extracting audio…" : "Processing audio…",
    );
    setMediaError("");
    try {
      setProcessingStage("Transcribing…");
      const form = new FormData();
      form.append(mode, file);
      form.append("sourceLanguage", defaultRequest.sourceLanguage);
      const response = await fetch(`/api/transcribe/${mode}`, {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          "Transcription could not be completed. Please try again.",
        );
      setTranscript(data.transcript || "");
    } catch (error) {
      setMediaError("Transcription could not be completed. Please try again.");
    } finally {
      setProcessingStage("");
      setTranscribing(false);
    }
  };
  const localizeTranscript = async () => {
    if (!transcript.trim()) return;
    setTranscribing(true);
    setProcessingStage("Localizing with Gemini…");
    try {
      const response = await fetch("/api/localize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...defaultRequest,
          text: transcript,
          targetLanguage,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          "Gemini could not localize this content. Please try again.",
        );
      setLocalizedTranscript(data);
      addEvent(mode, "Transcript localized");
    } catch {
      setMediaError(
        "Gemini could not localize this content. Please try again.",
      );
    } finally {
      setProcessingStage("");
      setTranscribing(false);
    }
  };
  return (
    <>
      <Header
        eyebrow={`WORKSPACE / ${mode.toUpperCase()}`}
        title={
          mode === "audio"
            ? "Let the emotion travel."
            : "Keep the scene intact."
        }
        onNew={() => {}}
      />
      <section className="panel media-panel">
        <div className="panel-head">
          <b>
            {mode === "audio" ? "AUDIO LOCALIZATION" : "VIDEO LOCALIZATION"}
          </b>
          <span className="status">
            {processingStage ||
              (mode === "audio"
                ? "Browser capture ready"
                : "Preview and upload")}
          </span>
        </div>
        {mode === "audio" && (
          <div className="record-bar">
            <span>
              <AudioLines size={28} />
              <b>
                {recording
                  ? `RECORDING 00:${String(seconds).padStart(2, "0")}`
                  : "RECORD FROM MICROPHONE"}
              </b>
            </span>
            <button
              className={recording ? "danger-btn" : "gold-btn"}
              onClick={
                recording
                  ? () => {
                      recorder.current?.stop();
                      recognition.current?.stop();
                      recognition.current = null;
                      setRecording(false);
                    }
                  : start
              }
            >
              {recording ? "Stop recording" : "Record audio"}
            </button>
          </div>
        )}
        <div className="media-card">
          {file && (
            <button
              className="media-remove"
              onClick={clear}
              aria-label={`Remove ${mode} file`}
            >
              <X size={15} />
            </button>
          )}
          <label className="upload-box">
            {file ? file.name : `Upload ${mode} file`}
            <input
              accept={accept}
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                handleFile(f);
                if (f) {
                  localStorage.setItem(
                    mode === "audio"
                      ? "unliteral_audio_workspace"
                      : "unliteral_video_workspace",
                    f.name,
                  );
                  addEvent(
                    mode,
                    mode === "video" ? "Video uploaded" : "Audio file uploaded",
                  );
                }
              }}
            />
          </label>
          {audioFile && mode === "audio" && <audio controls src={audioUrl} />}{" "}
          {videoFile && mode === "video" && (
            <video controls className="media-preview" src={videoUrl} />
          )}
          {mediaError && <p className="error-note">{mediaError}</p>}
          {file && !transcript && (
            <button
              className="outline-btn full"
              type="button"
              disabled={transcribing}
              onClick={generateTranscript}
            >
              {transcribing
                ? processingStage || `TRANSCRIBING ${mode.toUpperCase()}…`
                : "GENERATE TRANSCRIPT"}
            </button>
          )}
          {transcript && (
            <section className="transcript-panel">
              <div className="panel-head">
                TRANSCRIPT <span className="tiny-status">EDITABLE</span>
              </div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                aria-label={`${mode} transcript`}
              />
              <button
                className="gold-btn full"
                type="button"
                disabled={transcribing}
                onClick={localizeTranscript}
              >
                {transcribing
                  ? processingStage || "Processing…"
                  : "Localize Transcript"}{" "}
                <ArrowRight size={15} />
              </button>
              {localizedTranscript && (
                <div className="localized-transcript">
                  <div className="panel-head">LOCALIZED TRANSCRIPT</div>
                  <p>{localizedTranscript.localizedText}</p>
                </div>
              )}
            </section>
          )}
          <div className="button-row">
            <button
              className="outline-btn"
              type="button"
              onClick={() => saveProject(mode)}
            >
              Save project
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
function HistoryPage() {
  const events = readStored<Event[]>("unliteral-events", []);
  return (
    <section className="simple-page">
      <Header
        eyebrow="STUDIO / HISTORY"
        title="Your recent work."
        onNew={() => {}}
      />
      {events.length === 0 ? (
        <div className="panel empty-state">No activity yet.</div>
      ) : (
        <div className="panel history-list">
          {events
            .slice()
            .reverse()
            .map((e) => (
              <div className="history-item" key={e.id}>
                <span>{e.mode.toUpperCase()}</span>
                <b>{e.name}</b>
                <small>{safeDate(e.createdAt)}</small>
              </div>
            ))}
        </div>
      )}
    </section>
  );
}
function safeDate(value: string) {
  const date = new Date(value);
  return value && Number.isFinite(date.getTime())
    ? date.toLocaleString()
    : "Date unavailable";
}
function ReviewsPage() {
  const [review, setReview] = useState("");
  const [reviews, setReviews] = useState<string[]>(() =>
    readStored<string[]>("unliteral-reviews", []),
  );
  const submit = () => {
    const value = review.trim();
    if (!value) return;
    const next = [...reviews, value];
    setReviews(next);
    writeStored("unliteral-reviews", next);
    setReview("");
  };
  return (
    <section className="simple-page">
      <Header
        eyebrow="STUDIO / REVIEWS"
        title="Leave a note."
        onNew={() => {}}
      />
      <div className="panel review-panel">
        <div className="section-title">YOUR FEEDBACK</div>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="What felt natural? What could be better?"
        />
        <button className="gold-btn" onClick={submit} disabled={!review.trim()}>
          Submit review
        </button>
        {reviews.length > 0 && (
          <div className="review-list">
            {reviews.map((item, index) => (
              <p key={`${index}-${item}`}>{item}</p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
function SettingsPage() {
  const [theme, setTheme] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("unliteral-theme") || "dark"
      : "dark",
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("unliteral-theme", theme);
  }, [theme]);
  return (
    <section className="simple-page">
      <Header
        eyebrow="STUDIO / SETTINGS"
        title="Your preferences."
        onNew={() => {}}
      />
      <div className="panel settings-list">
        <label>
          Theme
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>
        <label>
          Notifications
          <select>
            <option>Enabled</option>
            <option>Muted</option>
          </select>
        </label>
        <label>
          Sound feedback
          <select>
            <option>On</option>
            <option>Off</option>
          </select>
        </label>
      </div>
    </section>
  );
}
function AccountPage() {
  const [profile, setProfile] = useState<Profile>(() =>
    readStored("unliteral-profile", emptyProfile),
  );
  const [saved, setSaved] = useState(false);
  const events = readStored<Event[]>("unliteral-events", []);
  const count = (m: Mode) => events.filter((e) => e.mode === m).length;
  const update = (p: Partial<Profile>) => setProfile((x) => ({ ...x, ...p }));
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    writeStored("unliteral-profile", profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };
  return (
    <section className="simple-page">
      <Header
        eyebrow="USER ACCOUNT"
        title="Your creative workspace."
        onNew={() => {}}
      />
      <div className="account-grid">
        <form className="panel profile" onSubmit={save}>
          <div className="section-title">PROFILE</div>
          <label>
            Profile Picture
            <input
              type="text"
              value={profile.profileImage}
              onChange={(e) => update({ profileImage: e.target.value })}
              placeholder="Image URL (optional)"
            />
          </label>
          <label>
            Full Name
            <input
              value={profile.fullName}
              onChange={(e) => update({ fullName: e.target.value })}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={profile.email}
              onChange={(e) => update({ email: e.target.value })}
            />
          </label>
          <label>
            Designation
            <select
              value={profile.designation}
              onChange={(e) => update({ designation: e.target.value })}
            >
              {[
                "Filmmaker",
                "Director",
                "Producer",
                "Screenwriter",
                "Scriptwriter",
                "Actor",
                "Dubbing Artist",
                "Content Creator",
                "Editor",
                "Animator",
                "YouTuber",
                "OTT Creator",
                "Film Student",
                "Media Professional",
                "Other",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          {profile.designation === "Other" && (
            <label>
              Custom designation
              <input
                value={profile.customDesignation}
                onChange={(e) => update({ customDesignation: e.target.value })}
              />
            </label>
          )}
          <label>
            Organization / Studio
            <input
              value={profile.organization}
              onChange={(e) => update({ organization: e.target.value })}
            />
          </label>
          <label>
            Bio
            <textarea
              value={profile.bio}
              onChange={(e) => update({ bio: e.target.value })}
            />
          </label>
          <button className="gold-btn full">Save changes</button>
          {saved && (
            <p className="success-note">Profile updated successfully ✓</p>
          )}
        </form>
        <section className="panel usage">
          <div className="section-title">USAGE</div>
          <div className="stats">
            {[
              ["Total Localizations", count("text") + count("script")],
              ["Text Localizations", count("text")],
              ["Script Localizations", count("script")],
              ["Audio Sessions", count("audio")],
              ["Video Sessions", count("video")],
            ].map(([n, v]) => (
              <div key={n as string}>
                <b>{v as number}</b>
                <small>{n}</small>
              </div>
            ))}
          </div>
          <div className="section-title">FEATURE USAGE</div>
          {(["text", "script", "audio", "video"] as Mode[]).map((m) => (
            <div className="bar-row" key={m}>
              <span>{m}</span>
              <i style={{ width: `${Math.min(100, count(m) * 20)}%` }} />
            </div>
          ))}
          <div className="section-title">RECENT ACTIVITY</div>
          {events.length ? (
            events
              .slice(-6)
              .reverse()
              .map((e) => (
                <p className="activity" key={e.id}>
                  <Check size={14} />
                  {e.name}
                  <small>{safeDate(e.createdAt)}</small>
                </p>
              ))
          ) : (
            <p>No activity yet.</p>
          )}
        </section>
      </div>
    </section>
  );
}
function App({ user, logout }: { user: string; logout: () => void }) {
  const [view, setView] = useState<View>("workspace");
  const [mode, setMode] = useState<Mode>("text");
  const [modal, setModal] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const open = () => setModal(true);
    window.addEventListener("unliteral:new-project", open);
    return () => window.removeEventListener("unliteral:new-project", open);
  }, []);
  const addEvent = (mode: Mode, name: string) => {
    const event = {
      id: uid(),
      mode,
      name,
      createdAt: new Date().toISOString(),
    };
    writeStored("unliteral-events", [
      ...readStored<Event[]>("unliteral-events", []),
      event,
    ]);
  };
  const saveProject = (contentType: Mode) => {
    const name = window.prompt("Project name");
    if (!name?.trim()) return;
    const now = new Date().toISOString();
    const project = {
      id: uid(),
      name: name.trim(),
      contentType,
      createdAt: now,
      updatedAt: now,
    };
    writeStored("unliteral-projects", [
      ...readStored<Project[]>("unliteral-projects", []),
      project,
    ]);
    addEvent(contentType, "Project created");
  };
  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar
        view={view}
        setView={setView}
        user={user}
        logout={logout}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <main className="main">
        <header className="mobile-head">
          <button
            className="brand-button"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Brand />
          </button>
          <button
            className="icon-btn"
            aria-label="Open menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu />
          </button>
        </header>
        {view === "workspace" && (
          <section className="workspace">
            <div className="mode-tabs">
              {(["text", "script", "audio", "video"] as Mode[]).map((m) => (
                <button
                  key={m}
                  className={mode === m ? "mode-tab active" : "mode-tab"}
                  onClick={() => setMode(m)}
                >
                  {m}
                </button>
              ))}
            </div>
            {mode === "text" || mode === "script" ? (
              <TextWorkspace
                mode={mode}
                addEvent={addEvent}
                saveProject={saveProject}
              />
            ) : (
              <MediaWorkspace
                mode={mode}
                addEvent={addEvent}
                saveProject={saveProject}
              />
            )}
          </section>
        )}
        {view === "history" && <HistoryPage />}
        {view === "reviews" && <ReviewsPage />}
        {view === "settings" && <SettingsPage />}
        {view === "account" && <AccountPage />}
      </main>
      {modal && (
        <NewProjectModal
          close={() => setModal(false)}
          choose={(m) => {
            setMode(m);
            setView("workspace");
            setModal(false);
          }}
        />
      )}
    </div>
  );
}
export default function Page() {
  const [user, setUser] = useState<string | null>(null);
  const [auth, setAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");
  useEffect(() => setUser(localStorage.getItem("unliteral-user")), []);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const continueToStudio = () => {
    if (!validEmail.test(email)) {
      setAuthError("Please enter a valid email address.");
      return;
    }
    const displayName = name || email.split("@")[0] || "User";
    localStorage.setItem("unliteral-user", displayName);
    setUser(displayName);
  };
  if (!user)
    return auth ? (
      <main className="auth-page">
        <div className="auth-panel">
          <Brand />
          <h1>Start translating.</h1>
          <label>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Email
            <input
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setAuthError("");
              }}
              type="email"
              required
            />
            <small className="error-note">
              {email && !validEmail.test(email)
                ? "Please enter a valid email address."
                : ""}
            </small>
          </label>
          <button
            className="gold-btn full"
            disabled={!validEmail.test(email)}
            onClick={continueToStudio}
          >
            Continue <ArrowRight size={15} />
          </button>
          {authError && <p className="error-note">{authError}</p>}
        </div>
      </main>
    ) : (
      <main className="landing">
        <header>
          <Brand />
        </header>
        <section className="hero">
          <span className="eyebrow">
            CULTURAL INTELLIGENCE FOR STORYTELLERS
          </span>
          <h1>
            Translate the
            <br />
            <em>culture,</em> not just
            <br />
            the words.
          </h1>
          <p>
            Dialogue that sounds like it was born there. UNLITERAL adapts slang,
            humour, subtext, and character voice for every audience.
          </p>
          <button className="gold-btn" onClick={() => setAuth(true)}>
            Enter the studio <ArrowRight size={15} />
          </button>
        </section>
      </main>
    );
  return (
    <App
      user={user}
      logout={() => {
        localStorage.removeItem("unliteral-user");
        setUser(null);
      }}
    />
  );
}

export { safeDate };
