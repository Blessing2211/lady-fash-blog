import { defineMiddleware } from "astro:middleware";
import { sequence } from 'astro:middleware'; 
import { supabase } from "./lib/supabaseClient";

export const authMiddleware = defineMiddleware(async (context, next) => {
  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

  if (accessToken && refreshToken) {
    const { data } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    
    if(data.user) {
      const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', data.user!.id)
      .single();

      // @ts-ignore
      context.locals.user = userData;
    }
    
  }

  return next();
});

export const onRequest = sequence(authMiddleware)