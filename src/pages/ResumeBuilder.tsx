import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useResume } from "@/hooks/useResume";
import { MasterProfileEditor } from "@/components/resume/MasterProfileEditor";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { ResumeImporter } from "@/components/resume/ResumeImporter";
import { Loader2, Printer, Sparkles, Save, CheckCircle2, Share2 } from "lucide-react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MasterProfile, ResumeConfig, initialResumeConfig } from "@/types/resume";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutList } from "lucide-react";

export default function ResumeBuilder() {
  const { masterProfile, loading, saving, saveMasterProfile, resumeId } = useResume();
  const [liveData, setLiveData] = useState<MasterProfile | null>(null);
  const [editorVersion, setEditorVersion] = useState(0);
  const [config, setConfig] = useState<ResumeConfig>(initialResumeConfig);

  // Sync live data when master profile loads initially
  useEffect(() => {
    if (masterProfile && !liveData) {
      setLiveData(masterProfile);
    }
  }, [masterProfile, liveData]);

  if (loading || !masterProfile) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading Master Profile...</span>
      </div>
    );
  }

  // Use liveData for preview if available, otherwise fall back to saved profile
  const previewData = liveData || masterProfile;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden animate-in fade-in-50 duration-500">
      <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
        {/* Helper Panel: Editor */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full bg-background p-4 md:p-8 flex flex-col overflow-hidden">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Master Profile</h2>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {saving ? (
                  <span className="text-[10px] text-muted-foreground animate-pulse flex items-center gap-1">
                    <Save className="h-3 w-3" /> Saving...
                  </span>
                ) : (
                  <span className="text-[10px] text-green-600 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Saved
                  </span>
                )}
                <ResumeImporter onImport={(importedData) => {
                  setLiveData(importedData);
                  // Update version to force re-render of Editor with new data
                  setEditorVersion(v => v + 1);
                }} />
              </div>
            </div>

            <ScrollArea className="flex-1 -mx-4 px-4">
              <div className="pb-6">
                <MasterProfileEditor
                  key={liveData ? `imported-${editorVersion}` : 'initial'}
                  profile={liveData || masterProfile}
                  resumeId={resumeId}
                  onSave={saveMasterProfile}
                  onLiveUpdate={setLiveData}
                  isSaving={saving}
                />
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Preview Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full bg-muted/30 p-4 md:p-8 overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Live Preview</h3>
                  <div className="text-xs text-muted-foreground">
                    Updates as you type
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <LayoutList className="h-4 w-4 text-muted-foreground" />
                    <Select
                      value={config.templateId}
                      onValueChange={(value) => setConfig(prev => ({ ...prev, templateId: value as any }))}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
                        <SelectValue placeholder="Select Template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ats">ATS Classic</SelectItem>
                        <SelectItem value="europass">Europass</SelectItem>
                        <SelectItem value="modern">Modern (Reactive)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 bg-background shadow-sm hover:text-indigo-600"
                      onClick={() => {
                        const baseUrl = 'https://careerpilot.ai';
                        const text = `I just updated my resume using CareerPilot AI! Check out this awesome AI career assistant that helps you track jobs and build a technical profile. #career #jobs #careerpilot`;
                        const shareUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text + " " + baseUrl)}`;
                        window.open(shareUrl, '_blank', 'width=600,height=600');
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2 bg-background shadow-sm hover:bg-accent hover:text-accent-foreground" onClick={handlePrint}>
                      <Printer className="h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto rounded-lg border bg-zinc-100/50 dark:bg-zinc-900/50 shadow-inner p-4 md:p-8 flex justify-center relative">
                <div className="w-full max-w-[8.5in]">
                  <ResumePreview data={previewData} config={config} className="min-h-[11in]" />
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Print Portal - Renders outside the main layout for clean printing */}
      {createPortal(
        <div id="resume-print-portal" className="hidden print:block">
          <ResumePreview data={previewData} config={config} />
        </div>,
        document.body
      )}
    </div>
  );
}