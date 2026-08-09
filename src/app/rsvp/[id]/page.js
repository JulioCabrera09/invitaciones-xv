'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { Great_Vibes, Playfair_Display } from 'next/font/google';

const greatVibes = Great_Vibes({ weight: '400', subsets: ['latin'] });
const playfair = Playfair_Display({ weight: ['400', '600', '700', '900'], subsets: ['latin'] });

export default function RSVPPage() {
  const { id } = useParams();
  const [invitado, setInvitado] = useState(null);
  const [acompanantesLocales, setAcompanantesLocales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  
  const [estadoSobre, setEstadoSobre] = useState('cerrado'); 

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

  const abrirSobre = () => {
    if (estadoSobre !== 'cerrado') return;
    setEstadoSobre('rompiendo_sello');
    setTimeout(() => {
      setEstadoSobre('abriendo_solapa');
      setTimeout(() => {
        setEstadoSobre('abierto');
      }, 1000);
    }, 500);
  };

  if (cargando) return <div className="min-h-screen bg-[#fdf8f5] flex items-center justify-center text-[#d8a4a5] font-semibold">Preparando tu invitación...</div>;
  if (!invitado) return <div className="min-h-screen bg-[#fdf8f5] flex items-center justify-center text-[#5c4033]">Invitación no encontrada.</div>;

  if (invitado.estatus === 'rechazado') {
    return (
      <div className={`min-h-screen bg-[#fdf8f5] p-6 flex flex-col items-center justify-center text-center ${playfair.className}`}>
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-[#f4e4e4]">
           <h1 className="text-3xl font-bold text-[#d8a4a5] mb-4">¡Qué pena!</h1>
           <p className="text-[#5c4033] font-medium text-lg">Lamentamos mucho que no puedas acompañarnos, te extrañaremos ese día.</p>
        </div>
      </div>
    );
  }

  const urlCheckin = `${baseUrl}/checkin/${invitado.id}`;
  const totalPersonas = 1 + acompanantesLocales.length;
  const fechaLimite = new Date('2026-09-25T00:00:00');
  const hoy = new Date();
  const puedeConfirmar = hoy < fechaLimite;

  // ==========================================
  // VISTA 1: EL SOBRE
  // ==========================================
  if (estadoSobre !== 'abierto') {
    return (
      <div className={`min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-4 overflow-hidden ${playfair.className}`}>
        <div 
          onClick={abrirSobre}
          style={{ perspective: '1200px' }}
          className={`relative w-full max-w-sm aspect-[4/3] cursor-pointer transition-all duration-1000 transform 
            ${estadoSobre === 'abriendo_solapa' ? 'scale-110 opacity-0 translate-y-20' : 'hover:scale-105'}
          `}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#e6c1c3] to-[#d8a4a5] rounded-xl shadow-2xl flex items-end justify-center pb-6 border border-[#c98e90]">
            <div className="text-center px-4">
              <p className="text-white/80 text-xs tracking-widest uppercase mb-1">Invitación a los XV Años de</p>
              <h2 className={`${greatVibes.className} text-4xl text-white drop-shadow-md`}>Paula Yáñez Valero</h2>
            </div>
          </div>

          <div 
            style={{ 
              transformOrigin: 'top', 
              transform: estadoSobre === 'abriendo_solapa' ? 'rotateX(180deg)' : 'rotateX(0deg)',
              transition: 'transform 0.8s ease-in-out'
            }}
            className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-xl z-20 pointer-events-none"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] aspect-square bg-[#d8a4a5] rotate-45 border-b-2 border-r-2 border-[#c98e90] shadow-xl"></div>
          </div>
          
          <div 
            className={`absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center transition-all duration-500
              ${estadoSobre !== 'cerrado' ? 'scale-150 opacity-0' : 'opacity-100 scale-100'}
            `}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-[#e6d070] via-[#d4af37] to-[#aa8c2c] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.3)] border-2 border-[#fff7d6] ring-4 ring-[#aa8c2c]/30">
              <span className={`${greatVibes.className} text-4xl text-white shadow-black drop-shadow-lg`}>P</span>
            </div>
            {estadoSobre === 'cerrado' && (
              <span className="mt-4 text-white/90 text-[10px] font-bold tracking-[0.3em] uppercase animate-pulse drop-shadow-md bg-black/20 px-3 py-1 rounded-full">
                Toca para abrir
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA 2: LA INVITACIÓN ABIERTA
  // ==========================================
  return (
    <div className={`min-h-screen bg-[url('/fondo-rosas.jpg')] bg-cover bg-center bg-fixed bg-[#fdf2f2] relative py-8 px-3 sm:px-6 flex flex-col items-center justify-start ${playfair.className}`}>
      
      <div className="absolute inset-0 bg-gradient-to-br from-[#f9d4d5]/80 via-[#f4a5a7]/30 to-[#e6c1c3]/80 pointer-events-none"></div>
      <div className="absolute top-1/4 left-4 w-32 h-32 bg-[#d4af37] rounded-full mix-blend-multiply filter blur-[60px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-4 w-40 h-40 bg-[#f4a5a7] rounded-full mix-blend-multiply filter blur-[60px] opacity-40 pointer-events-none"></div>

      <div className="relative bg-[#fff0f1]/95 backdrop-blur-md rounded-xl shadow-[0_20px_50px_rgba(92,64,51,0.2)] max-w-md w-full animate-in slide-in-from-bottom-20 fade-in duration-1000 border-2 border-[#d4af37]/40 z-10 overflow-hidden">
        
        {/* Zonas para tus imágenes PNG florales */}
        <div className="absolute top-0 left-0 w-full h-40 bg-[url('/flores-arriba.png')] bg-cover bg-bottom opacity-90 pointer-events-none z-0"></div>
        <div className="absolute bottom-0 left-0 w-full h-40 bg-[url('/flores-abajo.png')] bg-cover bg-top opacity-90 pointer-events-none z-0"></div>

        <div className="relative z-10 border-[4px] border-double border-[#d4af37]/60 m-3 rounded-lg pt-10 pb-16 px-4 md:px-6">
          <div className="flex flex-col items-center text-center">
            
            {/* ========================================================= */}
            {/* IMAGEN DE LA CORONA (Reemplaza el código anterior)        */}
            {/* Asegúrate de tener "corona.png" en tu carpeta "public"    */}
            {/* ========================================================= */}
            <div className="mt-24 mb-8">
              <img 
                src="/corona.png" 
                alt="Corona de Paula" 
                className="w-28 md:w-36 h-auto drop-shadow-md object-contain"
              />
            </div>

            <h1 className={`${greatVibes.className} text-5xl md:text-6xl text-[#5c4033] mb-5 leading-[1.1] drop-shadow-sm`}>
              Paula<br/>Yáñez Valero
            </h1>

            <p className="text-[#6b4c3a] text-sm leading-relaxed px-2 mb-8 font-medium">
              A mis padres y a mí, nos encantaría que nos acompañes en este día tan especial.
            </p>
            
            <div className="mb-8">
              <h2 className="text-[#5c4033] text-6xl font-black mb-1 drop-shadow-sm">3</h2>
              <h3 className={`${greatVibes.className} text-4xl text-[#d4af37] drop-shadow-sm`}>de Octubre</h3>
            </div>

            <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto mb-8"></div>

            <div className="mb-8 px-1 w-full">
              <div className="mb-4">
                <h2 className="text-[#5c4033] text-3xl font-bold mb-2">6:00 pm</h2>
                <h3 className={`${greatVibes.className} text-3xl text-[#5c4033] mb-1`}>Alta Esmeralda</h3>
                <p className="text-[#a88978] text-xs font-serif italic mb-4">Restaurante Piedra 44, Plaza Vitta</p>
              </div>

              <p className="text-[#6b4c3a] text-xs leading-relaxed mb-5 text-justify bg-white/40 p-3 rounded-lg backdrop-blur-sm border border-white/50">
                Ubicado en Blvd. Belisario Domínguez 1380-Loc 2A. Esperamos contar con su presencia puntualmente. Si llevas coche puedes ingresar al estacionamiento del hotel Eco City.
              </p>
              
              <a 
                href="https://www.google.com/maps/search/?api=1&query=Restaurante+Piedra+44+Plaza+Vitta+Blvd.+Belisario+Domínguez+1380" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-white hover:from-[#c29d2b] hover:to-[#967920] font-bold py-3 px-4 rounded-xl transition-all text-sm shadow-lg border border-[#e6d070]/50"
              >
                📍 Ver ubicación en Google Maps
              </a>
            </div>

            <div className="mb-8 w-full border-y border-[#d4af37]/30 py-5 bg-white/40 rounded-lg backdrop-blur-sm">
               <div className="flex items-center justify-center gap-2 mb-3">
                  <h3 className={`${greatVibes.className} text-3xl text-[#d4af37]`}>Vestimenta:</h3>
                  <span className="text-xl text-[#5c4033] font-serif italic">Formal-Casual</span>
               </div>
              <p className="text-[#6b4c3a] text-xs leading-relaxed text-center px-4">
                Les pedimos con cariño que el color <strong className="text-[#d8a4a5]">palo de rosa con dorado</strong> quede reservado para nuestra quinceañera.
              </p>
            </div>

            <div className="mb-10 w-full p-6 bg-white/70 backdrop-blur-md rounded-xl border border-[#d4af37]/40 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#e6d070] via-[#d4af37] to-[#e6d070]"></div>
              <h3 className="text-sm font-bold text-[#d4af37] uppercase tracking-widest mb-3">Mesa de Regalos</h3>
              <p className="text-xs text-[#6b4c3a] mb-4 text-justify leading-relaxed">Uno de los grandes regalos será contar con tu presencia, y si deseas brindarme un detalle, cuento con mesa de regalos en Liverpool con el siguiente número:</p>
              
              <div className="bg-[#fdf8f5] py-3 px-6 rounded-lg border border-[#e6c1c3] shadow-inner mb-3">
                <p className="text-[10px] font-bold text-[#d8a4a5] uppercase tracking-[0.2em] mb-1">Liverpool</p>
              </div>
              <h2 className="text-[#000000] text-3xl mb-2">52034471</h2>
              
              <p className="text-[10px] text-[#a88978] italic">Vigencia hasta el 2 de noviembre del 2026</p>
            </div>

            <div className="mb-6 w-full p-5 bg-white/80 border border-[#d4af37]/30 rounded-xl shadow-sm backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#d8a4a5]"></div>
              <div className="inline-block bg-gradient-to-r from-[#d8a4a5] to-[#c98e90] text-white text-[10px] font-black px-4 py-1.5 rounded-full mb-3 uppercase tracking-widest shadow-sm">
                PASE PARA {totalPersonas} PERSONA{totalPersonas > 1 ? 'S' : ''}
              </div>
              <h2 className="text-xl font-bold text-[#5c4033]">{invitado.nombre}</h2>
            </div>

            {acompanantesLocales.length > 0 && (
              <div className="mb-8 w-full text-left bg-white/40 p-4 rounded-xl border border-white/50 backdrop-blur-sm">
                <p className="text-sm text-[#5c4033] font-semibold mb-3 text-center">
                  {invitado.estatus === 'pendiente' 
                    ? 'Por favor, ingresa los nombres de tus acompañantes:' 
                    : 'Acompañantes registrados:'}
                </p>
                <div className="space-y-3">
                  {acompanantesLocales.map((acomp, idx) => (
                    <div key={acomp.id}>
                      {invitado.estatus === 'pendiente' ? (
                        <input 
                          type="text" value={acomp.nombre} onChange={(e) => handleNombreAcompanante(idx, e.target.value)}
                          placeholder={`Nombre del acompañante ${idx + 1}`} 
                          className="w-full px-4 py-2.5 border border-[#d4af37]/40 rounded-lg focus:ring-2 focus:ring-[#d4af37] outline-none text-[#5c4033] bg-white text-sm shadow-inner"
                          disabled={!puedeConfirmar}
                        />
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3 bg-white border border-[#d4af37]/30 rounded-lg shadow-sm">
                          <span className="text-[#d8a4a5] text-lg font-bold leading-none">❀</span>
                          <span className="text-[#5c4033] text-sm font-medium">{acomp.nombre || 'Pase extra sin nombre'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invitado.estatus === 'pendiente' ? (
              puedeConfirmar ? (
                <div className="flex flex-col gap-3 mt-6 w-full relative z-20">
                  <div className="bg-white/60 p-4 rounded-lg mb-2 border border-white backdrop-blur-sm">
                    <p className="text-xs text-[#6b4c3a] leading-relaxed text-center italic">
                      El periodo para confirmar asistencia finaliza el <strong>24 de septiembre</strong>.
                    </p>
                  </div>
                  <button 
                    onClick={confirmarAsistencia} disabled={confirmando}
                    className="w-full bg-gradient-to-r from-[#d8a4a5] to-[#c98e90] hover:from-[#c98e90] hover:to-[#b87d7f] text-white font-bold py-3.5 px-6 rounded-xl transition-transform active:scale-95 disabled:opacity-50 text-sm tracking-widest uppercase shadow-lg border border-[#e6c1c3]"
                  >
                    {confirmando ? 'Procesando...' : 'Confirmar Asistencia'}
                  </button>
                  <button 
                    onClick={rechazarAsistencia} disabled={confirmando}
                    className="w-full bg-white/50 text-[#a88978] hover:text-[#5c4033] hover:bg-white/80 font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 text-xs uppercase tracking-widest mt-2 border border-[#f4e4e4]"
                  >
                    No podré asistir
                  </button>
                </div>
              ) : (
                <div className="mt-6 p-5 bg-white/80 rounded-xl border border-[#f4e4e4] w-full relative z-20 backdrop-blur-sm">
                  <p className="text-[#5c4033] font-bold text-sm mb-2">⚠️ Periodo Finalizado</p>
                  <p className="text-xs text-[#a88978] leading-relaxed">La fecha límite para confirmar asistencia (24 de septiembre) ha pasado. Si necesitas una modificación, contacta a la familia.</p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center space-y-5 animate-in fade-in duration-500 mt-6 w-full border-t border-[#d4af37]/30 pt-8 relative z-20">
                <div className="bg-[#d4af37]/10 text-[#aa8c2c] px-6 py-2 rounded-full font-bold shadow-sm border border-[#d4af37]/30 text-sm tracking-widest uppercase backdrop-blur-sm">
                  ¡Asistencia Confirmada! ✅
                </div>
                <p className="text-xs text-[#6b4c3a] font-medium px-4 bg-white/50 p-2 rounded-lg">Este es tu pase digital. Tómale captura y preséntalo en la recepción el día del evento.</p>
                <div className="p-4 bg-white border-4 border-[#e6d070] rounded-xl shadow-lg">
                  <QRCodeSVG value={urlCheckin} size={200} level="H" includeMargin={false} fgColor="#5c4033" />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}