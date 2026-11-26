import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useContacts } from "@/hooks/useContacts";
import { ContactCard } from "@/components/ContactCard";
import { AddContactDialog } from "@/components/AddContactDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUp, Plus, Search, Users, MapPin, X } from "lucide-react";
import { Contact } from "@/types/contact";
import { useFollowUps } from "@/hooks/useFollowUps";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TodayActions } from "@/components/contacts/TodayActions";
import { ImportConnectionsDialog } from "@/components/contacts/ImportConnectionsDialog";
import { InvitationMeter } from "@/components/contacts/InvitationMeter";
import { ContactDetailsDialog } from "@/components/ContactDetailsDialog";
import { AddEngagementDialog } from "@/components/AddEngagementDialog";
import { useContactActions, localToday } from "@/hooks/useContactActions";
import { useEngagements } from "@/hooks/useEngagements";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CONTACT_SORTS, importedContact, matchesLocation, matchesQuery, SORT_LABELS, sortContacts, type ContactSort } from "@/utils/contact-list";
import { addDays, ROLE_LABELS, ROLE_TYPES, STAGE_LABELS, WARMTH_STAGES } from "@/utils/contact-next-action";


/** Cards drawn at once. More are added on request, so a large network stays quick to render. */
const PAGE_SIZE = 48;

