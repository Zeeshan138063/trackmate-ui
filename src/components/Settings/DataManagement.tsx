import { useState } from "react";
import { Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { AccountDataService } from "@/services/AccountDataService";

const CONFIRM_WORD = "DELETE";

export function DataManagement() {
    const { signOut } = useAuth();
    const [exporting, setExporting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            const data = await AccountDataService.exportAll();
            AccountDataService.download(data);
            if (data.failed.length > 0) {
                toast.warning(
                    `Export downloaded, but ${data.failed.length} section(s) could not be read: ${data.failed.map(f => f.table).join(", ")}. They are listed in the file.`
                );
            } else {
                toast.success("Your data export has been downloaded.");
            }
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("The export could not be created. Please try again.");
        } finally {
            setExporting(false);
        }
    };

    const handleDelete = async () => {
        if (confirmText !== CONFIRM_WORD) return;
        setDeleting(true);
        try {
            await AccountDataService.deleteAccount();
            toast.success("Your account and data have been deleted.");
            await signOut();
            window.location.assign("/auth");
        } catch (error) {
            console.error("Account deletion failed:", error);
            toast.error("Your account could not be deleted. Nothing was closed; please try again.");
            setDeleting(false);
        }
    };

    return (
        <>
            <div>
                <h4 className="font-medium mb-4">Export Data</h4>
                <p className="text-sm text-muted-foreground mb-4">
                    Download a copy of your data as a JSON file: applications, contacts, companies, resumes,
                    meetings and settings. Saved passwords, tokens and API keys are left out.
                </p>
                <Button variant="outline" onClick={handleExport} disabled={exporting}>
                    {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    {exporting ? "Preparing export..." : "Export All Data"}
                </Button>
            </div>

            <div>
                <h4 className="font-medium mb-4">Delete Account</h4>
                <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                    Export your data first if you want a copy.
                </p>
                <AlertDialog
                    open={dialogOpen}
                    onOpenChange={(open) => {
                        if (deleting) return;
                        setDialogOpen(open);
                        if (!open) setConfirmText("");
                    }}
                >
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This removes your applications, contacts, companies, resumes, meetings, connected
                                inboxes and settings, then closes your account. It cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-delete">Type {CONFIRM_WORD} to confirm</Label>
                            <Input
                                id="confirm-delete"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                autoComplete="off"
                                disabled={deleting}
                            />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={deleting || confirmText !== CONFIRM_WORD}
                            >
                                {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                {deleting ? "Deleting..." : "Delete everything"}
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </>
    );
}
