
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dreamCompaniesService, DreamCompanyInsert } from "@/services/dreamCompanies";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";

interface DreamCompanyModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function DreamCompanyModal({ open, onOpenChange, onSuccess }: DreamCompanyModalProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Local state for array inputs (comma separated strings)
    const [locationsInput, setLocationsInput] = useState("");
    const [rolesInput, setRolesInput] = useState("");
    const [tagsInput, setTagsInput] = useState("");

    const [formData, setFormData] = useState<Partial<DreamCompanyInsert>>({
        company_name: "",
        priority: "Medium",
        status: "Researching",
        notes: "",
        industry: "",
        company_size: null,
        website_url: "",
        careers_page_url: "",
        linkedin_company_url: "",
    });

    const handleChange = (field: keyof DreamCompanyInsert, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.company_name) return;

        setIsLoading(true);
        try {
            const { data: { user } } = await import("@/integrations/supabase/client").then(m => m.supabase.auth.getUser());
            if (!user) {
                toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
                return;
            }

            // Process array inputs
            const locations = locationsInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
            const target_roles = rolesInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
            const tags = tagsInput.split(',').map(s => s.trim()).filter(s => s.length > 0);

            await dreamCompaniesService.create({
                ...formData,
                locations: locations.length > 0 ? locations : null,
                target_roles: target_roles.length > 0 ? target_roles : null,
                tags: tags.length > 0 ? tags : null,
                user_id: user.id,
            } as DreamCompanyInsert);

            toast({ title: "Success", description: "Dream company added!" });
            onSuccess();
            onOpenChange(false);

            // Reset form
            setFormData({ company_name: "", priority: "Medium", status: "Researching", notes: "", industry: "", website_url: "" });
            setLocationsInput("");
            setRolesInput("");
            setTagsInput("");
            setShowAdvanced(false);

        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Dream Company</DialogTitle>
                    <DialogDescription>
                        Add a company to your target list.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Company Name *</Label>
                        <Input
                            id="name"
                            value={formData.company_name}
                            onChange={(e) => handleChange("company_name", e.target.value)}
                            placeholder="e.g. Google, Acme Corp"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="industry">Industry</Label>
                            <Input
                                id="industry"
                                value={formData.industry || ""}
                                onChange={(e) => handleChange("industry", e.target.value)}
                                placeholder="e.g. Tech, Finance"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="size">Company Size</Label>
                            <Select value={formData.company_size || ""} onValueChange={(v) => handleChange("company_size", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Startup">Startup</SelectItem>
                                    <SelectItem value="SMB">SMB</SelectItem>
                                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select value={formData.priority || "Medium"} onValueChange={(v) => handleChange("priority", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={formData.status || "Not Contacted"} onValueChange={(v) => handleChange("status", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Not Contacted">Not Contacted</SelectItem>
                                    <SelectItem value="Researching">Researching</SelectItem>
                                    <SelectItem value="Networking">Networking</SelectItem>
                                    <SelectItem value="Applied">Applied</SelectItem>
                                    <SelectItem value="Interviewing">Interviewing</SelectItem>
                                    <SelectItem value="Offer">Offer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="website">Website URL</Label>
                        <Input
                            id="website"
                            value={formData.website_url || ""}
                            onChange={(e) => handleChange("website_url", e.target.value)}
                            placeholder="https://example.com"
                        />
                    </div>

                    {!showAdvanced ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full text-muted-foreground"
                            onClick={() => setShowAdvanced(true)}
                        >
                            Show Advanced Fields (Locations, Socials, Roles)
                        </Button>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <Separator />
                            <div className="grid gap-2">
                                <Label htmlFor="locations">Locations</Label>
                                <Input
                                    id="locations"
                                    value={locationsInput}
                                    onChange={(e) => setLocationsInput(e.target.value)}
                                    placeholder="e.g. San Francisco, New York, Remote (comma separated)"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="careers">Careers Page URL</Label>
                                    <Input
                                        id="careers"
                                        value={formData.careers_page_url || ""}
                                        onChange={(e) => handleChange("careers_page_url", e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="linkedin">LinkedIn URL</Label>
                                    <Input
                                        id="linkedin"
                                        value={formData.linkedin_company_url || ""}
                                        onChange={(e) => handleChange("linkedin_company_url", e.target.value)}
                                        placeholder="https://linkedin.com/company/..."
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="roles">Target Roles</Label>
                                <Input
                                    id="roles"
                                    value={rolesInput}
                                    onChange={(e) => setRolesInput(e.target.value)}
                                    placeholder="e.g. Frontend Engineer, Product Manager (comma separated)"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="tags">Tags</Label>
                                <Input
                                    id="tags"
                                    value={tagsInput}
                                    onChange={(e) => setTagsInput(e.target.value)}
                                    placeholder="e.g. Remote, Visa Sponsor (comma separated)"
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes || ""}
                            onChange={(e) => handleChange("notes", e.target.value)}
                            placeholder="Why this company? Any specific goals?"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Adding..." : "Add Company"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
