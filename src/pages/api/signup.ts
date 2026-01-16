import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabaseClient';

export const prerender = false;

const profile_picture_bucket = supabase.storage.from('profile_picture');

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const firstname = formData.get('firstname')?.toString().trim();
    const lastname = formData.get('lastname')?.toString().trim();
    const email = formData.get('email')?.toString().trim();
    const username = formData.get('username')?.toString().trim();
    const password = formData.get('password')?.toString().trim();
    const confirm_password = formData.get('confirm_password')?.toString().trim();
    const profile_picture = formData.get("profile_picture");

    if (!firstname || !lastname || !email || !username || !password || !confirm_password || !profile_picture) {
      return new Response(
        JSON.stringify({ error: "All fields are required." }),
        { status: 422 }
      );
    }

    if (password !== confirm_password) {
      return new Response(
        JSON.stringify({ error: "Passwords do not match." }),
        { status: 422 }
      );
    }

    if(password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters long." }),
        { status: 422 }
      );
    }

    const { name, type, size } = profile_picture as File;
    const fileExtension = name.split('.').pop();
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(type)) {
      return new Response(
        JSON.stringify({ error: "Invalid profile picture format. Only JPEG, PNG, and GIF are allowed." }),
        { status: 422 }
      );
    }
    
    if (size > 5 * 1024 * 1024) { 
      return new Response(
        JSON.stringify({ error: "Profile picture size exceeds 5MB." }),
        { status: 422 }
      );
    }

    const uniqueFilename = `${Date.now()}_${name.split('.')[0].replace(/\s+/g, '_')}.${fileExtension}`;

    const { data, error: uploadError } = await profile_picture_bucket.upload(uniqueFilename, profile_picture as Blob, {
      contentType: type,
    });
    if (uploadError) {
      return new Response(
        JSON.stringify({ error: "Failed to upload profile picture." }),
        { status: 500 }
      );
    }
    const { data: publicURL } = profile_picture_bucket.getPublicUrl(uniqueFilename);

    const userPayload = {
      firstname,
      lastname,
      email,
      username,
      image: publicURL
    };

    const { data: supabaseData, error: supabaseError } = await supabase.auth.signUp({
      email: userPayload.email,
      password
    });

    if (supabaseError) {
      
      return new Response(
        JSON.stringify({ error: supabaseError.message || "Failed to register user." }),
        { status: 500 }
      );
    }

    if (supabaseData.user) {
      await supabase.from('users').insert([{
        user_id: supabaseData.user.id,
        ...userPayload
      }]);
    } else {
      return new Response(
        JSON.stringify({ error: "User registration failed." }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: "Registration successful." }),
      { status: 201 }
    );
  } catch (error) {
  return new Response(
      JSON.stringify({ error: "Server Error!" }),
      { status: 400 }
    );
  }
}

export const PUT: APIRoute = async ({ request }) => {
  
  try {
    const formData = await request.formData();

    const _user = formData.get('user')?.toString() || '{}';
    const user = JSON.parse(_user);

    const firstname = formData.get('firstname')?.toString().trim();
    const lastname = formData.get('lastname')?.toString().trim();
    const profile_picture = formData.get("profile_picture");

    const password = formData.get('new_password')?.toString().trim();
    const confirm_password = formData.get('confirm_new_password')?.toString().trim();


    let uploadedImage;

    if (password) {
      
      if (password !== confirm_password) {
        return new Response(
          JSON.stringify({ error: "Passwords do not match." }),
          { status: 422 }
        );
      }

      if(password.length < 6) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 6 characters long." }),
          { status: 422 }
        );
      }
      
      await supabase
      .auth
      .updateUser({
        password
      });
      
    } else {
      if (!firstname || !lastname ) {
        return new Response(
          JSON.stringify({ error: "Firstname and Lastname is required." }),
          { status: 422 }
        );
      }
      if (profile_picture) {

        const imageToDelete = user.image.publicUrl.split('profile_picture/')[1];

        const { name, type, size } = profile_picture as File;
        const fileExtension = name.split('.').pop();
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(type)) {
          return new Response(
            JSON.stringify({ error: "Invalid profile picture format. Only JPEG, PNG, and GIF are allowed." }),
            { status: 422 }
          );
        }
        
        if (size > 5 * 1024 * 1024) { 
          return new Response(
            JSON.stringify({ error: "Profile picture size exceeds 5MB." }),
            { status: 422 }
          );
        }
        const uniqueFilename = `${Date.now()}_${name.split('.')[0].replace(/\s+/g, '_')}.${fileExtension}`;

        const { error: uploadError } = await profile_picture_bucket.upload(uniqueFilename, profile_picture as Blob, {
          contentType: type,
        });

        
        if (uploadError) {          
          return new Response(
            JSON.stringify({ error: "Failed to upload profile picture." }),
            { status: 500 }
          );
        }
        const { data: publicUrl } = profile_picture_bucket.getPublicUrl(uniqueFilename);
        uploadedImage = publicUrl;
        
        await supabase
        .storage
        .from('profile_picture')
        .remove([imageToDelete]);

      }
      const updatePayload = {
        firstname,
        lastname
      }

      if (uploadedImage) {
        // @ts-ignore
        updatePayload.image = uploadedImage;
      }
     
      await supabase
      .from('users')
      .update(updatePayload)
      .eq('user_id', user.user_id);
      
    }

    return new Response(
      JSON.stringify({ message: 'User data updated successfully.'}), 
      { status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Server Error, Something went wrong!'}),
        { status: 500 }
      )
  }
}

