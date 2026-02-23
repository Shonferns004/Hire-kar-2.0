import { normalizePhone } from '@/lib/normalize'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './constants';


export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
)


export const getUserPhone = async (): Promise<string> => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user?.phone) {
    throw new Error("Phone number not found in Supabase session");
  }

  return normalizePhone(session.user.phone);
};



export const getUserId = async () => {
  // Force Supabase to validate/refresh session
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return null;
  }

  return data.user.id;
}


export const ensureRealtime = async () => {
  return new Promise<void>((resolve) => {
    const test = supabase.channel("system");

    test.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        supabase.removeChannel(test);
        resolve();
      }
    });
  });
};

export const waitForRealtime = async (supabase: any) => {
  return new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      const connected = supabase.realtime.isConnected();


      if (connected) {
        clearInterval(interval);
        resolve();
      }
    }, 150);
  });
};


