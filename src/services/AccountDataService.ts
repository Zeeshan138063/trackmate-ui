import { supabase } from "@/integrations/supabase/client";

/**
 * Tables included in "Export All Data". Row level security limits every query to the signed-in
 * user's rows, so no user filter is needed for correctness; tables without a user_id column
 * would otherwise be impossible to query the same way.
 *
 * Adding a table that stores user data? Add it here and to USER_TABLES in
 * supabase/functions/delete-account/tables.ts (principle P9).
 */
export const EXPORT_TABLES = [
    "profiles",
    "resumes",
    "jobs",
    "contacts",
    "engagements",
    "follow_ups",
    "follow_up_events",
    "followup_settings",
    "dream_companies",
    "dream_company_reminders",
    "interview_feedback",
    "interview_practices",
    "meetings",
    "availability_preferences",
    "calendar_accounts",
    "mail_accounts",
    "job_search_queries",
    "career_goals",
    "priorities",
    "work_styles",
    "profile_growth_settings",
    "content_queue",
    "daily_queue_events",
] as const;

/** Credentials are never exported, even to their owner: a data file gets emailed and synced. */
const SECRET_COLUMN = /token|secret|password|linkedin_keys/i;

export function stripSecrets<T extends Record<string, unknown>>(row: T): Partial<T> {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
        if (!SECRET_COLUMN.test(key)) clean[key] = value;
    }
    return clean as Partial<T>;
}

export interface AccountExport {
    exportedAt: string;
    product: "JobOS";
    tables: Record<string, unknown[]>;
    /** Tables that could not be read. Never silently dropped (P10). */
    failed: { table: string; reason: string }[];
}

export const AccountDataService = {
    /** Reads every table in EXPORT_TABLES for the signed-in user. */
    exportAll: async (): Promise<AccountExport> => {
        const result: AccountExport = {
            exportedAt: new Date().toISOString(),
            product: "JobOS",
            tables: {},
            failed: [],
        };

        for (const table of EXPORT_TABLES) {
            const { data, error } = await supabase.from(table as never).select("*");
            if (error) {
                result.failed.push({ table, reason: error.message });
                continue;
            }
            result.tables[table] = ((data ?? []) as Record<string, unknown>[]).map(stripSecrets);
        }

        return result;
    },

    /** Triggers a browser download of the export as a JSON file. */
    download: (data: AccountExport) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `jobos-export-${data.exportedAt.slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    },

    /** Deletes all of the signed-in user's data and their account. Irreversible. */
    deleteAccount: async (): Promise<void> => {
        const { error } = await supabase.functions.invoke("delete-account", {
            body: { confirm: "DELETE" },
        });
        if (error) throw error;
    },
};
