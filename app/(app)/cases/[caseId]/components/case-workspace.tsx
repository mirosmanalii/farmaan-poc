"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  FileText,
  Folder,
  Loader2,
  MoreHorizontal,
  StickyNote,
  Trash2,
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
  storage_path: string;
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
  const [selectedDocumentIds, setSelectedDocumentIds] =
    useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingDocuments, setLoadingDocuments] =
    useState(true);
  const [uploading, setUploading] = useState(false);
  const [openingDocumentId, setOpeningDocumentId] =
    useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState(false);
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
        "id, name, storage_path, file_type, file_size, uploaded_at"
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
    setSelectedDocumentIds([]);
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

  function toggleDocumentSelection(documentId: string) {
    setSelectedDocumentIds((currentIds) => {
      if (currentIds.includes(documentId)) {
        return currentIds.filter((id) => id !== documentId);
      }

      return [...currentIds, documentId];
    });
  }

  function toggleSelectAll() {
    if (selectedDocumentIds.length === documents.length) {
      setSelectedDocumentIds([]);
      return;
    }

    setSelectedDocumentIds(
      documents.map((document) => document.id)
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

  async function handleOpenDocument(
    document: DocumentItem
  ) {
    setOpeningDocumentId(document.id);
    setError("");

    try {
      const { data, error: signedUrlError } =
        await supabase.storage
          .from("case-documents")
          .createSignedUrl(document.storage_path, 300);

      if (signedUrlError || !data?.signedUrl) {
        throw new Error(
          signedUrlError?.message ??
            "Could not create a secure document URL."
        );
      }

      window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (documentError) {
      setError(
        documentError instanceof Error
          ? documentError.message
          : "Could not open the document."
      );
    } finally {
      setOpeningDocumentId(null);
    }
  }

  async function handleDeleteDocuments() {
    if (selectedDocumentIds.length === 0) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const documentsToDelete = documents.filter(
        (document) =>
          selectedDocumentIds.includes(document.id)
      );

      const storagePaths = documentsToDelete.map(
        (document) => document.storage_path
      );

      const { error: storageError } =
        await supabase.storage
          .from("case-documents")
          .remove(storagePaths);

      if (storageError) {
        throw new Error(
          `Could not delete the document files: ${storageError.message}`
        );
      }

      const { error: databaseError } = await supabase
        .from("documents")
        .delete()
        .in("id", selectedDocumentIds)
        .eq("case_id", caseId);

      if (databaseError) {
        throw new Error(
          `The files were removed, but their metadata could not be deleted: ${databaseError.message}`
        );
      }

      setSelectedDocumentIds([]);
      setShowDeleteConfirmation(false);

      await loadDocuments();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Something went wrong while deleting the documents."
      );
    } finally {
      setDeleting(false);
    }
  }

  const allDocumentsSelected =
    documents.length > 0 &&
    selectedDocumentIds.length === documents.length;

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

      {/* Selected files waiting for upload */}
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

      {/* Bulk selection toolbar */}
      {selectedDocumentIds.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-2.5">
          <span className="text-sm font-medium">
            {selectedDocumentIds.length} selected
          </span>

          <button
            type="button"
            onClick={() => setShowDeleteConfirmation(true)}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            <Trash2 className="size-4" />
            Delete
          </button>
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
            {/* Table header */}
            <div className="grid grid-cols-[44px_minmax(0,1fr)_120px_120px_140px_44px] items-center border-b bg-muted/30 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <div>
                <input
                  type="checkbox"
                  checked={allDocumentsSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all documents"
                  className="size-4 rounded border-input"
                />
              </div>

              <div>Name</div>
              <div>Type</div>
              <div>Size</div>
              <div>Uploaded</div>
              <div />
            </div>

            {/* Document rows */}
            <div>
              {documents.map((document) => {
                const isSelected =
                  selectedDocumentIds.includes(document.id);

                const isOpening =
                  openingDocumentId === document.id;

                return (
                  <div
                    key={document.id}
                    className={`grid grid-cols-[44px_minmax(0,1fr)_120px_120px_140px_44px] items-center border-b px-4 py-3 last:border-b-0 ${
                      isSelected
                        ? "bg-muted/50"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    {/* Checkbox */}
                    <div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          toggleDocumentSelection(
                            document.id
                          )
                        }
                        aria-label={`Select ${document.name}`}
                        className="size-4 rounded border-input"
                      />
                    </div>

                    {/* Name */}
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenDocument(document)
                      }
                      disabled={isOpening}
                      className="flex min-w-0 items-center gap-3 text-left hover:underline disabled:cursor-wait"
                    >
                      {isOpening ? (
                        <Loader2 className="size-4 shrink-0 animate-spin" />
                      ) : (
                        <FileText className="size-4 shrink-0" />
                      )}

                      <span className="truncate text-sm font-medium">
                        {document.name}
                      </span>
                    </button>

                    {/* Type */}
                    <div className="text-sm text-muted-foreground">
                      PDF
                    </div>

                    {/* Size */}
                    <div className="text-sm text-muted-foreground">
                      {formatFileSize(document.file_size)}
                    </div>

                    {/* Uploaded */}
                    <div className="text-sm text-muted-foreground">
                      {formatDate(document.uploaded_at)}
                    </div>

                    {/* Individual actions placeholder */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label={`More actions for ${document.name}`}
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-destructive/10 p-2">
                <Trash2 className="size-5 text-destructive" />
              </div>

              <div className="min-w-0">
                <h3 className="font-semibold">
                  Delete{" "}
                  {selectedDocumentIds.length === 1
                    ? "document"
                    : "documents"}
                  ?
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  This will permanently remove the selected{" "}
                  {selectedDocumentIds.length === 1
                    ? "document"
                    : "documents"}{" "}
                  from this case.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowDeleteConfirmation(false)
                }
                disabled={deleting}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteDocuments}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleting && (
                  <Loader2 className="size-4 animate-spin" />
                )}

                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
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