export default function Connections() {
    const { contacts, loading, addContact, addContacts, updateContact, deleteContact } = useContacts();
    const [isImportOpen, setIsImportOpen] = useState(false);
    const { followUps, fetchFollowUps } = useFollowUps(); // Fetch global pending follow-ups
    const [searchQuery, setSearchQuery] = useState("");
    const [locationQuery, setLocationQuery] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    // A saved contact being edited (has an id) or starting values for a new one (no id).
    const [editingContact, setEditingContact] = useState<Partial<Contact> | null>(null);
    const [sort, setSort] = useState<ContactSort>("next");
    const [shown, setShown] = useState(PAGE_SIZE);
    const [deleting, setDeleting] = useState<Contact | null>(null);

    // REQ-003: stages, next actions and the Today list.
    const [stageFilter, setStageFilter] = useState<string>("all");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [loggingContactId, setLoggingContactId] = useState<string | null>(null);
    const [openContactId, setOpenContactId] = useState<string | null>(null);
    const { byContact: contactActions, invitations, refresh: refreshActions } = useContactActions(contacts, followUps);
    const { addEngagement } = useEngagements();
    const openContact = contacts.find((c) => c.id === openContactId) ?? null;

    // Deep link from the daily queue (REQ-004): /connections?contact=<id> opens that contact once.
    useEffect(() => {
        const contactId = searchParams.get('contact');
        if (!contactId || loading) return;
        if (contacts.some((c) => c.id === contactId)) setOpenContactId(contactId);
        const next = new URLSearchParams(searchParams);
        next.delete('contact');
        setSearchParams(next, { replace: true });
    }, [searchParams, setSearchParams, contacts, loading]);

    const handleSnooze = (contact: Contact, days: number) =>
        updateContact(contact.id, { next_action_snoozed_until: addDays(localToday(), days) });

    const handleLogged: typeof addEngagement = async (engagement) => {
        const saved = await addEngagement(engagement);
        if (saved) {
            await Promise.all([refreshActions(), fetchFollowUps()]);
        }
        return saved;
    };

    // Hand-off from the Chrome extension: /connections?action=addContact&dataId=<id>&name=..&company=..
    // The extension's bridge answers { type, dataId, data }. It may load after this page, so ask a
    // few times; if it never answers, use the name and company the extension also put in the URL.
    useEffect(() => {
        if (searchParams.get('action') !== 'addContact') return;
        const dataId = searchParams.get('dataId');
        const params = new URLSearchParams(searchParams);
        let finished = false;

        const finish = (data: Record<string, unknown> | null) => {
            if (finished) return;
            finished = true;
            window.removeEventListener('message', handleMessage);
            clearInterval(asking);
            clearTimeout(givingUp);
            const draft = importedContact(data, params);
            if (draft) {
                setEditingContact(draft);
                setIsAddDialogOpen(true);
            }
            setSearchParams({}, { replace: true });
        };
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin || event.source !== window) return;
            const msg = event.data;
            if (msg?.type !== 'CAREERPILOT_JOB_DATA_RESPONSE' || !msg.data) return;
            if (msg.dataId && msg.dataId !== dataId) return;
            finish(msg.data);
        };
        const ask = () => {
            if (dataId) window.postMessage({ type: 'CAREERPILOT_FETCH_JOB_DATA', dataId }, window.location.origin);
        };

        window.addEventListener('message', handleMessage);
        ask();
        const asking = setInterval(ask, 500);
        const givingUp = setTimeout(() => finish(null), dataId ? 4000 : 0);
        return () => {
            finished = true;
            window.removeEventListener('message', handleMessage);
            clearInterval(asking);
            clearTimeout(givingUp);
        };
        // Runs once for the hand-off; the URL is cleared when it finishes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchFollowUps();
    }, [fetchFollowUps]);

    const filteredContacts = useMemo(() => {
        const matching = contacts.filter((contact) =>
            matchesQuery(contact, searchQuery) &&
            matchesLocation(contact, locationQuery) &&
            (stageFilter === "all" || (contact.warmth_stage ?? "identified") === stageFilter) &&
            (roleFilter === "all" || (contact.role_type ?? "other") === roleFilter));
        const dueDates = new Map<string, string>();
        for (const contact of matching) {
            const action = contactActions.get(contact.id)?.action;
            if (action && action.kind !== "none") dueDates.set(contact.id, action.dueDate);
        }
        return sortContacts(matching, sort, dueDates);
    }, [contacts, searchQuery, locationQuery, stageFilter, roleFilter, sort, contactActions]);

    const filtering = !!searchQuery.trim() || !!locationQuery.trim() || stageFilter !== "all" || roleFilter !== "all";
    const clearFilters = () => {
        setSearchQuery("");
        setLocationQuery("");
        setStageFilter("all");
        setRoleFilter("all");
    };

    // A new search starts from the first page of cards.
    useEffect(() => {
        setShown(PAGE_SIZE);
    }, [searchQuery, locationQuery, stageFilter, roleFilter, sort]);

    const handleCreateContact = async (contactData: Omit<Contact, "id" | "user_id" | "created_at">) => {
        await addContact(contactData);
    };

    const handleUpdateContact = async (contactData: Omit<Contact, "id" | "user_id" | "created_at">) => {
        if (editingContact?.id) {
            await updateContact(editingContact.id, contactData);
            setEditingContact(null);
        }
    };

    const openEditDialog = (contact: Contact) => {
        setEditingContact(contact);
        setIsAddDialogOpen(true);
    };

    return (
        <div className="container py-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Connections</h1>
                    <p className="text-muted-foreground mt-1">
                        The people in your job search: who to reach out to today, and where each relationship stands.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                        <FileUp className="mr-2 h-4 w-4" />
                        Import from LinkedIn file
                    </Button>
                    <Button onClick={() => {
                        setEditingContact(null);
                        setIsAddDialogOpen(true);
                    }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Contact
                    </Button>
                </div>
            </div>

            {!loading && (
                <TodayActions
                    contacts={contacts}
                    actions={contactActions}
                    onLog={(contact) => setLoggingContactId(contact.id)}
                    onSnooze={handleSnooze}
                    onOpen={(contact) => setOpenContactId(contact.id)}
                    onMarkInvited={(contact) => updateContact(contact.id, { invitation_sent_at: new Date().toISOString() })}
                />
            )}

            {!loading && contacts.length > 0 && <InvitationMeter usage={invitations} />}

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search name, company, role, email or notes..."
                        aria-label="Search contacts"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="relative flex-1 md:max-w-xs">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filter by location..."
                        aria-label="Filter by location"
                        value={locationQuery}
                        onChange={(e) => setLocationQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger className="md:w-44" aria-label="Filter by stage"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All stages</SelectItem>
                        {WARMTH_STAGES.map((st) => <SelectItem key={st} value={st}>{STAGE_LABELS[st]}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="md:w-44" aria-label="Filter by role type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All role types</SelectItem>
                        {ROLE_TYPES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={sort} onValueChange={(v) => setSort(v as ContactSort)}>
                    <SelectTrigger className="md:w-44" aria-label="Sort contacts"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {CONTACT_SORTS.map((key) => <SelectItem key={key} value={key}>Sort: {SORT_LABELS[key]}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {!loading && contacts.length > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground -mt-4" aria-live="polite">
                    <span>
                        {filtering ? `${filteredContacts.length} of ${contacts.length} contacts` : `${contacts.length} contact${contacts.length === 1 ? "" : "s"}`}
                    </span>
                    {filtering && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            <X className="h-3.5 w-3.5 mr-1" />
                            Clear filters
                        </Button>
                    )}
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* Simple skeleton loading state */}
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-48 rounded-lg border bg-card animate-pulse" />
                    ))}
                </div>
            ) : filteredContacts.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title={filtering ? "No contacts match" : "Start your network"}
                    description={filtering
                        ? "Nothing matches your search and filters."
                        : "Add the first person you want to stay in touch with. You can also send a profile here from the JobOS Chrome extension."}
                    actionLabel={filtering ? "Clear filters" : "Add Contact"}
                    onAction={filtering ? clearFilters : () => { setEditingContact(null); setIsAddDialogOpen(true); }}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredContacts.slice(0, shown).map((contact) => (
                        <ContactCard
                            key={contact.id}
                            contact={contact}
                            onEdit={openEditDialog}
                            onDelete={(id) => setDeleting(contacts.find((c) => c.id === id) ?? null)}
                            actionInfo={contactActions.get(contact.id)}
                            onUpdate={updateContact}
                            onOpen={(c) => setOpenContactId(c.id)}
                        />
                    ))}
                </div>
            )}

            {!loading && filteredContacts.length > shown && (
                <div className="flex justify-center">
                    <Button variant="outline" onClick={() => setShown((n) => n + PAGE_SIZE)}>
                        Show {Math.min(PAGE_SIZE, filteredContacts.length - shown)} more ({filteredContacts.length - shown} not shown)
                    </Button>
                </div>
            )}

            <AlertDialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This removes the contact with their notes, interaction history, reminders and message draft. It cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep contact</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => { if (deleting) void deleteContact(deleting.id); setDeleting(null); }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AddContactDialog
                open={isAddDialogOpen}
                onOpenChange={(open) => {
                    setIsAddDialogOpen(open);
                    if (!open) setEditingContact(null);
                }}
                onSave={editingContact?.id ? handleUpdateContact : handleCreateContact}
                initialData={editingContact}
                existing={contacts}
            />

            <ImportConnectionsDialog
                open={isImportOpen}
                onOpenChange={setIsImportOpen}
                existing={contacts}
                onImport={async (rows) => {
                    const outcome = await addContacts(rows);
                    if (outcome.added > 0) await refreshActions();
                    return outcome;
                }}
            />

            {loggingContactId && (
                <AddEngagementDialog
                    open
                    onOpenChange={(open) => { if (!open) setLoggingContactId(null); }}
                    onSubmit={handleLogged}
                    contactId={loggingContactId}
                />
            )}

            <ContactDetailsDialog
                contact={openContact}
                open={!!openContact}
                onOpenChange={(open) => { if (!open) setOpenContactId(null); }}
                onEdit={openEditDialog}
                onUpdate={updateContact}
            />
        </div>
    );
}
