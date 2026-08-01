'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';

export default function AdminDashboard() {
  const [invitados, setInvitados] = useState([]);
  const [nombreInvitado, setNombreInvitado] = useState('');
  const [acompanantes, setAcompanantes] = useState([]); 
  const [cargando, setCargando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  useEffect(() => {
    fetchInvitados();
  }, []);

  const fetchInvitados = async () => {
    const { data, error } = await supabase
      .from('invitados')
      .select('*, acompanantes(*)')
      .order('creado_en', { ascending: false });

    if (!error) setInvitados(data);
  };

  const totalConfirmados = invitados.filter(i => i?.estatus === 'confirmado').length;
  const totalPendientes = invitados.filter(i => i?.estatus === 'pendiente').length;
  const totalRechazados = invitados.filter(i => i?.estatus === 'rechazado').length;

  // Lógica de búsqueda blindada contra errores de datos vacíos
  const invitadosFiltrados = invitados.filter(invitado => {
    const termino = (busqueda || '').toLowerCase();
    const coincidePrincipal = (invitado?.nombre || '').toLowerCase().includes(termino);
    const coincideAcompanante = invitado?.acompanantes?.some(
      a => (a?.nombre || '').toLowerCase().includes(termino)
    );
    return coincidePrincipal || coincideAcompanante;
  });

  const agregarCampoAcompanante = () => setAcompanantes([...acompanantes, '']);
  const actualizarAcompanante = (index, valor) => {
    const nuevos = [...acompanantes];
    nuevos[index] = valor;
    setAcompanantes(nuevos);
  };
  const eliminarCampoAcompanante = (index) => setAcompanantes(acompanantes.filter((_, i) => i !== index));

  const iniciarEdicion = (invitado) => {
    setEditandoId(invitado.id);
    setNombreInvitado(invitado.nombre);
    setAcompanantes(invitado.acompanantes ? invitado.acompanantes.map(a => a.nombre || '') : []);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setNombreInvitado('');
    setAcompanantes([]);
  };

  const eliminarInvitado = async (id) => {
    const confirmar = window.confirm('¿Estás seguro de eliminar a este invitado? Se borrarán también sus acompañantes.');
    if (!confirmar) return;
    await supabase.from('invitados').delete().eq('id', id);
    fetchInvitados();
  };

  const handleGuardarInvitado = async (e) => {
    e.preventDefault();
    if (!nombreInvitado.trim()) return;
    setCargando(true);

    if (editandoId) {
      await supabase.from('invitados').update({ nombre: nombreInvitado }).eq('id', editandoId);
      await supabase.from('acompanantes').delete().eq('invitado_id', editandoId);
      if (acompanantes.length > 0) {
        const datosAcompanantes = acompanantes.map(nombre => ({
          invitado_id: editandoId,
          nombre: nombre.trim()
        }));
        await supabase.from('acompanantes').insert(datosAcompanantes);
      }
    } else {
      const { data: nuevoInvitado } = await supabase.from('invitados').insert([{ nombre: nombreInvitado, estatus: 'pendiente' }]).select().single();
      if (acompanantes.length > 0 && nuevoInvitado) {
        const datosAcompanantes = acompanantes.map(nombre => ({
          invitado_id: nuevoInvitado.id,
          nombre: nombre.trim()
        }));
        await supabase.from('acompanantes').insert(datosAcompanantes);
      }
    }

    cancelarEdicion();
    await fetchInvitados();
    setCargando(false);
  };

  const descargarQR = (idInvitado, nombre) => {
    const svg = document.getElementById(`qr-${idInvitado}`);
    if(!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40; canvas.height = img.height + 40;
      ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20); 
      const link = document.createElement("a");
      link.download = `QR_${nombre.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  const copiarEnlace = (idInvitado) => {
    const url = `${baseUrl}/rsvp/${idInvitado}`;
    navigator.clipboard.writeText(url)
      .then(() => alert('¡Enlace copiado al portapapeles!'))
      .catch((err) => console.error('Error al copiar:', err));
  };

  const imprimirLista = () => {
    const ventana = window.open('', '_blank');
    const paraImprimir = invitadosFiltrados.filter(i => i?.estatus !== 'rechazado');

    const filasHTML = paraImprimir.map(inv => {
      const acompHtml = inv.acompanantes?.length > 0 
        ? `<ul style="margin: 0; padding-left: 20px;">${inv.acompanantes.map(a => `<li>${a.nombre || '(Pase extra sin nombre)'}</li>`).join('')}</ul>`
        : '<span style="color: #666;">Sin acompañantes</span>';
      
      return `
        <tr>
          <td style="text-align: center; vertical-align: top; padding-top: 15px;">
            <div style="width: 24px; height: 24px; border: 2px solid #000; border-radius: 4px; margin: 0 auto;"></div>
          </td>
          <td style="vertical-align: top;"><strong>${inv.nombre}</strong></td>
          <td style="vertical-align: top;">${acompHtml}</td>
          <td style="vertical-align: top;">${(inv.estatus || '').toUpperCase()}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <html>
        <head>
          <title>Lista de Recepción - XV Años</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #000; }
            h1 { text-align: center; margin-bottom: 5px; }
            p.subtitle { text-align: center; color: #555; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 12px; text-align: left; }
            th { background-color: #f0f0f0; }
            @media print {
              body { padding: 0; }
              th { background-color: #e5e5e5 !important; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <h1>Control de Asistencia</h1>
          <p class="subtitle">Lista de recepción generada el ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th style="width: 60px; text-align: center;">Llegó</th>
                <th>Invitado Principal</th>
                <th>Acompañantes / Pases Extras</th>
                <th>Estatus</th>
              </tr>
            </thead>
            <tbody>
              ${filasHTML}
            </tbody>
          </table>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `;
    ventana.document.write(html);
    ventana.document.close();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        
        <header className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Panel de Control XV Años</h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base">Gestión de invitados y pases digitales</p>
          </div>
          <div className="flex gap-2 flex-wrap w-full lg:w-auto">
            <div className="bg-gray-100 text-gray-700 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold text-xs md:text-sm flex-1 text-center">
              Total: {invitados.length}
            </div>
            <div className="bg-green-100 text-green-700 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold text-xs md:text-sm flex-1 text-center">
              Confirmados: {totalConfirmados}
            </div>
            <div className="bg-yellow-100 text-yellow-700 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold text-xs md:text-sm flex-1 text-center">
              Pendientes: {totalPendientes}
            </div>
            <div className="bg-red-100 text-red-700 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold text-xs md:text-sm flex-1 text-center">
              Rechazados: {totalRechazados}
            </div>
          </div>
        </header>

        <section className={`p-4 md:p-6 rounded-xl shadow-sm border transition-colors ${editandoId ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}>
          <h2 className={`text-lg md:text-xl font-semibold mb-4 ${editandoId ? 'text-blue-700' : 'text-gray-700'}`}>
            {editandoId ? `Editando a: ${nombreInvitado}` : 'Añadir Nuevo Invitado'}
          </h2>
          <form onSubmit={handleGuardarInvitado} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Invitado Principal</label>
              <input type="text" value={nombreInvitado} onChange={(e) => setNombreInvitado(e.target.value)} placeholder="Ej. Familia Pérez" className="w-full lg:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm md:text-base" required />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Pases de Acompañantes Extras</label>
              {acompanantes.map((acompanante, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input type="text" value={acompanante} onChange={(e) => actualizarAcompanante(index, e.target.value)} placeholder={`Acompañante ${index + 1}`} className="w-full lg:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm md:text-base" />
                  <button type="button" onClick={() => eliminarCampoAcompanante(index)} className="text-red-500 hover:text-red-700 font-bold px-3 py-2 bg-red-50 rounded-lg">X</button>
                </div>
              ))}
              <button type="button" onClick={agregarCampoAcompanante} className="text-purple-600 hover:text-purple-800 text-sm font-semibold mt-2 bg-purple-50 px-4 py-2 rounded-lg">+ Añadir espacio extra</button>
            </div>

            <div className="pt-4 flex flex-col md:flex-row gap-3">
              <button type="submit" disabled={cargando} className={`w-full md:w-auto ${editandoId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'} text-white font-semibold py-2.5 px-6 rounded-lg disabled:opacity-50 transition-colors`}>
                {cargando ? 'Guardando...' : (editandoId ? 'Actualizar Invitado' : 'Guardar Invitación')}
              </button>
              {editandoId && (
                <button type="button" onClick={cancelarEdicion} className="w-full md:w-auto bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 px-6 rounded-lg transition-colors">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-700">Lista de Invitados</h2>
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                placeholder="🔍 Buscar nombre..." 
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm md:text-base"
              />
              <button onClick={imprimirLista} className="w-full sm:w-auto bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                🖨️ Imprimir Lista
              </button>
            </div>
          </div>

          {/* VISTA MÓVIL */}
          <div className="block md:hidden p-4 space-y-4 bg-gray-50">
            {invitadosFiltrados.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">No se encontraron resultados.</p>
            ) : (
              invitadosFiltrados.map((invitado) => (
                <div key={invitado.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative">
                  <div className="absolute top-4 right-4">
                     <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${invitado.estatus === 'confirmado' ? 'bg-green-100 text-green-700' : invitado.estatus === 'rechazado' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {invitado.estatus}
                     </span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg pr-20 mb-2">{invitado.nombre}</h3>
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Acompañantes:</p>
                    {invitado.acompanantes?.length > 0 ? (
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {invitado.acompanantes.map((acomp, idx) => (
                          <li key={idx} className={!acomp.nombre ? 'italic text-gray-400' : ''}>{acomp.nombre || '(Pase sin nombre)'}</li>
                        ))}
                      </ul>
                    ) : <span className="text-gray-400 text-sm">Sin acompañantes</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                    <button onClick={() => copiarEnlace(invitado.id)} className="bg-gray-100 text-gray-700 py-1.5 px-3 rounded-lg text-xs font-semibold flex-1 text-center">📋 Link</button>
                    {invitado.estatus !== 'rechazado' && (
                       <button onClick={() => descargarQR(invitado.id, invitado.nombre)} className="bg-purple-50 text-purple-700 py-1.5 px-3 rounded-lg text-xs font-semibold flex-1 text-center">⬇️ QR</button>
                    )}
                    <button onClick={() => iniciarEdicion(invitado)} className="bg-blue-50 text-blue-700 py-1.5 px-3 rounded-lg text-xs font-semibold flex-1 text-center">✏️ Editar</button>
                    <button onClick={() => eliminarInvitado(invitado.id)} className="bg-red-50 text-red-700 py-1.5 px-3 rounded-lg text-xs font-semibold flex-1 text-center">🗑️ Borrar</button>
                    <div className="hidden"><QRCodeSVG id={`qr-${invitado.id}`} value={`${baseUrl}/rsvp/${invitado.id}`} size={256} level="H" /></div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* VISTA ESCRITORIO */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                  <th className="p-4 font-semibold">Invitado Principal</th>
                  <th className="p-4 font-semibold">Pases / Acompañantes</th>
                  <th className="p-4 font-semibold">Estatus</th>
                  <th className="p-4 font-semibold">Enlace RSVP</th>
                  <th className="p-4 font-semibold">QR</th>
                  <th className="p-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invitadosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                      {busqueda ? 'No se encontraron resultados para tu búsqueda.' : 'No hay invitados registrados aún.'}
                    </td>
                  </tr>
                ) : (
                  invitadosFiltrados.map((invitado) => {
                    return (
                      <tr key={invitado.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4 font-medium text-gray-800">{invitado.nombre}</td>
                        <td className="p-4 text-gray-600">
                          {invitado.acompanantes?.length > 0 ? (
                            <ul className="list-disc list-inside text-sm">
                              {invitado.acompanantes.map((acomp, idx) => (
                                <li key={idx} className={!acomp.nombre ? 'italic text-gray-400' : ''}>
                                  {acomp.nombre || '(Pase sin nombre)'}
                                </li>
                              ))}
                            </ul>
                          ) : <span className="text-gray-400 text-sm">Sin acompañantes</span>}
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            invitado.estatus === 'confirmado' ? 'bg-green-100 text-green-700' : 
                            invitado.estatus === 'rechazado' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {(invitado.estatus || '').toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4">
                           <button onClick={() => copiarEnlace(invitado.id)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1">
                             📋 Copiar Link
                           </button>
                        </td>
                        <td className="p-4">
                            <div className="hidden"><QRCodeSVG id={`qr-${invitado.id}`} value={`${baseUrl}/rsvp/${invitado.id}`} size={256} level="H" /></div>
                            {invitado.estatus !== 'rechazado' && (
                              <button onClick={() => descargarQR(invitado.id, invitado.nombre)} className="text-purple-600 hover:text-purple-800 text-sm font-semibold">Descargar QR</button>
                            )}
                        </td>
                        <td className="p-4 flex gap-3 justify-center items-center h-full pt-6">
                           <button onClick={() => iniciarEdicion(invitado)} className="text-blue-500 hover:text-blue-700 text-sm font-semibold">Editar</button>
                           <button onClick={() => eliminarInvitado(invitado.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold">Borrar</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}