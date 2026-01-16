export const prerender = false;

import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabaseClient";


export const POST: APIRoute = async ({ request }) => {
    try {
        
        const formData = await request.formData();
        const email = formData.get("email");
        const password = formData.get("password");
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: String(email),
            password: String(password),
        });
        

        if (error || !data.user) {
            return new Response(JSON.stringify({ error: error?.message || "Login failed" }), { status: 400 });
        }

        const { session } = data;

        return new Response(JSON.stringify({ message: "Login successful", session: session }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
};