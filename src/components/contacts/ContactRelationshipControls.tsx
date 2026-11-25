import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Contact } from "@/types/contact";
import { ROLE_LABELS, ROLE_TYPES, type RoleType, STAGE_LABELS, WARMTH_STAGES, type WarmthStage } from "@/utils/contact-next-action";

interface Props {
    contact: Contact;
    /** Saves the change. The caller reports failure to the user (P10). */
    onUpdate: (id: string, updates: Partial<Contact>) => Promise<unknown>;
}

/** Stage, role type and do-not-contact for one contact (REQ-003: AC-1, AC-2, AC-9). */
export function ContactRelationshipControls({ contact, onUpdate }: Props) {
    const doNotContact = contact.relationship_stage === "do_not_contact";

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg border bg-muted/20">
            <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Warmth stage</Label>
                <Select
                    value={contact.warmth_stage ?? "identified"}
                    onValueChange={(v) => onUpdate(contact.id, { warmth_stage: v as WarmthStage })}
                >
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {WARMTH_STAGES.map((s) => <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Role type</Label>
                <Select
                    value={contact.role_type ?? "other"}
                    onValueChange={(v) => onUpdate(contact.id, { role_type: v as RoleType })}
                >
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {ROLE_TYPES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor={`dnc-${contact.id}`} className="text-xs text-muted-foreground">Do not contact</Label>
                <div className="flex items-center gap-2 h-9">
                    <Switch
                        id={`dnc-${contact.id}`}
                        checked={doNotContact}
                        onCheckedChange={(checked) =>
                            onUpdate(contact.id, { relationship_stage: checked ? "do_not_contact" : "active" })
                        }
                    />
                    <span className="text-xs text-muted-foreground">
                        {doNotContact ? "No prompts or follow-ups" : "Off"}
                    </span>
                </div>
            </div>
        </div>
    );
}
