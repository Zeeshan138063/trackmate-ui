import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EMPTY_CAMPAIGN, fromRow, normalizeCampaign, toRow, type Campaign, type CampaignRow } from "@/utils/campaign";

/**
 * The signed-in user's campaign (REQ-001). `saved` is false until a row exists, so callers can
 * tell "not set up yet" from "set up with defaults". `error` is set when the table cannot be
 * read, for example before migration 20261126150000 is applied.
 */
export function useCampaign() {
    const { user } = useAuth();
    const [campaign, setCampaign] = useState<Campaign>(EMPTY_CAMPAIGN);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error: readError } = await supabase.from("campaigns" as never).select("*").maybeSingle();
        if (readError) {
            console.error("Campaign not loaded:", readError.message);
            setError(readError.message);
        } else {
            setError(null);
            setSaved(!!data);
            setCampaign(data ? fromRow(data as unknown as CampaignRow) : EMPTY_CAMPAIGN);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        load();
    }, [load]);

    /** Saves the whole campaign. Returns an error message, or null when saved. */
    const save = useCallback(async (next: Campaign): Promise<string | null> => {
        if (!user) return "Sign in to save your campaign.";
        const clean = normalizeCampaign(next);
        const { error: writeError } = await supabase
            .from("campaigns" as never)
            .upsert({ user_id: user.id, ...toRow(clean) } as never, { onConflict: "user_id" });
        if (writeError) {
            console.error("Campaign not saved:", writeError.message);
            return writeError.message;
        }
        setCampaign(clean);
        setSaved(true);
        setError(null);
        return null;
    }, [user]);

    return { campaign, saved, loading, error, save, reload: load };
}
