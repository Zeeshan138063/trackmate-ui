
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
    const [rolesInput, setRolesInput] = useState("");
    const [tagsInput, setTagsInput] = useState("");
    const [linkedinUrl, setLinkedinUrl] = useState(""); // Local state for LinkedIn

    const [formData, setFormData] = useState<Partial<DreamCompanyInsert>>({
        name: "",
        priority: "Medium",
        status: "Researching",
        notes: "",
        industry: "",
        company_size: "", // Changed to string for free text
        website_url: "",
        logo_url: "",
        careers_page_url: "",
        location: "",
    });

    const handleChange = (field: keyof DreamCompanyInsert, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        setIsLoading(true);
        try {
            const { data: { user } } = await import("@/integrations/supabase/client").then(m => m.supabase.auth.getUser());
            if (!user) {
                toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
                return;
            }

            // Process array inputs
            const target_roles = rolesInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
            const tags = tagsInput.split(',').map(s => s.trim()).filter(s => s.length > 0);

            // Construct social_media object
            const social_media = linkedinUrl ? { linkedin: linkedinUrl } : null;

            await dreamCompaniesService.create({
                ...formData,
                target_roles: target_roles.length > 0 ? target_roles : null,
                tags: tags.length > 0 ? tags : null,
                social_media: social_media,
                user_id: user.id,
            } as DreamCompanyInsert);

            toast({ title: "Success", description: "Dream company added!" });
            onSuccess();
            onOpenChange(false);

            // Reset form
            setFormData({
                name: "", priority: "Medium", status: "Researching", notes: "", industry: "",
                website_url: "", location: "", logo_url: "", careers_page_url: "",
                company_size: "", job_board_url: "", offers_remote: false,
                offers_relocation: false, offers_visa_sponsorship: false,
                offers_referral: false, keywords: []
            });
            setRolesInput("");
            setTagsInput("");
            setLinkedinUrl("");
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
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
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
                            {/* Changed to Input for free text */}
                            <Input
                                id="size"
                                value={formData.company_size || ""}
                                onChange={(e) => handleChange("company_size", e.target.value)}
                                placeholder="e.g. 50-200, Enterprise"
                            />
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
                                    <SelectItem value="Rejected">Rejected</SelectItem>
                                    <SelectItem value="On Hold">On Hold</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="website">Website URL</Label>
                            <Input
                                id="website"
                                value={formData.website_url || ""}
                                onChange={(e) => handleChange("website_url", e.target.value)}
                                placeholder="https://example.com"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="careers">Careers Page URL</Label>
                            <Input
                                id="careers"
                                value={formData.careers_page_url || ""}
                                onChange={(e) => handleChange("careers_page_url", e.target.value)}
                                placeholder="https://.../careers"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="linkedin">LinkedIn URL</Label>
                            <Input
                                id="linkedin"
                                value={linkedinUrl}
                                onChange={(e) => setLinkedinUrl(e.target.value)}
                                placeholder="https://linkedin.com/company/..."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="logo">Logo URL (Optional)</Label>
                            <Input
                                id="logo"
                                value={formData.logo_url || ""}
                                onChange={(e) => handleChange("logo_url", e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="remote"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={formData.offers_remote || false}
                                onChange={(e) => handleChange("offers_remote", e.target.checked)}
                            />
                            <Label htmlFor="remote">Offers Remote</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="referral"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={formData.offers_referral || false}
                                onChange={(e) => handleChange("offers_referral", e.target.checked)}
                            />
                            <Label htmlFor="referral">Offers Referral</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="relocation"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={formData.offers_relocation || false}
                                onChange={(e) => handleChange("offers_relocation", e.target.checked)}
                            />
                            <Label htmlFor="relocation">Relocation Assistance</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="visa"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={formData.offers_visa_sponsorship || false}
                                onChange={(e) => handleChange("offers_visa_sponsorship", e.target.checked)}
                            />
                            <Label htmlFor="visa">Visa Sponsor</Label>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="job_board">Job Board URL</Label>
                        <Input
                            id="job_board"
                            value={formData.job_board_url || ""}
                            onChange={(e) => handleChange("job_board_url", e.target.value)}
                            placeholder="https://.../jobs"
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
                            Show More Details (Location, Careers Page, Roles, Keywords)
                        </Button>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <Separator />
                            <div className="grid gap-2">
                                <Label htmlFor="locations">HQ Location</Label>
                                <Input
                                    id="locations"
                                    value={typeof formData.location === 'string' ? formData.location : ""}
                                    onChange={(e) => handleChange("location", e.target.value)}
                                    placeholder="e.g. San Francisco, CA"
                                />
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
                                    placeholder="e.g. High Growth, Series B (comma separated)"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="keywords">Job Keywords (Search optimization)</Label>
                                <Input
                                    id="keywords"
                                    value={formData.keywords?.join(", ") || ""}
                                    onChange={(e) => handleChange("keywords", e.target.value.split(",").map(s => s.trim()))}
                                    placeholder="e.g. Python, distributed systems, React"
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
