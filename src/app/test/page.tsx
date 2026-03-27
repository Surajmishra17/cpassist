"use client"

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const schemaName = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || "public";
const tableName = process.env.NEXT_PUBLIC_SUPABASE_TABLE || "test_table";

export default function TestPage() {
    const [rows, setRows] = useState<unknown[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkSupabase() {
            try {
                setLoading(true);
                setErrorMessage(null);

                const { data, error } = await supabase 
                    .schema(schemaName)
                    .from(tableName)
                    .select("*")
                    .order("id", { ascending: false });

                if (error) {
                    console.error("Supabase query failed:", error);
                    setErrorMessage(error.message);
                    setRows([]);
                    return;
                }

                console.log("Supabase rows:", data);
                setRows(data ?? []);
            } catch (error) {
                console.error("Unexpected Supabase connection error:", error);
                setErrorMessage(
                    error instanceof Error ? error.message : "Unknown error"
                );
            } finally {
                setLoading(false);
            }
        }

        checkSupabase();
    }, []);

    return (
        <main className="p-6">
            <h1 className="mb-4 text-xl font-semibold">Supabase Connection Test</h1>
            <p className="mb-4 text-sm text-muted-foreground">
                Reading from <code>{schemaName}.{tableName}</code>
            </p>

            {loading && <p>Loading rows from `{tableName}`...</p>}

            {!loading && errorMessage && (
                <div className="rounded-md border border-red-500 p-4 text-red-400">
                    <p className="font-medium">Query failed</p>
                    <p>{errorMessage}</p>
                    <p className="mt-2 text-sm">
                        Check that the table name and schema are correct in your
                        `.env` file. If the table exists, make sure it is exposed
                        to the Supabase API and that it has a `SELECT` policy if
                        row-level security is enabled.
                    </p>
                </div>
            )}

            {!loading && !errorMessage && rows.length === 0 && (
                <p>No rows found in `{tableName}`.</p>
            )}

            {!loading && !errorMessage && rows.length > 0 && (
                <pre className="overflow-auto rounded-md border p-4 text-sm">
                    {JSON.stringify(rows, null, 2)}
                </pre>
            )}
        </main>
    );
}
