import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabaseClient';

const blog_bucket = supabase.storage.from('blog_images');


export const POST: APIRoute = async ({ request, redirect }) => {
  
  try {
      const formData = await request.formData();
      
      const _user = formData.get('user')?.toString() || '{}';
      const user = JSON.parse(_user);
      
    if(!user) {
        redirect('/login');
    }

    const title = formData.get('title')?.toString().trim() || '';
    const content = formData.get('content')?.toString().trim() || '';
    const blogImage = formData.get('blog_image');

    if(!title || !content || !blogImage) {
        return new Response(
            JSON.stringify({
                error: "All field is required"
            }),  { status: 422 }
        );
    }

    const { name, type, size } = blogImage as File;
    const fileExtension = name.split('.').pop();
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(type)) {
      return new Response(
        JSON.stringify({ error: "Invalid blog image format. Only JPEG, PNG, and GIF are allowed." }),
        { status: 422 }
      );
    }
    
    if (size > 5 * 1024 * 1024) { 
      return new Response(
        JSON.stringify({ error: "Blog image size exceeds 5MB." }),
        { status: 422 }
      );
    }

    const uniqueFilename = `${Date.now()}_${name.split('.')[0].replace(/\s+/g, '_')}.${fileExtension}`;

    const { error: uploadError } = await blog_bucket.upload(uniqueFilename, blogImage as Blob, {
      contentType: type,
    });
    if (uploadError) {
      return new Response(
        JSON.stringify({ error: "Failed to upload blog image." }),
        { status: 500 }
      );
    }
    const { data: publicUrl } = blog_bucket.getPublicUrl(uniqueFilename);

    const dataBack = await supabase.from('post').insert([{ title, content, image: publicUrl, user_id: user.user_id }]);


    return new Response(
      JSON.stringify({ message: 'Post created successfully.'}), 
      { status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Server Error, Something went wrong!'}),
        { status: 500 }
      )
  }
}

export const GET: APIRoute = async ({ request }) => {
    
    try {
        const { data: posts, error } = await supabase
        .from('post')
        .select(`
            post_id,
            title, 
            content,
            image,
            created_at,
            comment (
                comment,
                created_at,
                users(
                    firstname, lastname, image
                )
            ),
            users (
                firstname, lastname, image
            )
            `)
        .order('created_at', { ascending: false });

        
        return new Response(
            JSON.stringify({posts})
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Something went wrong'}),
            { status: 500 }
        )
    }
}
