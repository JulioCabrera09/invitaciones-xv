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

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

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

  const urlCheckin = `${baseUrl}/checkin/${invitado.id}`;
  const totalPersonas = 1 + acompanantesLocales.length;

  // --- LÓGICA DE FECHA LÍMITE ---
  // A partir del 25 de septiembre a media noche, ya no se puede confirmar
  const fechaLimite = new Date('2026-09-25T00:00:00');
  const hoy = new Date();
  const puedeConfirmar = hoy < fechaLimite;

  return (
    <div className="min-h-screen bg-pink-50 p-6 flex flex-col items-center justify-center font-sans text-center">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-pink-100">
        
        {/* NOMBRE DE LA QUINCEAÑERA */}
        <h2 className="text-xl md:text-2xl font-bold text-pink-400 mb-1 uppercase tracking-widest leading-tight">¡¡¡Los XV de Paula Yáñez Valero!!!</h2>
        <p className="text-gray-500 mb-6 font-medium">A mis padres y a mí, nos encantaría que nos acompañes en este día tan especial.</p>
        
        {/* DETALLES Y MAPA */}
        <div className="mb-8 px-2">
          <p className="text-sm text-gray-600 leading-relaxed mb-5 text-justify">
            El evento se llevará a cabo el día <strong>3 de Octubre</strong> del año en curso, en el salón <strong>"Alta Esmeralda"</strong> del restaurante Piedra 44 de la Plaza Vitta con dirección Blvd. Belisario Domínguez 1380-Loc 2A, en un horario de <strong>6pm - 11pm</strong>, esperamos contar con su presencia puntualmente. Si llevas coche puedes ingresar tu coche al estacionamiento del hotel Eco City.
          </p>
          <a 
            href="https://www.google.com/maps/search/?api=1&query=Restaurante+Piedra+44+Plaza+Vitta+Blvd.+Belisario+Domínguez+1380" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full bg-white border-2 border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300 font-bold py-3 px-4 rounded-xl transition-all shadow-sm"
          >
            📍 Ver ubicación en Google Maps
          </a>
        </div>

        {/* MESA DE REGALOS LIVERPOOL */}
        <div className="mb-8 p-5 bg-white rounded-2xl border border-pink-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-pink-300"></div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">🎁 Mesa de Regalos</h3>
          <p className="text-sm text-gray-500 mb-4 text-justify">Uno de los grandes regalos será contar con tu presencia, y si deseas brindarme un detalle, cuento con mesa de regalos en Liverpool con el siguiente numero:</p>
          <div className="bg-pink-50 py-3 px-6 rounded-xl inline-block border border-pink-100">
            <p className="text-xs font-semibold text-pink-800 uppercase tracking-widest mb-1">Liverpool</p>
            <p className="text-2xl font-black text-pink-600 tracking-widest">52034471</p>
          </div>
          <p className="text-xs text-gray-400 mt-3 font-medium">Vigencia hasta el 2 de noviembre del 2026</p>
        </div>

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
                      disabled={!puedeConfirmar} // Deshabilita inputs si ya pasó la fecha
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

        {/* LÓGICA DE BOTONES Y FECHA LÍMITE */}
        {invitado.estatus === 'pendiente' ? (
          puedeConfirmar ? (
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
            <div className="mt-6 p-5 bg-gray-50 rounded-2xl border border-gray-200">
              <p className="text-gray-600 font-semibold text-sm">⚠️ El periodo para confirmar asistencia ha finalizado (24 de septiembre).</p>
              <p className="text-xs text-gray-500 mt-2">Si deseas realizar una modificación de último momento, por favor contacta directamente a la familia.</p>
            </div>
          )
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