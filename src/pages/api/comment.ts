export const prerender = false;
import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabaseClient";

export const POST: APIRoute = async ({ request }) => {
    try {
        const formData = await request.formData();
        const comment = formData.get('comment');
        const post_id = formData.get('post_id');
        const user_id = formData.get('user_id');

        if(!user_id) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized. Please login.'}), 
                { status: 401 }
            )
        }

        if (!comment || !post_id) {
            return new Response(
                JSON.stringify({ error: 'Please provide a comment and post before you submit.'}), 
                { status: 422 }
            )
        }

        const { error } = await supabase
        .from('comment')
        .insert({ comment, post_id, user_id });

        if(error) {
            return new Response(
                JSON.stringify({ error: 'Error submitting comment. Try again.'}), 
                { status: 422 }
            )
        }
        

        return new Response(
            JSON.stringify({ message: 'Comment created successfully.'}), 
            { status: 200 }
        )
    } catch (e) {
        return new Response(
      JSON.stringify({ error: 'Server Error, Something went wrong!'}),
        { status: 500 }
      )
    }
};
