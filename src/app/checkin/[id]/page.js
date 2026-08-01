'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CheckinRecepcion() {
  const { id } = useParams();
  const [invitado, setInvitado] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (id) fetchInvitado();
  }, [id]);

  const fetchInvitado = async () => {
    const { data, error } = await supabase
      .from('invitados')
      .select('*, acompanantes(*)')
      .eq('id', id)
      .single();

    if (!error) {
      setInvitado(data);
    }
    setCargando(false);
  };

  // 1. PANTALLA DE CARGA
  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white font-semibold">
        <div className="animate-pulse flex flex-col items-center">
          <div className="text-4xl mb-4">📷</div>
          <p>Leyendo pase digital...</p>
        </div>
      </div>
    );
  }

  // 2. PANTALLA ROJA: QR Falso o Eliminado
  if (!invitado) {
    return (
      <div className="min-h-screen bg-red-600 p-6 flex flex-col items-center justify-center text-center text-white">
        <div className="text-8xl mb-4 animate-bounce">❌</div>
        <h1 className="text-4xl font-extrabold mb-2 tracking-tight">ACCESO DENEGADO</h1>
        <p className="text-lg font-medium opacity-90">Este código QR no existe o fue eliminado del sistema.</p>
      </div>
    );
  }

  // Calculamos cuántas personas deben entrar con este pase
  const totalPersonas = 1 + (invitado.acompanantes?.length || 0);
  const accesoPermitido = invitado.estatus === 'confirmado';

  // 3. PANTALLA VERDE O AMARILLA: Resultado de la validación
  return (
    <div className={`min-h-screen p-6 flex flex-col items-center justify-center text-center text-white transition-colors duration-500 ${accesoPermitido ? 'bg-green-500' : 'bg-yellow-500'}`}>
      
      <div className="bg-white/20 p-8 rounded-3xl shadow-2xl max-w-md w-full backdrop-blur-md border border-white/30">
        
        {/* ICONO Y TÍTULO */}
        <div className="text-7xl mb-4 drop-shadow-md">
          {accesoPermitido ? '✅' : '⚠️'}
        </div>
        
        <h1 className="text-3xl font-black mb-2 uppercase tracking-widest drop-shadow-sm">
          {accesoPermitido ? 'ACCESO PERMITIDO' : 'PASE SIN CONFIRMAR'}
        </h1>
        
        <p className="mb-8 font-medium text-white/90 text-sm">
          {accesoPermitido 
            ? 'El invitado confirmó su asistencia previamente.' 
            : 'Este invitado está en el sistema, pero jamás confirmó su asistencia.'}
        </p>

        {/* TARJETA BLANCA CON LOS DATOS DEL INVITADO */}
        <div className="bg-white text-gray-900 p-6 rounded-2xl shadow-inner text-left">
          
          <div className="inline-block bg-gray-900 text-white text-xs font-black px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest shadow-sm">
            Total a ingresar: {totalPersonas} persona{totalPersonas > 1 ? 's' : ''}
          </div>
          
          <h2 className="text-2xl font-extrabold mb-6 border-b border-gray-100 pb-4 text-gray-800">
            {invitado.nombre}
          </h2>
          
          {invitado.acompanantes?.length > 0 ? (
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">
                Acompañantes autorizados:
              </p>
              <ul className="space-y-3">
                {invitado.acompanantes.map((acomp, idx) => (
                  <li key={idx} className="flex items-center gap-3 font-medium text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-green-500 text-xl font-bold">•</span> 
                    {acomp.nombre || <span className="italic text-gray-400">Pase extra sin nombre</span>}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider text-center py-4 bg-gray-50 rounded-xl">
              Pase individual (Sin acompañantes)
            </p>
          )}
        </div>

      </div>
    </div>
  );
}