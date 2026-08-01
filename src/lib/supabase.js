import { createClient } from '@supabase/supabase-js';

// Obtenemos las variables de entorno en el archivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Verificamos que las variables existan para evitar errores
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan las variables de entorno de Supabase. Verifica tu archivo .env.local");
}

// Creamos y exportamos la conexión para poder usarla en cualquier parte
export const supabase = createClient(supabaseUrl, supabaseAnonKey);