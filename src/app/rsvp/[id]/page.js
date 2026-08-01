'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';

export default function RSVPPage() {
  const { id } = useParams();
  const [invitado, setInvitado] = useState(null);
  const [acompanantesLocales, setAcompanantesLocales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    if (id) fetchInvitado();
  }, [id]);

  const fetchInvitado = async () => {
    const { data, error } = await supabase.from('invitados').select('*, acompanantes(*)').eq('id', id).single();
    if (!error) {
      setInvitado(data);
      setAcompanantesLocales(data.acompanantes || []);
    }
    setCargando(false);
  };

  const handleNombreAcompanante = (index, valor) => {
    const nuevos = [...acompanantesLocales];
    nuevos[index].nombre = valor;
    setAcompanantesLocales(nuevos);
  };

  const confirmarAsistencia = async () => {
    setConfirmando(true);
    if (acompanantesLocales.length > 0) {
      const promesas = acompanantesLocales.map(acomp => 
        supabase.from('acompanantes').update({ nombre: acomp.nombre }).eq('id', acomp.id)
      );
      await Promise.all(promesas);
    }
    const { error } = await supabase.from('invitados').update({ estatus: 'confirmado' }).eq('id', id);
    if (!error) setInvitado({ ...invitado, estatus: 'confirmado' });
    setConfirmando(false);
  };

  // --- Nueva función para rechazar ---
  const rechazarAsistencia = async () => {
    const seguro = window.confirm("¿Estás seguro de que no podrás acompañarnos?");
    if (!seguro) return;

    setConfirmando(true);
    const { error } = await supabase.from('invitados').update({ estatus: 'rechazado' }).eq('id', id);
    if (!error) setInvitado({ ...invitado, estatus: 'rechazado' });
    setConfirmando(false);
  };

  if (cargando) return <div className="min-h-screen bg-pink-50 flex items-center justify-center text-pink-600 font-semibold">Cargando tu invitación...</div>;
  if (!invitado) return <div className="min-h-screen bg-pink-50 flex items-center justify-center text-gray-600">Invitación no encontrada.</div>;

  // --- Vista de Rechazado ---
  if (invitado.estatus === 'rechazado') {
    return (
      <div className="min-h-screen bg-pink-50 p-6 flex flex-col items-center justify-center text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-pink-100">
           <h1 className="text-2xl font-extrabold text-gray-400 mb-4">¡Qué pena!</h1>
           <p className="text-gray-600 font-medium">Lamentamos mucho que no puedas acompañarnos, te extrañaremos ese día.</p>
        </div>
      </div>
    );
  }

  const urlCheckin = `http://localhost:3000/checkin/${invitado.id}`;
  const totalPersonas = 1 + acompanantesLocales.length;

  return (
    <div className="min-h-screen bg-pink-50 p-6 flex flex-col items-center justify-center font-sans text-center">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-pink-100">
        
        <h1 className="text-4xl font-extrabold text-pink-600 mb-2 tracking-tight">¡Mis XV Años!</h1>
        <p className="text-gray-500 mb-8 font-medium">Nos encantaría que nos acompañes en este día tan especial.</p>
        
        <div className="mb-6 p-5 bg-pink-50/50 rounded-2xl border border-pink-100">
          <div className="inline-block bg-pink-200 text-pink-800 text-sm font-black px-4 py-1 rounded-full mb-3 shadow-sm">
            PASE PARA {totalPersonas} PERSONA{totalPersonas > 1 ? 'S' : ''}
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{invitado.nombre}</h2>
        </div>

        {acompanantesLocales.length > 0 && (
          <div className="mb-8 text-left">
            <p className="text-sm text-gray-600 font-semibold mb-3 text-center">
              {invitado.estatus === 'pendiente' 
                ? 'Por favor, ingresa los nombres de tus acompañantes (si los tienes definidos):' 
                : 'Acompañantes registrados:'}
            </p>
            <div className="space-y-3">
              {acompanantesLocales.map((acomp, idx) => (
                <div key={acomp.id}>
                  {invitado.estatus === 'pendiente' ? (
                    <input 
                      type="text" value={acomp.nombre} onChange={(e) => handleNombreAcompanante(idx, e.target.value)}
                      placeholder={`Nombre del acompañante ${idx + 1}`} className="w-full px-4 py-2 border border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-400 outline-none text-gray-700 bg-white"
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl">
                      <span className="text-pink-500 font-bold">•</span>
                      <span className="text-gray-700 font-medium">{acomp.nombre || 'Pase extra sin nombre'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {invitado.estatus === 'pendiente' ? (
          <div className="flex flex-col gap-3 mt-6">
            <button 
              onClick={confirmarAsistencia} disabled={confirmando}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 px-6 rounded-2xl transition-transform active:scale-95 disabled:opacity-50 text-lg shadow-md shadow-pink-200"
            >
              {confirmando ? 'Procesando...' : 'Confirmar Asistencia'}
            </button>
            <button 
              onClick={rechazarAsistencia} disabled={confirmando}
              className="w-full bg-transparent hover:bg-red-50 text-red-500 font-semibold py-3 px-6 rounded-2xl transition-colors disabled:opacity-50 text-sm"
            >
              No podré asistir
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-5 animate-in fade-in duration-500 mt-6">
            <div className="bg-green-100 text-green-700 px-6 py-2 rounded-full font-bold shadow-sm">
              ¡Asistencia Confirmada! ✅
            </div>
            <p className="text-sm text-gray-600 font-medium">Este es tu pase digital. Tómale captura y preséntalo en la recepción el día del evento.</p>
            <div className="p-4 bg-white border-4 border-pink-100 rounded-2xl shadow-sm">
              <QRCodeSVG value={urlCheckin} size={220} level="H" includeMargin={false} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}