"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  FileText,
  Folder,
  Loader2,
  StickyNote,
  Upload,
  Users,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type WorkspaceTab =
  | "overview"
  | "documents"
  | "timeline"
  | "parties"
  | "notes";

type CaseWorkspaceProps = {
  caseId: string;
  caseName: string;
};

type DocumentItem = {
  id: string;
  name: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_at: string;
};

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export default function CaseWorkspace({
  caseId,
  caseName,
}: CaseWorkspaceProps) {
  const [activeTab, setActiveTab] =
    useState<WorkspaceTab>("overview");

  const tabs = [
    {
      id: "overview" as const,
      label: "Overview",
      icon: Folder,
    },
    {
      id: "documents" as const,
      label: "Documents",
      icon: FileText,
    },
    {
      id: "timeline" as const,
      label: "Timeline",
      icon: CalendarDays,
    },
    {
      id: "parties" as const,
      label: "Parties",
      icon: Users,
    },
    {
      id: "notes" as const,
      label: "Notes",
      icon: StickyNote,
    },
  ];

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">
          Case Workspace
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage everything related to this case from one place.
        </p>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto border-b">
        <div className="flex min-w-max gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="pt-6">
        {activeTab === "overview" && <OverviewTab />}

        {activeTab === "documents" && (
          <DocumentsTab
            caseId={caseId}
            caseName={caseName}
          />
        )}

        {activeTab === "timeline" && (
          <EmptyTab
            icon={CalendarDays}
            title="Timeline"
            description="Important case events and procedural history will appear here."
          />
        )}

        {activeTab === "parties" && (
          <EmptyTab
            icon={Users}
            title="Parties"
            description="People and organizations involved in this case will appear here."
          />
        )}

        {activeTab === "notes" && (
          <EmptyTab
            icon={StickyNote}
            title="Notes"
            description="Internal case notes will appear here."
          />
        )}
      </div>
    </section>
  );
}

function OverviewTab() {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-start gap-4">
        <Folder className="mt-1 size-5 shrink-0" />

        <div>
          <h3 className="font-medium">
            Case Overview
          </h3>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Use the tabs above to manage documents, timeline events,
            parties, and internal notes without leaving the case
            workspace.
          </p>
        </div>
      </div>
    </div>
  );
}

