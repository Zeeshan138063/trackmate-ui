import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Contact } from "@/types/contact";

const TEMPLATE_HEADERS = [
  "first_name","last_name","email","phone","title","company","department","contact_type","seniority_level",
  "linkedin_url","twitter_url","github_url","personal_website","how_we_met","relationship_strength",
  "last_contact_date","next_follow_up_date","communication_frequency","notes","tags"
];

// Valid values for enum fields
const VALID_HOW_WE_MET = ['job_application', 'networking_event', 'referral', 'linkedin', 'twitter', 'github', 'personal_website', 'conference', 'cold_outreach', 'other'];
const VALID_CONTACT_TYPE = ['recruiter', 'hiring_manager', 'employee', 'referral', 'networking', 'other'];
const VALID_SENIORITY_LEVEL = ['junior', 'mid', 'senior', 'director', 'vp', 'c_level'];
const VALID_RELATIONSHIP_STRENGTH = ['cold', 'warm', 'strong', 'advocate'];
const VALID_COMMUNICATION_FREQUENCY = ['weekly', 'monthly', 'quarterly', 'as_needed'];

function toCSV(rows: string[][]): string {
  const escape = (v: string) => {
    if (v == null) return "";
    const hasSpecial = /[",\n]/.test(v);
    const escaped = v.replace(/"/g, '""');
    return hasSpecial ? `"${escaped}"` : escaped;
  };
  return rows.map(r => r.map(c => escape(c ?? "")).join(",")).join("\n");
}

function parseCSV(text: string): string[][] {
  // Minimal CSV parser supporting quotes and commas
  const rows: string[][] = [];
  let i = 0; const len = text.length; let row: string[] = []; let cell = ""; let inQuotes = false;
  while (i < len) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i+1] === '"') { cell += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      } else { cell += ch; i++; continue; }
    } else {
      if (ch === '"') { inQuotes = true; i++; continue; }
      if (ch === ',') { row.push(cell); cell = ""; i++; continue; }
      if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ""; i++; continue; }
      if (ch === '\r') { i++; continue; }
      cell += ch; i++; continue;
    }
  }
  row.push(cell); rows.push(row);
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0].trim() !== ""));
}

function buildTemplateCSV(): string {
  const sampleRow = [
    "Jane","Doe","jane@example.com","+15551234567","Recruiter","Acme Inc","HR","recruiter","senior",
    "https://linkedin.com/in/jane","https://twitter.com/jane","https://github.com/jane","https://janedoe.dev","networking_event","warm",
    "2025-08-01","2025-09-01","monthly","Met at conf","hiring,referral"
  ];
  return toCSV([TEMPLATE_HEADERS, sampleRow]);
}

function validateEnumValue(value: string, validValues: string[], fieldName: string): string {
  const normalized = value.toLowerCase().trim();
  if (validValues.includes(normalized)) {
    return normalized;
  }
  
  throw new Error(`Invalid ${fieldName}: "${value}". Valid values are: ${validValues.join(', ')}`);
}

type Props = {
  onCompleted?: () => void;
};

