import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Contact } from "@/types/contact";

interface AddContactDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (contact: Omit<Contact, "id" | "user_id" | "created_at">) => void;
    initialData?: Contact | null;
}

export function AddContactDialog({
    open,
    onOpenChange,
    onSave,
    initialData,
}: AddContactDialogProps) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        position: "",
        relationship: "",
        address: "",
        country: "",
        linkedin_url: "",
        notes: "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                email: initialData.email || "",
                phone: initialData.phone || "",
                company: initialData.company || "",
                position: initialData.position || "",
                relationship: initialData.relationship || "",
                address: initialData.address || "",
                country: initialData.country || "",
                linkedin_url: initialData.linkedin_url || "",
                notes: initialData.notes || "",
            });
        } else {
            // Reset form when opening new
            setFormData({
                name: "",
                email: "",
                phone: "",
                company: "",
                position: "",
                relationship: "",
                address: "",
                country: "",
                linkedin_url: "",
                notes: "",
            })
        }
    }, [initialData, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? "Edit Contact" : "Add New Contact"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="company">Company</Label>
                            <Input
                                id="company"
                                value={formData.company}
                                onChange={(e) =>
                                    setFormData({ ...formData, company: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="position">Position / Role</Label>
                            <Input
                                id="position"
                                value={formData.position}
                                onChange={(e) =>
                                    setFormData({ ...formData, position: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="relationship">Relationship (e.g., Colleague, Friend, Recruiter)</Label>
                        <Input
                            id="relationship"
                            value={formData.relationship}
                            onChange={(e) =>
                                setFormData({ ...formData, relationship: e.target.value })
                            }
                            placeholder="e.g. Ex-Colleague, Mentor"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) =>
                                    setFormData({ ...formData, phone: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn URL</Label>
                        <Input
                            id="linkedin"
                            type="url"
                            value={formData.linkedin_url}
                            onChange={(e) =>
                                setFormData({ ...formData, linkedin_url: e.target.value })
                            }
                            placeholder="https://linkedin.com/in/..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) =>
                                    setFormData({ ...formData, address: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                                id="country"
                                value={formData.country}
                                onChange={(e) =>
                                    setFormData({ ...formData, country: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData({ ...formData, notes: e.target.value })
                            }
                            placeholder="Private notes about this contact..."
                            className="resize-none"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">
                            {initialData ? "Update Contact" : "Add Contact"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