function DocumentsTab({
  caseId,
  caseName,
}: {
  caseId: string;
  caseName: string;
}) {
  const supabase = createClient();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingDocuments, setLoadingDocuments] =
    useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDocuments();
  }, [caseId]);

  async function loadDocuments() {
    setLoadingDocuments(true);
    setError("");

    const { data, error: documentsError } = await supabase
      .from("documents")
      .select(
        "id, name, file_type, file_size, uploaded_at"
      )
      .eq("case_id", caseId)
      .order("uploaded_at", { ascending: false });

    if (documentsError) {
      setError(
        "Could not load the documents for this case."
      );
      setLoadingDocuments(false);
      return;
    }

    setDocuments(data ?? []);
    setLoadingDocuments(false);
  }

  function handleFileSelection(files: File[]) {
    setError("");

    const validFiles: File[] = [];

    for (const file of files) {
      if (file.type !== "application/pdf") {
        setError(
          `"${file.name}" is not a PDF. Only PDF files can be uploaded.`
        );
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(
          `"${file.name}" is larger than the 25 MB limit.`
        );
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSelectedFiles((currentFiles) => [
        ...currentFiles,
        ...validFiles,
      ]);
    }
  }

  function handleFileInput(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files ?? []);

    handleFileSelection(files);

    event.target.value = "";
  }

  function handleDragOver(
    event: React.DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(true);
  }

  function handleDragLeave(
    event: React.DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);
  }

  function handleDrop(
    event: React.DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files);

    handleFileSelection(files);
  }

  function removeSelectedFile(index: number) {
    setSelectedFiles((currentFiles) =>
      currentFiles.filter((_, fileIndex) => fileIndex !== index)
    );
  }

  async function handleUpload() {
    if (selectedFiles.length === 0) {
      setError("Please select at least one PDF.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "You must be signed in to upload documents."
        );
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("users")
          .select("organization_id")
          .eq("id", user.id)
          .single();

      if (profileError || !profile) {
        throw new Error(
          "Could not determine your organization."
        );
      }

      const { data: caseItem, error: caseError } =
        await supabase
          .from("cases")
          .select(
            `
              id,
              client_id,
              clients (
                organization_id
              )
            `
          )
          .eq("id", caseId)
          .single();

      if (caseError || !caseItem) {
        throw new Error("Case not found.");
      }

      const client = Array.isArray(caseItem.clients)
        ? caseItem.clients[0]
        : caseItem.clients;

      if (
        !client ||
        client.organization_id !== profile.organization_id
      ) {
        throw new Error(
          "You do not have access to this case."
        );
      }

      for (const file of selectedFiles) {
        const displayName = await getUniqueDisplayName(
          caseId,
          file.name
        );

        const storageFileName = `${crypto.randomUUID()}.pdf`;

        const storagePath = `${profile.organization_id}/${caseId}/${storageFileName}`;

        const { error: storageError } =
          await supabase.storage
            .from("case-documents")
            .upload(storagePath, file, {
              contentType: "application/pdf",
              upsert: false,
            });

        if (storageError) {
          throw new Error(
            `Could not upload "${file.name}": ${storageError.message}`
          );
        }

        const { error: documentError } = await supabase
          .from("documents")
          .insert({
            case_id: caseId,
            name: displayName,
            storage_path: storagePath,
            file_type: "application/pdf",
            file_size: file.size,
            uploaded_by: user.id,
          });

        if (documentError) {
          await supabase.storage
            .from("case-documents")
            .remove([storagePath]);

          throw new Error(
            `Could not save metadata for "${file.name}": ${documentError.message}`
          );
        }
      }

      setSelectedFiles([]);

      await loadDocuments();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Something went wrong while uploading."
      );
    } finally {
      setUploading(false);
    }
  }

  async function getUniqueDisplayName(
    currentCaseId: string,
    originalName: string
  ) {
    const { data: existingDocuments, error } =
      await supabase
        .from("documents")
        .select("name")
        .eq("case_id", currentCaseId);

    if (error) {
      throw new Error(
        "Could not check existing document names."
      );
    }

    const existingNames = new Set(
      (existingDocuments ?? []).map(
        (document) => document.name
      )
    );

    if (!existingNames.has(originalName)) {
      return originalName;
    }

    const lastDot = originalName.lastIndexOf(".");

    const baseName =
      lastDot === -1
        ? originalName
        : originalName.slice(0, lastDot);

    const extension =
      lastDot === -1
        ? ""
        : originalName.slice(lastDot);

    let counter = 1;

    while (
      existingNames.has(
        `${baseName} (${counter})${extension}`
      )
    ) {
      counter += 1;
    }

    return `${baseName} (${counter})${extension}`;
  }

  return (
    <div className="space-y-5">
      {/* Compact upload bar */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-lg border px-4 py-2.5 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-dashed hover:border-muted-foreground/50 hover:bg-muted/30"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Upload className="size-4 shrink-0 text-muted-foreground" />

          <p className="truncate text-sm text-muted-foreground">
            {isDragging
              ? "Drop PDF files here"
              : "Drag & drop PDFs here, or click to upload"}
          </p>
        </div>

        <span className="shrink-0 text-xs text-muted-foreground">
          PDF · 25 MB max
        </span>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          onChange={handleFileInput}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {/* Selected files */}
      {selectedFiles.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-medium">
              Ready to upload
            </p>

            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {uploading && (
                <Loader2 className="size-4 animate-spin" />
              )}

              {uploading
                ? "Uploading..."
                : `Upload ${selectedFiles.length} PDF${
                    selectedFiles.length === 1 ? "" : "s"
                  }`}
            </button>
          </div>

          <div className="divide-y">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <FileText className="size-4 shrink-0" />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {file.name}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeSelectedFile(index)}
                  disabled={uploading}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Document list */}
      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h3 className="text-base font-semibold">
              Documents
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              {documents.length === 0
                ? "No documents uploaded yet."
                : `${documents.length} document${
                    documents.length === 1 ? "" : "s"
                  }`}
            </p>
          </div>
        </div>

        {loadingDocuments ? (
          <div className="rounded-lg border bg-card p-6 text-center">
            <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />

            <p className="mt-2 text-sm text-muted-foreground">
              Loading documents...
            </p>
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center">
            <FileText className="mx-auto size-6 text-muted-foreground" />

            <p className="mt-3 text-sm text-muted-foreground">
              No documents uploaded yet.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border bg-card">
            <div className="grid grid-cols-[minmax(0,1fr)_120px_120px_140px] border-b bg-muted/30 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <div>Name</div>
              <div>Type</div>
              <div>Size</div>
              <div>Uploaded</div>
            </div>

            <div>
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="grid grid-cols-[minmax(0,1fr)_120px_120px_140px] items-center border-b px-4 py-3 last:border-b-0 hover:bg-muted/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="size-4 shrink-0" />

                    <span className="truncate text-sm font-medium">
                      {document.name}
                    </span>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    PDF
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {formatFileSize(document.file_size)}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {formatDate(document.uploaded_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyTab({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CalendarDays;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-10 text-center">
      <Icon className="mx-auto size-8 text-muted-foreground" />

      <h3 className="mt-4 font-medium">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatFileSize(size: number | null) {
  if (!size) {
    return "—";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}