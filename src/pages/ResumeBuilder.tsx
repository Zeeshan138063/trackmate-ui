import { useState } from "react";
import { useResume } from "@/hooks/useResume";
import { MasterProfileEditor } from "@/components/resume/MasterProfileEditor";
import { Loader2 } from "lucide-react";

export default function ResumeBuilder() {
  const { masterProfile, loading, saving, saveMasterProfile, resumeId } = useResume();

  if (loading || !masterProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading Master Profile...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in-50 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Resume System</h1>
        <p className="text-muted-foreground text-lg">
          Manage your Master Profile. This data will be used to tailor resumes for specific jobs.
        </p>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <MasterProfileEditor
          profile={masterProfile}
          resumeId={resumeId}
          onSave={saveMasterProfile}
          isSaving={saving}
        />
      </div>
    </div>
  );
}