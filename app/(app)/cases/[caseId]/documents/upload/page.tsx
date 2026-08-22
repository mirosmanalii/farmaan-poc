"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export default function UploadDocumentPage() {
  const params = useParams<{ caseId: string }>();
  const router = useRouter();

  const caseId = params.caseId;

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setError("");

    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      setFile(null);
      setError("Only PDF files can be uploaded.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("The PDF must be smaller than 25 MB.");
      return;
    }

    setFile(selectedFile);
  }

  async function handleUpload() {
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be signed in to upload documents.");
      }

      /*
       * Get the user's organization.
       */
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

      /*
       * Verify that the case belongs to the user's organization.
       */
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

      /*
       * Determine the display filename.
       *
       * Example:
       * petition.pdf
       * petition.pdf (1)
       * petition.pdf (2)
       */
      const displayName = await getUniqueDisplayName(
        supabase,
        caseId,
        file.name
      );

      /*
       * Generate a unique physical Storage filename.
       *
       * The user-facing name and Storage object name are
       * intentionally different.
       */
      const storageFileName = `${crypto.randomUUID()}.pdf`;

      const storagePath = `${profile.organization_id}/${caseId}/${storageFileName}`;

      /*
       * Upload the actual PDF.
       */
      const { error: uploadError } =
        await supabase.storage
          .from("case-documents")
          .upload(storagePath, file, {
            contentType: "application/pdf",
            upsert: false,
          });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      /*
       * Save document metadata.
       */
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
        /*
         * If the database insert fails after the Storage upload,
         * attempt to remove the orphaned Storage object.
         */
        await supabase.storage
          .from("case-documents")
          .remove([storagePath]);

        throw new Error(documentError.message);
      }

      router.push(`/cases/${caseId}/documents`);
      router.refresh();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Something went wrong while uploading the document."
      );

      setUploading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-2xl">
        {/* Back navigation */}
        <div className="mb-6">
          <Link
            href={`/cases/${caseId}/documents`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Documents
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Upload PDF
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Add a PDF document to this case.
          </p>
        </div>

        {/* Upload area */}
        <div className="rounded-xl border bg-card p-6">
          <label
            htmlFor="document"
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors hover:bg-muted/50"
          >
            <Upload className="size-8 text-muted-foreground" />

            <h2 className="mt-4 font-medium">
              Select a PDF
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              PDF files up to 25 MB
            </p>

            <input
              id="document"
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              className="sr-only"
              disabled={uploading}
            />
          </label>

          {/* Selected file */}
          {file && (
            <div className="mt-5 flex items-center gap-3 rounded-lg border p-4">
              <FileText className="size-6 shrink-0" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {file.name}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3 border-t pt-6">
            <Link
              href={`/cases/${caseId}/documents`}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {uploading && (
                <Loader2 className="size-4 animate-spin" />
              )}

              {uploading ? "Uploading..." : "Upload PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

async function getUniqueDisplayName(
  supabase: ReturnType<typeof createClient>,
  caseId: string,
  originalName: string
) {
  const { data: existingDocuments, error } = await supabase
    .from("documents")
    .select("name")
    .eq("case_id", caseId);

  if (error) {
    throw new Error(
      "Could not check existing document names."
    );
  }

  const existingNames = new Set(
    existingDocuments.map((document) => document.name)
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

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}