export const BulkUploadDialog = ({ onCompleted }: Props) => {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const downloadTemplate = () => {
    const csv = buildTemplateCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "contacts_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    if (!user) return;
    setProcessing(true);
    try {
      const text = await selectedFile.text();
      const rows = parseCSV(text);
      if (rows.length === 0) throw new Error("Empty CSV");
      // Ensure headers
      const headers = rows[0].map(h => h.trim());
      const dataRows = rows.slice(1);
      const headerIndex: Record<string, number> = {};
      TEMPLATE_HEADERS.forEach(h => {
        const idx = headers.findIndex(x => x.toLowerCase() === h.toLowerCase());
        headerIndex[h] = idx;
      });

      const report: string[][] = [[...headers, "Processed"]];

      for (const r of dataRows) {
        const get = (h: string) => {
          const idx = headerIndex[h];
          return idx >= 0 ? (r[idx] ?? "").trim() : "";
        };

        try {
          const tagsString = get("tags");
          const contact: Omit<Contact, "id" | "user_id" | "created_at" | "updated_at"> = {
            first_name: get("first_name"),
            last_name: get("last_name"),
            email: get("email") || undefined,
            phone: get("phone") || undefined,
            title: get("title"),
            company: get("company"),
            department: get("department") || undefined,
            contact_type: validateEnumValue(get("contact_type") || "other", VALID_CONTACT_TYPE, "contact_type") as Contact["contact_type"],
            seniority_level: get("seniority_level") ? validateEnumValue(get("seniority_level"), VALID_SENIORITY_LEVEL, "seniority_level") as Contact["seniority_level"] : undefined,
            linkedin_url: get("linkedin_url") || undefined,
            twitter_url: get("twitter_url") || undefined,
            github_url: get("github_url") || undefined,
            personal_website: get("personal_website") || undefined,
            how_we_met: get("how_we_met") ? validateEnumValue(get("how_we_met"), VALID_HOW_WE_MET, "how_we_met") as Contact["how_we_met"] : undefined,
            relationship_strength: validateEnumValue(get("relationship_strength") || "cold", VALID_RELATIONSHIP_STRENGTH, "relationship_strength") as Contact["relationship_strength"],
            last_contact_date: get("last_contact_date") || undefined,
            next_follow_up_date: get("next_follow_up_date") || undefined,
            communication_frequency: get("communication_frequency") ? validateEnumValue(get("communication_frequency"), VALID_COMMUNICATION_FREQUENCY, "communication_frequency") as Contact["communication_frequency"] : undefined,
            notes: get("notes") || undefined,
            tags: tagsString ? tagsString.split(/\s*,\s*/).filter(Boolean) : [],
          };

          // Basic required checks
          if (!contact.first_name || !contact.last_name || !contact.title || !contact.company) {
            report.push([...r, "Fail: Missing required fields (first_name, last_name, title, company)"]);
            continue;
          }

          // Try to find existing by email (preferred) or phone for current user
          let existingId: string | null = null;
          if (contact.email) {
            const { data } = await supabase
              .from("contacts")
              .select("id")
              .eq("user_id", user.id)
              .eq("email", contact.email)
              .limit(1)
              .maybeSingle();
            existingId = data?.id ?? null;
          }
          if (!existingId && contact.phone) {
            const { data } = await supabase
              .from("contacts")
              .select("id")
              .eq("user_id", user.id)
              .eq("phone", contact.phone)
              .limit(1)
              .maybeSingle();
            existingId = data?.id ?? null;
          }

          if (existingId) {
            const { error } = await supabase
              .from("contacts")
              .update(contact)
              .eq("id", existingId)
              .eq("user_id", user.id);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from("contacts")
              .insert({ ...contact, user_id: user.id });
            if (error) throw error;
          }
          report.push([...r, "Success"]);
        } catch (err: any) {
          report.push([...r, `Fail: ${err?.message || "Unknown error"}`]);
          continue;
        }
      }

      // Download processed report
      const reportCSV = toCSV(report);
      const blob = new Blob([reportCSV], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "contacts_processed_report.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Bulk upload complete", description: "Processed file downloaded with statuses" });
      setOpen(false);
      setSelectedFile(null);
      onCompleted?.();
    } catch (e: any) {
      toast({ title: "Bulk upload failed", description: e?.message || "Could not process file", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Bulk Upload</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Upload Contacts from Google Sheets/CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              1) Download the template CSV. 2) Fill it in Google Sheets. 3) From Google Sheets, use File → Download → Comma-separated values (.csv), then upload here.
            </p>
            <Button onClick={downloadTemplate} variant="outline">Download Template (CSV)</Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="csvFile">Upload CSV exported from Google Sheets</Label>
            <Input id="csvFile" type="file" accept=".csv,text/csv" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Required columns:</span>
            <code className="px-2 py-1 bg-muted rounded">first_name,last_name,title,company</code>
          </div>
          <div className="text-xs text-muted-foreground">
            Optional columns: {TEMPLATE_HEADERS.filter(h => !["first_name","last_name","title","company"].includes(h)).join(", ")}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!selectedFile || processing} onClick={handleProcess}>
              {processing ? "Processing..." : "Process & Import"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadDialog;


