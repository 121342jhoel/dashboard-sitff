import './App.css';
import { 
  MapContainer, TileLayer, Marker, Popup, Polygon, Circle, Polyline, LayerGroup 
} from 'react-leaflet';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import 'leaflet/dist/leaflet.css';
import { useState, useMemo } from 'react';
import L from 'leaflet';

// =====================================================================
// BLOQUE 1: DATOS Y CONFIGURACIONES CENTRALES
// =====================================================================
const iconoEstrella = new L.DivIcon({ html: '⭐', className: 'dummy', iconSize: [24, 24] });
const iconoCamion = new L.DivIcon({ html: '🚚', className: 'dummy', iconSize: [35, 35] }); 
const iconoFuego = new L.DivIcon({ html: '🔥', className: 'dummy', iconSize: [24, 24] });

const huanucoPosition = [-9.9306, -76.2422];
const mapasUrl = {
  osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  satelite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
};

const nombresTitulares = ['Maderera Amazonas SAC', 'Consorcio Forestal El Shaddai', 'Inversiones Madereras Los Pinos', 'Juan Carlos Perez', 'Maderas de Oriente EIRL'];
const generarConcesiones = () => {
  const lista = [];
  for(let i = 1; i <= 80; i++) {
    const lat = -3 - (Math.random() * 8); const lng = -73 - (Math.random() * 4);
    lista.push({
      id: i, codigo: `ATF-2026-${1000 + i}`, titular: nombresTitulares[Math.floor(Math.random() * nombresTitulares.length)],
      expediente: `EXP-00${i}-2026-UGFFS`, resolucion: `RD N° 1${i}-2026-GRH`, enlace: `https://sitff.gob.pe/expediente/${1000 + i}`,
      estado: Math.random() > 0.15 ? 'Vigente' : 'Suspendido', color: '#558b2f', coordenadas: [ [lat, lng], [lat, lng + 0.1], [lat - 0.1, lng + 0.1], [lat - 0.1, lng] ]
    });
  }
  return lista;
};

const puntosControl = [
  { id: 1, nombre: 'Puesto de Control - Rancho', ubicacion: [-9.83, -76.12], ultima_fecha: '17/10/2026 08:30 AM', inspector: 'Insp. Carlos Rey' },
  { id: 2, nombre: 'Puesto de Control - Ambo', ubicacion: [-10.13, -76.20], ultima_fecha: '16/10/2026 14:45 PM', inspector: 'Insp. Ana Gómez' },
];

const intervencionesNacionales = [
  { id: 1, ubicacion: [-8.38, -74.53], fecha: '15/10/2026', motivo: 'Tala Ilegal' },
  { id: 2, ubicacion: [-10.88, -75.25], fecha: '12/10/2026', motivo: 'Guía Falsificada' }
];

const puntosCalor = [
  { ubi: [-9.40, -75.50], radio1: 45000, radio2: 25000, radio3: 8000, nombre: 'Hotspot Puerto Inca (Madera)' },
  { ubi: [-8.50, -74.80], radio1: 60000, radio2: 35000, radio3: 12000, nombre: 'Hotspot Frontera Ucayali (Fauna/Madera)' },
  { ubi: [-9.10, -75.90], radio1: 30000, radio2: 15000, radio3: 5000, nombre: 'Hotspot Tingo María (Fauna)' }
];

const flotaCamiones = [
  { id: 1, titular: 'Maderas del Oriente', placa: 'W5M-430', conductor: 'Carlos Gómez', carga: '12.5 m³ (Tornillo)', rutaTxt: 'Puerto Inca ➔ Huánuco', posicion: [-9.65, -75.80], rutaGPS: [[-9.38, -74.96], [-9.50, -75.20], [-9.65, -75.80], [-9.83, -76.12], [-9.93, -76.24]], color: '#00bcd4' }
];

// NUEVA DATA: INCENDIOS FORESTALES
const incendiosActivos = [
  { id: 1, ubi: [-9.55, -75.10], radio: 4000, severidad: 'Alta', fecha: 'Actualizado hace 5 min' },
  { id: 2, ubi: [-8.90, -74.90], radio: 6000, severidad: 'Extrema', fecha: 'Actualizado hace 2 min' },
  { id: 3, ubi: [-9.20, -75.80], radio: 2000, severidad: 'Media', fecha: 'Actualizado hace 15 min' }
];
// =====================================================================
// BLOQUE 2: COMPONENTE MAPA (Panel SISFOR e Interacción Completa)
// =====================================================================
function ComponenteMapa({ capasActivas, toggleCapa, tipoMapa }) {
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);
  const [panelCapasAbierto, setPanelCapasAbierto] = useState(true);
  const concesiones = useMemo(() => generarConcesiones(), []);

  return (
    <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '2px solid #ccc', position: 'relative' }}>
      
      {/* VENTANA FLOTANTE: CONTROL DE CAPAS (ESTILO SISFOR) */}
      {panelCapasAbierto && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000, backgroundColor: 'white', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', width: '280px', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ backgroundColor: '#1565c0', color: 'white', padding: '12px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}>
            <span>Control de capas</span>
            <span onClick={() => setPanelCapasAbierto(false)} style={{ cursor: 'pointer', fontSize: '14px' }}>❌</span>
          </div>
          <div style={{ padding: '15px', maxHeight: '400px', overflowY: 'auto', fontSize: '13px', color: '#333' }}>
            
            <div style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: '8px' }}>➖ MONITOREO DE RIESGOS</div>
            <div style={{ paddingLeft: '15px', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" checked={capasActivas.incendios} onChange={()=>toggleCapa('incendios')} /> 🔥 Incendios Forestales (En Vivo)
              </label>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" checked={capasActivas.mapaCalor} onChange={()=>toggleCapa('mapaCalor')} /> 🔴 Mapa de Calor (Tala Ilegal)
              </label>
            </div>

            <div style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: '8px' }}>➖ CATEGORÍAS TERRITORIALES</div>
            <div style={{ paddingLeft: '15px', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" checked={capasActivas.concesiones} onChange={()=>toggleCapa('concesiones')} /> 🟩 Petitorios y Concesiones
              </label>
            </div>

            <div style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: '8px' }}>➖ SUPERVISIONES Y TRANSPORTE</div>
            <div style={{ paddingLeft: '15px', marginBottom: '5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" checked={capasActivas.rutasEnVivo} onChange={()=>toggleCapa('rutasEnVivo')} /> 🚛 Flota de Transporte (GPS)
              </label>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" checked={capasActivas.puntosControl} onChange={()=>toggleCapa('puntosControl')} /> 📍 Puestos de Control ATFFS
              </label>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" checked={capasActivas.intervenciones} onChange={()=>toggleCapa('intervenciones')} /> ⭐ Intervenciones Históricas
              </label>
            </div>
          </div>
        </div>
      )}

      {!panelCapasAbierto && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000 }}>
          <button onClick={() => setPanelCapasAbierto(true)} style={{ backgroundColor: 'white', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', border: '2px solid #1565c0', color: '#1565c0', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
            📚 Mostrar Capas
          </button>
        </div>
      )}

      {/* BUSCADOR DE ATF RESTAURADO */}
      <div style={{ position: 'absolute', top: '10px', left: '50px', zIndex: 1000 }}>
        <button onClick={() => setBuscadorAbierto(!buscadorAbierto)} style={{ backgroundColor: 'white', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', border: '2px solid rgba(0,0,0,0.2)' }}>🔍 Buscar ATF</button>
        {buscadorAbierto && (
          <div style={{ position: 'absolute', top: '40px', left: '0', backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', width: '250px' }}>
            <h4 style={{ margin: '0 0 10px 0', borderBottom: '2px solid #2e7d32', color: '#1b5e20' }}>🔍 Buscar Petitorio Forestal</h4>
            <input type="text" placeholder="Código (Ej. ATF...)" style={{ width: '90%', padding: '4px', marginBottom: '8px' }} />
            <button style={{ padding: '6px', backgroundColor: '#2e7d32', color: 'white', border: 'none', cursor: 'pointer', width: '100%' }}>Buscar</button>
          </div>
        )}
      </div>

      <MapContainer center={huanucoPosition} zoom={7} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer url={mapasUrl[tipoMapa]} />
        
        {/* INCENDIOS EN VIVO (CON POPUP) */}
        {capasActivas.incendios && (
          <LayerGroup>
            {incendiosActivos.map((inc) => (
              <LayerGroup key={`incendio-${inc.id}`}>
                <Circle center={inc.ubi} radius={inc.radio} pathOptions={{ color: 'transparent', fillColor: '#ff3d00', fillOpacity: 0.5 }}>
                  <Popup>
                    <strong style={{color:'#d84315', fontSize:'14px'}}>🔥 Alerta de Incendio</strong><br/>
                    <strong>Severidad:</strong> {inc.severidad}<br/>
                    <strong>Detección:</strong> Satélite VIIRS<br/>
                    {inc.fecha}
                  </Popup>
                </Circle>
                <Marker position={inc.ubi} icon={iconoFuego} />
              </LayerGroup>
            ))}
          </LayerGroup>
        )}

        {/* MAPA DE CALOR (CON POPUP) */}
        {capasActivas.mapaCalor && (
          <LayerGroup>
            {puntosCalor.map((calor, idx) => (
              <LayerGroup key={`calor-${idx}`}>
                <Circle center={calor.ubi} radius={calor.radio1} pathOptions={{ color: 'transparent', fillColor: 'red', fillOpacity: 0.15 }} />
                <Circle center={calor.ubi} radius={calor.radio2} pathOptions={{ color: 'transparent', fillColor: 'orange', fillOpacity: 0.3 }} />
                <Circle center={calor.ubi} radius={calor.radio3} pathOptions={{ color: 'transparent', fillColor: 'yellow', fillOpacity: 0.6 }}>
                  <Popup><strong style={{color:'red'}}>🔥 {calor.nombre}</strong><br/>Alta concentración de tráfico ilegal reportado.</Popup>
                </Circle>
              </LayerGroup>
            ))}
          </LayerGroup>
        )}

        {/* UBER MADERERO (CON POPUP RESTAURADO) */}
        {capasActivas.rutasEnVivo && (
          <LayerGroup>
            {flotaCamiones.map((camion) => (
              <LayerGroup key={`camion-${camion.id}`}>
                <Polyline positions={camion.rutaGPS} pathOptions={{ color: camion.color, weight: 4, dashArray: '10, 10' }} />
                <Marker position={camion.posicion} icon={iconoCamion}>
                  <Popup>
                    <div style={{ minWidth: '220px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `2px solid ${camion.color}`, paddingBottom: '8px', marginBottom: '8px' }}>
                        <div style={{ width: '12px', height: '12px', backgroundColor: '#00e676', borderRadius: '50%', boxShadow: '0 0 8px #00e676' }}></div>
                        <strong style={{ fontSize: '15px', color: '#1565c0' }}>En tránsito (GPS Activo)</strong>
                      </div>
                      <strong>Titular:</strong> {camion.titular}<br/>
                      <strong>Placa:</strong> {camion.placa} | <strong>Conductor:</strong> {camion.conductor}<br/>
                      <strong>Carga:</strong> {camion.carga}<br/>
                      <strong>Ruta:</strong> {camion.rutaTxt}<br/>
                    </div>
                  </Popup>
                </Marker>
              </LayerGroup>
            ))}
          </LayerGroup>
        )}

        {/* CONCESIONES FORESTALES (CON POPUP RESTAURADO) */}
        {capasActivas.concesiones && (
          <LayerGroup>
            {concesiones.map((c) => (
              <Polygon key={c.id} positions={c.coordenadas} pathOptions={{ color: c.color, weight: 1, fillColor: c.color, fillOpacity: 0.3 }}>
                <Popup>
                  <div style={{ fontSize: '13px' }}>
                    <strong style={{ color: '#2e7d32' }}>📋 PETITORIO FORESTAL</strong><br/>
                    <strong>Código:</strong> {c.codigo}<br/>
                    <strong>Titular:</strong> {c.titular}<br/>
                    <strong>Expediente:</strong> {c.expediente}<br/>
                    <strong>Resolución:</strong> {c.resolucion}<br/>
                    <strong>Estado:</strong> <span style={{ color: c.estado==='Vigente'?'green':'red'}}>{c.estado}</span><br/><br/>
                    <a href={c.enlace} target="_blank" rel="noreferrer" style={{ backgroundColor: '#1565c0', color: 'white', padding: '4px 8px', textDecoration: 'none', borderRadius: '4px', display: 'inline-block' }}>
                      📄 Ver Expediente Digital
                    </a>
                  </div>
                </Popup>
              </Polygon>
            ))}
          </LayerGroup>
        )}

        {/* PUESTOS E INTERVENCIONES (CON POPUPS RESTAURADOS) */}
        <LayerGroup>
          {capasActivas.puntosControl && puntosControl.map((pc) => (
            <Marker key={pc.id} position={pc.ubicacion}>
              <Popup>
                <div style={{ fontSize: '13px' }}>
                  <strong style={{ color: '#1565c0' }}>📍 {pc.nombre}</strong><br/>
                  <strong>Inspector:</strong> {pc.inspector}<br/>
                  <strong>Última act:</strong> {pc.ultima_fecha}
                </div>
              </Popup>
            </Marker>
          ))}
          {capasActivas.intervenciones && intervencionesNacionales.map((int) => (
            <Marker key={int.id} position={int.ubicacion} icon={iconoEstrella}>
              <Popup>
                <div style={{ fontSize: '13px' }}>
                  <strong style={{ color: '#d32f2f' }}>🚨 {int.motivo}</strong><br/>
                  <strong>Fecha:</strong> {int.fecha}
                </div>
              </Popup>
            </Marker>
          ))}
        </LayerGroup>
      </MapContainer>
    </div>
  );
}

// =====================================================================
// BLOQUE 3: COMPONENTE GUÍA DE TRANSPORTE (Con Visor y Asistente 4 Pasos)
// =====================================================================
function ComponenteGTF() {
  const [vistaGTF, setVistaGTF] = useState('portada'); // 'portada', 'nueva', 'detalle'
  const [paso, setPaso] = useState(1);
  const [trozas, setTrozas] = useState([]);
  const [formTroza, setFormTroza] = useState({ especie: 'Tornillo', dMayor: '', dMenor: '', longitud: '' });
  const [guiaSeleccionada, setGuiaSeleccionada] = useState(null);

  const guiasActivas = [
    { 
      id: 'GTF-00124', titular: 'Maderas del Oriente', vehiculo: 'W5M-430', ruta: 'Puerto Inca ➔ Huánuco', 
      estado: 'En Tránsito (GPS)', permiso: 'ATF-2026-1045', origen: 'Bosque Sector Puerto Inca', 
      destino: 'Aserradero Industrial Huánuco', conductor: 'Carlos Gómez', licencia: 'Q45678912', 
      trozas: [
        { id: 1, especie: 'Tornillo', dMayor: '60', dMenor: '50', longitud: '5.0', volumen: '1.188' }, 
        { id: 2, especie: 'Tornillo', dMayor: '65', dMenor: '55', longitud: '5.5', volumen: '1.555' }
      ], 
      volumenTotal: '2.743' 
    },
    { 
      id: 'GTF-00125', titular: 'Consorcio Forestal El Shaddai', vehiculo: 'F3A-890', ruta: 'Pucallpa ➔ Tingo María', 
      estado: 'En Tránsito (GPS)', permiso: 'ATF-2026-1088', origen: 'Concesión Forestal Pucallpa', 
      destino: 'Planta Transformación Tingo María', conductor: 'Luis Rojas', licencia: 'Q12345678', 
      trozas: [
        { id: 1, especie: 'Lupuna', dMayor: '80', dMenor: '70', longitud: '6.0', volumen: '2.651' }, 
        { id: 2, especie: 'Lupuna', dMayor: '85', dMenor: '75', longitud: '6.0', volumen: '3.016' }
      ], 
      volumenTotal: '5.667' 
    },
    { 
      id: 'GTF-00126', titular: 'Reforesta Perú S.A.', vehiculo: 'T2B-112', ruta: 'Atalaya ➔ Puerto Inca', 
      estado: 'Descargado', permiso: 'ATF-2026-2001', origen: 'Bosque Manejado Atalaya', 
      destino: 'Acopio Puerto Inca', conductor: 'Miguel Aliaga', licencia: 'Q98765432', 
      trozas: [
        { id: 1, especie: 'Cedro', dMayor: '50', dMenor: '40', longitud: '4.0', volumen: '0.636' }
      ], 
      volumenTotal: '0.636' 
    }
  ];

  const agregarTroza = () => {
    if(!formTroza.dMayor || !formTroza.dMenor || !formTroza.longitud) return alert('Llene todas las medidas de la troza');
    const promedioDiametroM = ((parseFloat(formTroza.dMayor) + parseFloat(formTroza.dMenor)) / 2) / 100; 
    const volumenCalculado = (Math.PI * Math.pow(promedioDiametroM / 2, 2)) * parseFloat(formTroza.longitud);
    setTrozas([...trozas, { id: Date.now(), ...formTroza, volumen: volumenCalculado.toFixed(3) }]);
    setFormTroza({ especie: 'Tornillo', dMayor: '', dMenor: '', longitud: '' }); // Limpia los campos
  };

  const volumenTotalCalculado = trozas.reduce((acc, curr) => acc + parseFloat(curr.volumen), 0).toFixed(3);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ----------------------------------------------------- */}
      {/* VISTA: PORTADA DE GUÍAS DE TRANSPORTE */}
      {/* ----------------------------------------------------- */}
      {vistaGTF === 'portada' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ color: '#2e7d32', marginTop: 0, marginBottom: '5px' }}>
                Guías de Transporte Forestal (GTF)
              </h1>
              <p style={{ color: '#666', marginTop: 0 }}>
                Registro centralizado de guías emitidas y vehículos en tránsito.
              </p>
            </div>
            <button 
              onClick={() => setVistaGTF('nueva')} 
              style={{ backgroundColor: '#1565c0', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              + Emitir Nueva Guía (Digital)
            </button>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#2e7d32', color: 'white' }}>
                <tr>
                  <th style={{ padding: '12px 15px' }}>N° Guía (GTF)</th>
                  <th style={{ padding: '12px 15px' }}>Titular Concesión</th>
                  <th style={{ padding: '12px 15px' }}>Vehículo (Placa)</th>
                  <th style={{ padding: '12px 15px' }}>Ruta Declarada</th>
                  <th style={{ padding: '12px 15px' }}>Estado</th>
                  <th style={{ padding: '12px 15px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {guiasActivas.map((row, index) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? '#fafafa' : 'white' }}>
                    <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#1565c0' }}>{row.id}</td>
                    <td style={{ padding: '12px 15px' }}>{row.titular}</td>
                    <td style={{ padding: '12px 15px' }}>{row.vehiculo}</td>
                    <td style={{ padding: '12px 15px' }}>{row.ruta}</td>
                    <td style={{ padding: '12px 15px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', 
                        backgroundColor: row.estado.includes('GPS') ? '#e0f7fa' : '#e8f5e9', 
                        color: row.estado.includes('GPS') ? '#00838f' : '#2e7d32' 
                      }}>
                        {row.estado}
                      </span>
                    </td>
                    <td style={{ padding: '12px 15px' }}>
                      <button 
                        onClick={() => { setGuiaSeleccionada(row); setVistaGTF('detalle'); }} 
                        style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        👁️ Ver Guía
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ----------------------------------------------------- */}
      {/* VISTA: DETALLE DE LA GUÍA DE TRANSPORTE */}
      {/* ----------------------------------------------------- */}
      {vistaGTF === 'detalle' && guiaSeleccionada && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button 
                onClick={() => setVistaGTF('portada')} 
                style={{ padding: '8px 15px', backgroundColor: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ⬅ Volver
              </button>
              <h2 style={{ color: '#2e7d32', margin: 0 }}>
                Guía de Transporte N° {guiaSeleccionada.id}
              </h2>
            </div>
            <button 
              onClick={() => alert('Descargando PDF Oficial...')} 
              style={{ backgroundColor: '#d32f2f', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
            >
              📥 Descargar GTF en PDF
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {/* Columna Izquierda */}
            <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', borderTop: '4px solid #1b5e20' }}>
                <h3 style={{ marginTop: 0, color: '#1b5e20' }}>📍 Bloque 1: Ruta y Legalidad</h3>
                <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#444' }}>
                  <strong>Titular de Concesión:</strong> {guiaSeleccionada.titular}<br/>
                  <strong>N° de Permiso ATF:</strong> {guiaSeleccionada.permiso}<br/>
                  <strong>Origen:</strong> {guiaSeleccionada.origen}<br/>
                  <strong>Destino:</strong> {guiaSeleccionada.destino}<br/>
                </div>
              </div>

              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', borderTop: '4px solid #f57c00' }}>
                <h3 style={{ marginTop: 0, color: '#f57c00' }}>🚚 Bloque 2: Transporte</h3>
                <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#444' }}>
                  <strong>Conductor:</strong> {guiaSeleccionada.conductor}<br/>
                  <strong>Licencia:</strong> {guiaSeleccionada.licencia}<br/>
                  <strong>Placa del Vehículo:</strong> <span style={{ backgroundColor: '#fff9c4', padding: '2px 6px', border: '1px solid #fbc02d', borderRadius: '4px', fontWeight: 'bold' }}>{guiaSeleccionada.vehiculo}</span><br/>
                </div>
              </div>
            </div>

            {/* Columna Derecha */}
            <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', borderTop: '4px solid #1565c0' }}>
                <h3 style={{ marginTop: 0, color: '#1565c0' }}>🪵 Bloque 3: Producto Forestal</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', border: '1px solid #ddd', fontSize: '13px' }}>
                  <thead style={{ backgroundColor: '#e3f2fd', color: '#1565c0' }}>
                    <tr>
                      <th>N°</th>
                      <th>Especie</th>
                      <th>D. Mayor (cm)</th>
                      <th>D. Menor (cm)</th>
                      <th>Largo (m)</th>
                      <th>Vol (m³)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guiaSeleccionada.trozas.map((t, index) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '6px' }}>{index + 1}</td>
                        <td style={{ padding: '6px' }}>{t.especie}</td>
                        <td style={{ padding: '6px' }}>{t.dMayor}</td>
                        <td style={{ padding: '6px' }}>{t.dMenor}</td>
                        <td style={{ padding: '6px' }}>{t.longitud}</td>
                        <td style={{ padding: '6px', fontWeight: 'bold' }}>{t.volumen}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ textAlign: 'right', marginTop: '10px', fontSize: '16px' }}>
                  <strong>Volumen Total:</strong> <span style={{ color: '#c62828' }}>{guiaSeleccionada.volumenTotal} m³</span>
                </div>
              </div>

              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', borderTop: '4px solid #8e24aa' }}>
                <h3 style={{ marginTop: 0, color: '#8e24aa' }}>📸 Bloque 4: Evidencias Digitales</h3>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1, backgroundColor: '#f3e5f5', padding: '15px', textAlign: 'center', borderRadius: '6px', border: '1px solid #ce93d8' }}>
                    <div style={{ fontSize: '24px' }}>📷</div>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6a1b9a' }}>Foto_Vehiculo.jpg</span>
                  </div>
                  <div style={{ flex: 1, backgroundColor: '#f3e5f5', padding: '15px', textAlign: 'center', borderRadius: '6px', border: '1px solid #ce93d8' }}>
                    <div style={{ fontSize: '24px' }}>📄</div>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6a1b9a' }}>Guia_Fisica_Escaneada.pdf</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ----------------------------------------------------- */}
      {/* VISTA: NUEVA GUÍA DE TRANSPORTE (ASISTENTE 4 PASOS) */}
      {/* ----------------------------------------------------- */}
      {vistaGTF === 'nueva' && (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <button 
              onClick={() => setVistaGTF('portada')} 
              style={{ padding: '8px 15px', backgroundColor: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ⬅ Volver
            </button>
            <h2 style={{ color: '#2e7d32', margin: 0 }}>Asistente de Emisión de GTF</h2>
          </div>

          {/* Menú de Pasos (Wizard) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
            {[1, 2, 3, 4].map((num) => (
              <div 
                key={num} 
                onClick={() => setPaso(num)} 
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: paso >= num ? '#1565c0' : '#aaa', fontWeight: paso === num ? 'bold' : 'normal' }}
              >
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: paso >= num ? '#1565c0' : '#eee', color: paso >= num ? 'white' : '#888', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
                  {num}
                </div>
                {num === 1 && '1. Ruta y Legalidad'} 
                {num === 2 && '2. Transporte'} 
                {num === 3 && '3. Producto Forestal'} 
                {num === 4 && '4. Evidencias'}
              </div>
            ))}
          </div>

          {/* PASO 1 */}
          {paso === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '600px' }}>
              <h3 style={{ color: '#444' }}>📍 Bloque 1: Ruta y Respaldo Legal</h3>
              <label><strong>N° Permiso / Concesión ATF:</strong></label>
              <input type="text" defaultValue="ATF-2026-1045" style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label><strong>Origen:</strong></label>
                  <input type="text" defaultValue="Bosque Sector Puerto Inca" style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label><strong>Destino:</strong></label>
                  <input type="text" defaultValue="Aserradero Industrial Huánuco" style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>
              </div>
              <button 
                onClick={() => setPaso(2)} 
                style={{ backgroundColor: '#2e7d32', color: 'white', padding: '12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}
              >
                Siguiente: Transporte ➔
              </button>
            </div>
          )}

          {/* PASO 2 */}
          {paso === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '600px' }}>
              <h3 style={{ color: '#444' }}>🚚 Bloque 2: Datos del Transportista</h3>
              <div style={{ backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '6px', border: '1px dashed #1565c0' }}>
                <label style={{ color: '#1565c0', fontWeight: 'bold' }}>Buscar Conductor Registrado:</label>
                <select style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #90caf9', marginTop: '10px' }}>
                  <option>Carlos Gómez - DNI 45678912</option>
                  <option>Miguel Rojas - DNI 78945612</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label><strong>Placa Vehículo:</strong></label>
                  <input type="text" defaultValue="W5M-430" readOnly style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f5f5f5' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label><strong>Licencia de Conducir:</strong></label>
                  <input type="text" defaultValue="Q45678912" readOnly style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f5f5f5' }} />
                </div>
              </div>
              <button 
                onClick={() => setPaso(3)} 
                style={{ backgroundColor: '#2e7d32', color: 'white', padding: '12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}
              >
                Siguiente: Detalle de Carga ➔
              </button>
            </div>
          )}

          {/* PASO 3 */}
          {paso === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 style={{ color: '#444' }}>🪵 Bloque 3: Cubicación de Trozas (Auto-cálculo)</h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', backgroundColor: '#f9fbe7', padding: '15px', borderRadius: '6px', border: '1px solid #c5e1a5' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Especie</label>
                  <select value={formTroza.especie} onChange={e=>setFormTroza({...formTroza, especie: e.target.value})} style={{ padding: '8px', width: '120px' }}>
                    <option>Tornillo</option>
                    <option>Cedro</option>
                    <option>Caoba</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>D. Mayor (cm)</label>
                  <input type="number" value={formTroza.dMayor} onChange={e=>setFormTroza({...formTroza, dMayor: e.target.value})} placeholder="Ej: 60" style={{ padding: '8px', width: '90px' }}/>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>D. Menor (cm)</label>
                  <input type="number" value={formTroza.dMenor} onChange={e=>setFormTroza({...formTroza, dMenor: e.target.value})} placeholder="Ej: 50" style={{ padding: '8px', width: '90px' }}/>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Longitud (m)</label>
                  <input type="number" value={formTroza.longitud} onChange={e=>setFormTroza({...formTroza, longitud: e.target.value})} placeholder="Ej: 5" style={{ padding: '8px', width: '90px' }}/>
                </div>
                <button 
                  onClick={agregarTroza} 
                  style={{ backgroundColor: '#1565c0', color: 'white', border: 'none', padding: '9px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  + Añadir
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', border: '1px solid #ddd' }}>
                <thead style={{ backgroundColor: '#2e7d32', color: 'white' }}>
                  <tr>
                    <th>N° Troza</th>
                    <th>Especie</th>
                    <th>D. Mayor (cm)</th>
                    <th>D. Menor (cm)</th>
                    <th>Longitud (m)</th>
                    <th>Volumen (m³)</th>
                  </tr>
                </thead>
                <tbody>
                  {trozas.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '20px', color: '#888' }}>
                        Agregue trozas para calcular el volumen...
                      </td>
                    </tr>
                  ) : null}
                  {trozas.map((t, index) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #ddd' }}>
                      <td>{index + 1}</td>
                      <td>{t.especie}</td>
                      <td>{t.dMayor}</td>
                      <td>{t.dMenor}</td>
                      <td>{t.longitud}</td>
                      <td style={{ fontWeight: 'bold', color: '#1565c0' }}>{t.volumen}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ textAlign: 'right', fontSize: '18px' }}>
                <strong>Volumen Total:</strong> <span style={{ color: '#c62828' }}>{volumenTotalCalculado} m³</span>
              </div>
              <button 
                onClick={() => setPaso(4)} 
                style={{ backgroundColor: '#2e7d32', color: 'white', padding: '12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', maxWidth: '300px' }}
              >
                Siguiente: Evidencias ➔
              </button>
            </div>
          )}

          {/* PASO 4 */}
          {paso === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
              <h3 style={{ color: '#444', margin: 0 }}>📸 Bloque 4: Evidencias Digitales</h3>
              <p style={{ color: '#666', marginTop: 0 }}>Adjunte respaldo visual antes de iniciar ruta.</p>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1, backgroundColor: '#f5f5f5', border: '2px dashed #999', padding: '30px', textAlign: 'center', borderRadius: '8px', cursor: 'pointer' }}>
                  <div style={{ fontSize: '30px', marginBottom: '10px' }}>📷</div>
                  <strong>Foto del Vehículo Cargado</strong>
                </div>
                <div style={{ flex: 1, backgroundColor: '#f5f5f5', border: '2px dashed #999', padding: '30px', textAlign: 'center', borderRadius: '8px', cursor: 'pointer' }}>
                  <div style={{ fontSize: '30px', marginBottom: '10px' }}>📄</div>
                  <strong>Escanear Guía Física (Opcional)</strong>
                </div>
              </div>
              <button 
                onClick={() => { 
                  alert('¡Guía Emitida y Aprobada! El GPS del camión iniciará la transmisión en vivo al Mapa Central.'); 
                  setVistaGTF('portada'); 
                  setPaso(1); 
                  setTrozas([]); 
                }} 
                style={{ backgroundColor: '#f57c00', color: 'white', padding: '15px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px', boxShadow: '0 4px 10px rgba(245, 124, 0, 0.4)' }}
              >
                🚀 Emitir GTF e Iniciar Viaje en Vivo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =====================================================================
// BLOQUE 4: COMPONENTE ESTADÍSTICAS (Filtro Regional, Provincial y Distrital)
// =====================================================================
function ComponenteEstadisticas() {
  // 1. LAS 24 REGIONES DEL PERÚ + CALLAO Y NACIONAL
  const regionesPeru = [
    'Nivel Nacional', 'Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Callao', 'Cusco', 
    'Huancavelica', 'Huánuco', 'Ica', 'Junín', 'La Libertad', 'Lambayeque', 'Lima', 'Loreto', 'Madre de Dios', 
    'Moquegua', 'Pasco', 'Piura', 'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali'
  ];

  // 2. BASE DE DATOS UBIGEO (Muestra de Regiones Forestales Clave y Huánuco Completo)
  const baseUbigeo = {
    'Huánuco': {
      'Huánuco': ['Huánuco', 'Amarilis', 'Chinchao', 'Churubamba', 'Margos', 'Quisqui', 'San Francisco de Cayrán', 'San Pedro de Chaulán', 'Santa María del Valle', 'Yarumayo', 'Pillco Marca', 'Yacus'],
      'Ambo': ['Ambo', 'Cayna', 'Colpas', 'Conchamarca', 'Huácar', 'San Francisco', 'San Rafael', 'Tomay Kichwa'],
      'Leoncio Prado': ['Rupa-Rupa', 'Daniel Alomía Robles', 'Hermilio Valdizán', 'José Crespo y Castillo', 'Luyando', 'Mariano Dámaso Beraún', 'Pucayacu', 'Pueblo Nuevo', 'Santo Domingo de Anda', 'Castillo Grande'],
      'Puerto Inca': ['Puerto Inca', 'Codo del Pozuzo', 'Honoría', 'Tournavista', 'Yuyapichis'],
      'Pachitea': ['Panao', 'Chaglla', 'Molino', 'Umari'],
      'Dos de Mayo': ['La Unión', 'Chuquis', 'Marías', 'Pachas', 'Quivilla', 'Ripan', 'Shunqui', 'Sillapata', 'Yanas'],
      'Huacaybamba': ['Huacaybamba', 'Canchabamba', 'Cochabamba', 'Pinra'],
      'Huamalíes': ['Llata', 'Arancay', 'Chavín de Pariarca', 'Jacas Grande', 'Jircan', 'Miraflores', 'Monzón', 'Punchao', 'Puños', 'Singa', 'Tantamayo'],
      'Marañón': ['Huacrachuco', 'Cholon', 'San Buenaventura', 'La Morada', 'Santa Rosa de Alto Yanajanca'],
      'Lauricocha': ['Jesús', 'Baños', 'Jivia', 'Queropalca', 'Rondos', 'San Francisco de Asís', 'San Miguel de Cauri'],
      'Yarowilca': ['Chavinillo', 'Cahuac', 'Chacabamba', 'Aparicio Pomares', 'Jacas Chico', 'Obas', 'Pampamarca', 'Choras']
    },
    'Ucayali': {
      'Coronel Portillo': ['Callería', 'Campoverde', 'Iparía', 'Masisea', 'Yarinacocha', 'Nueva Requena', 'Manantay'],
      'Atalaya': ['Raymondi', 'Sepahua', 'Tahuanía', 'Yurúa'],
      'Padre Abad': ['Padre Abad', 'Irázola', 'Curimaná', 'Neshuya', 'Alexander von Humboldt'],
      'Purús': ['Purús']
    },
    'Loreto': {
      'Maynas': ['Iquitos', 'Alto Nanay', 'Fernando Lores', 'Indiana', 'Las Amazonas', 'Mazán', 'Napo', 'Punchana', 'Putumayo', 'Torres Causana', 'Belén', 'San Juan Bautista'],
      'Alto Amazonas': ['Yurimaguas', 'Balsapuerto', 'Jeberos', 'Lagunas', 'Santa Cruz', 'Teniente César López Rojas'],
      'Loreto': ['Nauta', 'Parinari', 'Tigre', 'Trompeteros', 'Urarinas'],
      'Requena': ['Requena', 'Alto Tapiche', 'Capelo', 'Emilio San Martín', 'Maquía', 'Puinahua', 'Saquena', 'Soplin', 'Tapiche', 'Yaquerana']
    },
    'San Martín': {
      'Moyobamba': ['Moyobamba', 'Calzada', 'Habana', 'Jepelacio', 'Soritor', 'Yantaló'],
      'San Martín': ['Tarapoto', 'Alberto Leveau', 'Cacatachi', 'Chazuta', 'Chipurana', 'El Porvenir', 'Huimbayoc', 'Juan Guerra', 'La Banda de Shilcayo', 'Morales', 'Papaplaya', 'San Antonio', 'Sauce', 'Shapaja'],
      'Tocache': ['Tocache', 'Nuevo Progreso', 'Pólvora', 'Shunte', 'Uchiza']
    },
    'Madre de Dios': {
      'Tambopata': ['Tambopata', 'Inambari', 'Las Piedras', 'Laberinto'],
      'Manu': ['Manu', 'Fitzcarrald', 'Madre de Dios', 'Huepetuhe'],
      'Tahuamanu': ['Iñapari', 'Iberia', 'Tahuamanu']
    }
  };

  // 3. ESTADOS DE LA CASCADA
  const [region, setRegion] = useState('Nivel Nacional');
  const [provincia, setProvincia] = useState('Todas');
  const [distrito, setDistrito] = useState('Todos');

  // Lógica: Si cambia región, se resetea la provincia y el distrito
  const handleRegionChange = (e) => {
    setRegion(e.target.value);
    setProvincia('Todas');
    setDistrito('Todos');
  };

  // Lógica: Si cambia provincia, se resetea el distrito
  const handleProvinciaChange = (e) => {
    setProvincia(e.target.value);
    setDistrito('Todos');
  };

  // 4. GENERADORES DINÁMICOS DE LISTAS
  const provinciasDisponibles = useMemo(() => {
    if (region === 'Nivel Nacional') return [];
    if (baseUbigeo[region]) return Object.keys(baseUbigeo[region]); // Retorna provincias reales
    // Simulador para regiones no mapeadas en el código base (Evita crash de +1890 distritos)
    return [`Provincia 1 de ${region}`, `Provincia 2 de ${region}`, `Provincia 3 de ${region}`];
  }, [region]);

  const distritosDisponibles = useMemo(() => {
    if (region === 'Nivel Nacional' || provincia === 'Todas') return [];
    if (baseUbigeo[region] && baseUbigeo[region][provincia]) return baseUbigeo[region][provincia]; // Retorna distritos reales
    // Simulador de distritos
    return [`Distrito A de ${provincia}`, `Distrito B de ${provincia}`, `Distrito C de ${provincia}`];
  }, [region, provincia]);

  // Datos para gráficas (simulan cambiar con los filtros)
  const topMadera = [ { especie: 'Tornillo', m3: 450 }, { especie: 'Lupuna', m3: 380 }, { especie: 'Cumala', m3: 250 }, { especie: 'Cedro', m3: 190 }, { especie: 'Caoba', m3: 85 } ];
  const topFauna = [ { especie: 'Loro C. Azul', cant: 145 }, { especie: 'Mono Choro', cant: 98 }, { especie: 'Taricaya', cant: 80 }, { especie: 'Sajino', cant: 45 }, { especie: 'Guacamayo', cant: 22 } ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ================= BARRA DE FILTRO UBIGEO (CASCADA) ================= */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
          <div>
            <h2 style={{ color: '#2e7d32', margin: '0 0 5px 0' }}>📍 Análisis Territorial Forense</h2>
            <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>Filtre las estadísticas de decomisos por su delimitación geográfica.</p>
          </div>
          <button onClick={() => alert(`Generando Reporte PDF para: ${region} > ${provincia} > ${distrito}`)} style={{ backgroundColor: '#1565c0', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            📥 Descargar Reporte Ejecutivo
          </button>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', backgroundColor: '#f9fbe7', padding: '15px', borderRadius: '6px', border: '1px solid #c5e1a5' }}>
          
          {/* 1. SELECT REGIÓN */}
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1b5e20', marginBottom: '5px' }}>1. Departamento (Región):</label>
            <select value={region} onChange={handleRegionChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none', fontWeight: 'bold' }}>
              {regionesPeru.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* 2. SELECT PROVINCIA */}
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1b5e20', marginBottom: '5px' }}>2. Provincia:</label>
            <select value={provincia} onChange={handleProvinciaChange} disabled={region === 'Nivel Nacional'} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none', backgroundColor: region === 'Nivel Nacional' ? '#e0e0e0' : 'white', cursor: region === 'Nivel Nacional' ? 'not-allowed' : 'pointer' }}>
              <option value="Todas">--- Todas las provincias ---</option>
              {provinciasDisponibles.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* 3. SELECT DISTRITO */}
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1b5e20', marginBottom: '5px' }}>3. Distrito:</label>
            <select value={distrito} onChange={(e) => setDistrito(e.target.value)} disabled={provincia === 'Todas'} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none', backgroundColor: provincia === 'Todas' ? '#e0e0e0' : 'white', cursor: provincia === 'Todas' ? 'not-allowed' : 'pointer' }}>
              <option value="Todos">--- Todos los distritos ---</option>
              {distritosDisponibles.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

        </div>
        
        {/* RUTA DE MIGA DE PAN (BREADCRUMB VISUAL) */}
        <div style={{ marginTop: '15px', fontSize: '13px', color: '#555' }}>
          <strong>Área de Análisis Actual:</strong> <span style={{ color: '#1565c0', fontWeight: 'bold' }}>{region} {provincia !== 'Todas' ? ` ➔ ${provincia}` : ''} {distrito !== 'Todos' ? ` ➔ ${distrito}` : ''}</span>
        </div>
      </div>

      {/* ================= TARJETAS KPI ================= */}
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #2e7d32', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, color: '#666', fontSize: '14px', fontWeight: 'bold' }}>🌳 Madera Ilegal Recuperada</p>
          <h2 style={{ margin: '5px 0 0 0', color: '#2e7d32', fontSize: '28px' }}>1,479 <span style={{ fontSize: '16px' }}>m³</span></h2>
        </div>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #f57c00', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, color: '#666', fontSize: '14px', fontWeight: 'bold' }}>🐒 Fauna Silvestre Rescatada</p>
          <h2 style={{ margin: '5px 0 0 0', color: '#f57c00', fontSize: '28px' }}>445 <span style={{ fontSize: '16px' }}>Indiv.</span></h2>
        </div>
        <div style={{ flex: 1, backgroundColor: 'whiAte', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #1565c0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, color: '#666', fontSize: '14px', fontWeight: 'bold' }}>🚨 Vehículos Intervenidos</p>
          <h2 style={{ margin: '5px 0 0 0', color: '#1565c0', fontSize: '28px' }}>124 <span style={{ fontSize: '16px' }}>Unidades</span></h2>
        </div>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #c62828', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, color: '#666', fontSize: '14px', fontWeight: 'bold' }}>💰 Multas Impuestas (S/.)</p>
          <h2 style={{ margin: '5px 0 0 0', color: '#c62828', fontSize: '28px' }}>450.5 <span style={{ fontSize: '16px' }}>Mil</span></h2>
        </div>
      </div>

      {/* ================= GRÁFICOS RECHARTS ================= */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 45%', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#444' }}>🪵 Top 5 Especies Maderables Ilegales (m³)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart layout="vertical" data={topMadera} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis dataKey="especie" type="category" width={80} fontWeight="bold" fontSize={13} />
              <ChartTooltip />
              <Bar dataKey="m3" fill="#2e7d32" radius={[0, 4, 4, 0]} barSize={25} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: '1 1 45%', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#444' }}>🐒 Top 5 Fauna Silvestre Decomisada (Individuos)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart layout="vertical" data={topFauna} margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis dataKey="especie" type="category" width={110} fontWeight="bold" fontSize={13} />
              <ChartTooltip />
              <Bar dataKey="cant" fill="#f57c00" radius={[0, 4, 4, 0]} barSize={25} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// BLOQUE 5: COMPONENTE EXPEDIENTE PAS (Módulo Legal y Sancionador)
// =====================================================================
function ComponentePAS() {
  const [vistaPAS, setVistaPAS] = useState('portada'); // 'portada', 'nuevo', 'detalle', 'resolutiva'
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState(null);

  const baseDatosPAS = [
    { 
      id: 1, 
      expediente: 'EXP-001-2026', 
      resolucion: 'RD N° 101-2026', 
      infractor: 'Consorcio Maderero El Bosque', 
      inspector: 'Ing. Carlos Rey', 
      fecha: '16/10/2026', 
      estado: 'Fase Instructora', 
      ruc: '20123456789' 
    },
    { 
      id: 2, 
      expediente: 'EXP-002-2026', 
      resolucion: 'RD N° 102-2026', 
      infractor: 'Juan Perez Galdos', 
      inspector: 'Ing. Ana Gómez', 
      fecha: '14/10/2026', 
      estado: 'Resolución Final', 
      ruc: '10456789123' 
    },
    { 
      id: 3, 
      expediente: 'EXP-003-2026', 
      resolucion: 'En trámite', 
      infractor: 'Maderera Los Pinos SAC', 
      inspector: 'Ing. Carlos Rey', 
      fecha: '18/10/2026', 
      estado: 'Intervención Inicial', 
      ruc: '20987654321' 
    },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ----------------------------------------------------- */}
      {/* VISTA: PORTADA PAS */}
      {/* ----------------------------------------------------- */}
      {vistaPAS === 'portada' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ color: '#333', marginTop: 0, marginBottom: '5px' }}>Registro Central de PAS</h1>
              <p style={{ color: '#666', marginTop: 0 }}>Visualización de expedientes remitidos desde campo.</p>
            </div>
            <button 
              onClick={() => setVistaPAS('nuevo')} 
              style={{ backgroundColor: '#1565c0', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              + Iniciar Nuevo PAS
            </button>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#2e7d32', color: 'white' }}>
                <tr>
                  <th style={{ padding: '12px' }}>Expediente</th>
                  <th style={{ padding: '12px' }}>Administrado</th>
                  <th style={{ padding: '12px' }}>Inspector</th>
                  <th style={{ padding: '12px' }}>Estado</th>
                  <th style={{ padding: '12px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {baseDatosPAS.map((row, index) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? '#fafafa' : 'white' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#1565c0' }}>{row.expediente}</td>
                    <td style={{ padding: '12px' }}>{row.infractor}</td>
                    <td style={{ padding: '12px' }}>{row.inspector}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#e8f5e9', color: '#2e7d32' }}>
                        {row.estado}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button 
                        onClick={() => { setExpedienteSeleccionado(row); setVistaPAS('detalle'); }} 
                        style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        👁️ Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ----------------------------------------------------- */}
      {/* VISTA: NUEVO EXPEDIENTE PAS */}
      {/* ----------------------------------------------------- */}
      {vistaPAS === 'nuevo' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={() => setVistaPAS('portada')} 
              style={{ padding: '8px 15px', backgroundColor: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ⬅ Volver
            </button>
            <h2 style={{ color: '#1565c0', margin: 0 }}>Ingreso de Nuevo Expediente PAS</h2>
          </div>
          
          <div style={{ display: 'flex', gap: '30px', marginTop: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 400px', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', borderTop: '5px solid #2e7d32' }}>
              <h3 style={{ marginTop: 0, color: '#2e7d32', fontSize: '20px' }}>📱 Vincular App Fiscalizador</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#555' }}>Código de Inspector:</label>
                  <input type="text" placeholder="Ej: FISC-HCO-045" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#555' }}>Token de Sincronización:</label>
                  <input type="password" placeholder="******" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>
                <button 
                  onClick={() => { alert('¡Sincronización Exitosa!'); setVistaPAS('portada'); }} 
                  style={{ backgroundColor: '#2e7d32', color: 'white', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  🔄 Extraer Datos de la Tablet
                </button>
              </div>
            </div>

            <div style={{ flex: '1 1 400px', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', borderTop: '5px solid #f57c00' }}>
              <h3 style={{ marginTop: 0, color: '#f57c00', fontSize: '20px' }}>📄 Subir Documentación Física</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                <div style={{ border: '2px dashed #ccc', padding: '30px', textAlign: 'center', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                  <span style={{ fontSize: '30px' }}>📁</span>
                  <p style={{ margin: '10px 0 0 0', color: '#777', fontWeight: 'bold' }}>Arrastra el PDF escaneado aquí</p>
                </div>
                <button 
                  onClick={() => { alert('Analizando PDF con IA...'); setVistaPAS('portada'); }} 
                  style={{ backgroundColor: '#f57c00', color: 'white', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ✨ Procesar con IA OCR
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ----------------------------------------------------- */}
      {/* VISTA: DETALLE DEL EXPEDIENTE (Documentos de Auditoría) */}
      {/* ----------------------------------------------------- */}
      {vistaPAS === 'detalle' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button 
                onClick={() => setVistaPAS('portada')} 
                style={{ padding: '8px 15px', backgroundColor: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ⬅ Volver
              </button>
              <h2 style={{ color: '#2e7d32', margin: 0 }}>Expediente: {expedienteSeleccionado.expediente}</h2>
            </div>
            <button 
              onClick={() => setVistaPAS('resolutiva')} 
              style={{ backgroundColor: '#f57c00', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', fontSize: '15px' }}
            >
              ⚖️ Iniciar Fase Resolutiva (Cálculo Multa)
            </button>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            
            {/* Columna Izquierda: Documentos Legales Completos */}
            <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <h3 style={{ borderBottom: '2px solid #1565c0', paddingBottom: '10px', color: '#1565c0', marginTop: 0 }}>
                  📄 Documentos Legales del Expediente
                </h3>
                
                <div style={{ padding: '15px', border: '1px solid #c62828', borderRadius: '6px', backgroundColor: '#fff', marginBottom: '15px' }}>
                  <strong style={{ color: '#c62828', fontSize: '16px' }}>🛑 Acta de Inmovilización</strong>
                  <div style={{ backgroundColor: '#f9fbe7', padding: '12px', borderRadius: '4px', border: '1px dashed #c5e1a5', marginTop: '10px', fontSize: '13px', lineHeight: '1.6', color: '#33691e' }}>
                    <strong>Infractor / RUC:</strong> {expedienteSeleccionado.infractor} (RUC: {expedienteSeleccionado.ruc})<br/>
                    <strong>Coordenadas GPS:</strong> -9.88001, -76.15234 (Capturado por App)<br/>
                    <strong>Motivo de Intervención:</strong> Transporte de madera sin GTF.<br/>
                    <strong>Especies Decomisadas:</strong><br/>
                    - 15 m³ de Tornillo (Cedrelinga cateniformis)<br/>
                    - 5 m³ de Moena (Aniba sp.)<br/>
                    <strong>Fecha/Hora:</strong> {expedienteSeleccionado.fecha} a las 14:30 hrs.
                  </div>
                </div>

                <div style={{ padding: '15px', border: '1px solid #f57c00', borderRadius: '6px', backgroundColor: '#fff', marginBottom: '15px' }}>
                  <strong style={{ color: '#f57c00', fontSize: '16px' }}>🚚 Acta de Internamiento de Vehículo</strong>
                  <div style={{ backgroundColor: '#fff3e0', padding: '12px', borderRadius: '4px', border: '1px dashed #ffcc80', marginTop: '10px', fontSize: '13px', lineHeight: '1.6', color: '#e65100' }}>
                    <strong>Placa del Vehículo:</strong> W3X-998 <br/>
                    <strong>Marca / Modelo:</strong> Volvo FH16 (Semirremolque)<br/>
                    <strong>Conductor Intervenido:</strong> Miguel Rojas Pimentel<br/>
                    <strong>Licencia de Conducir:</strong> Q76543219<br/>
                    <strong>Lugar de Depósito:</strong> Sede Central UGFFS Huánuco
                  </div>
                </div>

                <div style={{ padding: '15px', border: '1px solid #1565c0', borderRadius: '6px', backgroundColor: '#fff' }}>
                  <strong style={{ color: '#1565c0', fontSize: '16px' }}>📋 Informe de Inspección</strong>
                  <div style={{ backgroundColor: '#e3f2fd', padding: '12px', borderRadius: '4px', border: '1px dashed #90caf9', marginTop: '10px', fontSize: '13px', lineHeight: '1.6', color: '#0d47a1' }}>
                    <strong>Inspector Asignado:</strong> {expedienteSeleccionado.inspector} <br/>
                    <strong>Conclusiones Técnicas:</strong> Se constata la procedencia ilegal del producto forestal maderable. El administrado no presentó la GTF durante el control de carretera.<br/>
                    <strong>Evidencias:</strong> 4 Fotografías Adjuntas (Capturadas vía App).
                  </div>
                </div>

              </div>
            </div>

            {/* Columna Derecha: Línea de Tiempo Ciudadana */}
            <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <h3 style={{ borderBottom: '2px solid #2e7d32', paddingBottom: '10px', color: '#2e7d32', marginTop: 0 }}>
                  🔍 Seguimiento (Portal Ciudadano)
                </h3>
                
                <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#e8f5e9', border: '1px dashed #4caf50', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '24px' }}>🔐</span>
                  <div>
                    <strong style={{ display: 'block', color: '#1b5e20', fontSize: '14px' }}>Código Hash Inmutable:</strong>
                    <span style={{ fontFamily: 'monospace', color: '#333', fontSize: '12px', wordBreak: 'break-all' }}>e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
                  </div>
                </div>

                <h4 style={{ color: '#444', marginBottom: '20px' }}>⏳ Línea de Tiempo de Estados:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', position: 'relative', paddingLeft: '25px', borderLeft: '3px solid #ccc', marginLeft: '10px' }}>
                  
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-36px', top: '0', width: '18px', height: '18px', backgroundColor: '#2e7d32', borderRadius: '50%', border: '4px solid white', outline: '2px solid #2e7d32' }}></div>
                    <strong style={{ color: '#2e7d32', fontSize: '16px' }}>1. Intervención</strong> 
                    <span style={{ color: '#888', fontSize: '13px', marginLeft: '10px' }}>✔️ {expedienteSeleccionado.fecha}</span>
                    <p style={{ margin: '5px 0', fontSize: '13px', color: '#555' }}>Registro inicial del decomiso y hallazgo.</p>
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-36px', top: '0', width: '18px', height: '18px', backgroundColor: '#f57c00', borderRadius: '50%', border: '4px solid white', outline: '2px solid #f57c00' }}></div>
                    <strong style={{ color: '#f57c00', fontSize: '16px' }}>2. En Evaluación</strong> 
                    <span style={{ color: '#888', fontSize: '13px', marginLeft: '10px' }}>🔄 Estado Actual</span>
                    <p style={{ margin: '5px 0', fontSize: '13px', color: '#555' }}>Fase instructora en curso.</p>
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-36px', top: '0', width: '18px', height: '18px', backgroundColor: '#ccc', borderRadius: '50%', border: '4px solid white' }}></div>
                    <strong style={{ color: '#888', fontSize: '16px' }}>3. Resolución Final</strong>
                    <p style={{ margin: '5px 0', fontSize: '13px', color: '#555' }}>Fase resolutiva pendiente.</p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ----------------------------------------------------- */}
      {/* VISTA: FASE RESOLUTIVA (Matriz de Sanciones) */}
      {/* ----------------------------------------------------- */}
      {vistaPAS === 'resolutiva' && (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <button 
              onClick={() => setVistaPAS('detalle')} 
              style={{ padding: '8px 15px', backgroundColor: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ⬅ Volver
            </button>
            <h2 style={{ color: '#f57c00', margin: 0 }}>⚖️ Matriz de Sanción: {expedienteSeleccionado.expediente}</h2>
          </div>
          
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            
            <div style={{ flex: '1 1 300px', border: '1px solid #ccc', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ color: '#1565c0', marginTop: 0 }}>1. Descargos y Conducta</h3>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Recepción Defensa (PDF):</label>
              <input type="file" style={{ width: '100%', marginBottom: '15px', marginTop: '5px' }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" style={{ transform: 'scale(1.2)' }} /> Reconoció voluntariamente la infracción (Atenuante)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" style={{ transform: 'scale(1.2)' }} /> Colaboró en la investigación (Atenuante)
              </label>
            </div>

            <div style={{ flex: '2 1 400px', border: '1px solid #ccc', borderRadius: '8px', padding: '20px', backgroundColor: '#f9fbe7' }}>
              <h3 style={{ color: '#2e7d32', marginTop: 0 }}>2. Matriz de Gradualidad (Cálculo Multa)</h3>
              <div style={{ backgroundColor: '#ffebee', padding: '10px', borderRadius: '4px', borderLeft: '4px solid #c62828', marginBottom: '15px', fontSize: '13px' }}>
                <strong style={{ color: '#c62828' }}>⚠️ Alerta Automática del Sistema:</strong> 
                El infractor con RUC {expedienteSeleccionado.ruc} <strong style={{ textDecoration: 'underline' }}>SÍ presenta reincidencia</strong> en los últimos 5 años (Resolución N° 045-2023). Aplica agravante legal.
              </div>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Daño Ambiental:</label>
                  <select style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px' }}>
                    <option>Leve</option><option>Grave</option><option>Muy Grave</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Beneficio (S/.):</label>
                  <input type="number" placeholder="Ej: 15000" style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Capacidad Económica:</label>
                  <select style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px' }}>
                    <option>Persona Subsistencia</option><option>Pequeña Empresa</option><option>Gran Empresa</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ flex: '1 1 100%', border: '1px solid #ccc', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ color: '#8e24aa', marginTop: 0 }}>3. Sanciones Accesorias y Medidas Complementarias</h3>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked /> 🛑 Decomiso Definitivo del producto
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" /> 🔒 Clausura de instalaciones
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" /> 📄 Suspensión/Cancelación de Autorización
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" /> 🌱 Medida Restauradora (Reforestación)
                </label>
              </div>
            </div>

            <div style={{ flex: '1 1 100%', backgroundColor: '#e3f2fd', border: '2px solid #1565c0', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
              <h3 style={{ color: '#1565c0', marginTop: 0 }}>4. Autogeneración de Resolución Final</h3>
              <p style={{ margin: '5px 0', fontSize: '18px' }}>Monto Calculado por el Sistema: <strong style={{ fontSize: '24px', color: '#c62828' }}>14.5 UIT</strong></p>
              <div style={{ backgroundColor: '#fff', display: 'inline-block', padding: '10px 20px', borderRadius: '20px', color: '#2e7d32', fontWeight: 'bold', fontSize: '14px', border: '1px solid #4caf50', margin: '10px 0' }}>
                💡 Incentivo Pronto Pago: 25% de descuento (Baja a 10.8 UIT) si paga antes de 15 días.
              </div>
              <br/>
              <button 
                onClick={() => { alert('Generando RESOLUCIÓN DE SANCIÓN N° 089-2026-ATFFS-HCO.pdf para firma digital...'); setVistaPAS('detalle'); }} 
                style={{ backgroundColor: '#1565c0', color: 'white', padding: '15px 30px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}
              >
                📄 Generar Resolución en PDF y Firmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// BLOQUE 6: COMPONENTE SEMÁFORO OCR (Doble Cámara por Puesto de Control)
// =====================================================================
function ComponenteOCR() {
  const alertasOCR = [
    { id: 1, placa: 'W5M-430', fecha: '18/10/2026 14:32:10', camara: 'CAM 01A (Rancho: Ingreso -50m)', estado: 'Alerta Roja', motivo: 'Sin GTF vigente / Evasión' },
    { id: 2, placa: 'F3A-890', fecha: '18/10/2026 14:15:00', camara: 'CAM 02B (Ambo: Salida +50m)', estado: 'Verde', motivo: 'GTF Validada Correctamente' },
    { id: 3, placa: 'C8U-991', fecha: '18/10/2026 13:45:22', camara: 'CAM 01B (Rancho: Salida +50m)', estado: 'Alerta Roja', motivo: 'Placa con Requisitoria / Robada' },
    { id: 4, placa: 'X1P-304', fecha: '18/10/2026 13:10:05', camara: 'CAM 02A (Ambo: Ingreso -50m)', estado: 'Alerta Naranja', motivo: 'Ruta no coincide con la GTF' },
    { id: 5, placa: 'M4A-777', fecha: '18/10/2026 12:30:00', camara: 'CAM 01A (Rancho: Ingreso -50m)', estado: 'Verde', motivo: 'GTF Validada Correctamente' },
    { id: 6, placa: 'T2B-112', fecha: '18/10/2026 11:20:15', camara: 'CAM 01A (Rancho: Ingreso -50m)', estado: 'Verde', motivo: 'GTF Validada Correctamente' },
    { id: 7, placa: 'B2X-123', fecha: '18/10/2026 10:05:40', camara: 'CAM 02B (Ambo: Salida +50m)', estado: 'Alerta Roja', motivo: 'Vehículo NO autorizado para carga' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#d32f2f', marginTop: 0, marginBottom: '5px' }}>🚨 Semáforo de Alertas OCR (Control Doble Vía)</h1>
          <p style={{ color: '#666', marginTop: 0 }}>Monitoreo con cámaras LPR a 50m (Ingreso y Salida) en ambos carriles de los puestos de control.</p>
        </div>
      </div>
      
      {/* MONITORES DE CÁMARAS EN VIVO */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* PUESTO 1: RANCHO */}
        <div style={{ flex: '1 1 45%', backgroundColor: '#e0e0e0', padding: '15px', borderRadius: '8px', borderTop: '4px solid #333' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333', textAlign: 'center' }}>📍 Puesto de Control: Rancho</h3>
          <div style={{ display: 'flex', gap: '15px' }}>
            {/* Cámara Ida */}
            <div style={{ flex: 1, backgroundColor: '#111', borderRadius: '8px', padding: '10px', position: 'relative', border: '2px solid #333' }}>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: 'red', borderRadius: '50%' }}></div> 
                CAM 01A (Ingreso -50m)
              </div>
              <div style={{ border: '2px dashed #00e676', margin: '20px auto 10px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00e676', fontWeight: 'bold', fontSize: '18px', backgroundColor: 'rgba(0,230,118,0.15)', padding: '5px' }}>
                W5M-430
              </div>
            </div>
            {/* Cámara Vuelta */}
            <div style={{ flex: 1, backgroundColor: '#111', borderRadius: '8px', padding: '10px', position: 'relative', border: '2px solid #333' }}>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#00e676', borderRadius: '50%' }}></div> 
                CAM 01B (Salida +50m)
              </div>
              <div style={{ border: '2px dashed #555', margin: '20px auto 10px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontWeight: 'bold', fontSize: '18px', padding: '5px' }}>
                ESPERANDO...
              </div>
            </div>
          </div>
        </div>

        {/* PUESTO 2: AMBO */}
        <div style={{ flex: '1 1 45%', backgroundColor: '#e0e0e0', padding: '15px', borderRadius: '8px', borderTop: '4px solid #333' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333', textAlign: 'center' }}>📍 Puesto de Control: Ambo</h3>
          <div style={{ display: 'flex', gap: '15px' }}>
            {/* Cámara Ida */}
            <div style={{ flex: 1, backgroundColor: '#111', borderRadius: '8px', padding: '10px', position: 'relative', border: '2px solid #333' }}>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#00e676', borderRadius: '50%' }}></div> 
                CAM 02A (Ingreso -50m)
              </div>
              <div style={{ border: '2px dashed #00e676', margin: '20px auto 10px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00e676', fontWeight: 'bold', fontSize: '18px', backgroundColor: 'rgba(0,230,118,0.15)', padding: '5px' }}>
                F3A-890
              </div>
            </div>
            {/* Cámara Vuelta */}
            <div style={{ flex: 1, backgroundColor: '#111', borderRadius: '8px', padding: '10px', position: 'relative', border: '2px solid #333' }}>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: 'orange', borderRadius: '50%' }}></div> 
                CAM 02B (Salida +50m)
              </div>
              <div style={{ border: '2px dashed #ff9800', margin: '20px auto 10px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff9800', fontWeight: 'bold', fontSize: '18px', backgroundColor: 'rgba(255,152,0,0.15)', padding: '5px' }}>
                X1P-304
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* TABLA DE ALERTAS HISTÓRICAS */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', overflow: 'hidden', marginTop: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead style={{ backgroundColor: '#eeeeee', color: '#555' }}>
            <tr>
              <th style={{ padding: '12px' }}>Fecha y Hora</th>
              <th style={{ padding: '12px' }}>Cámara / Ubicación</th>
              <th style={{ padding: '12px' }}>Placa Leída</th>
              <th style={{ padding: '12px' }}>Cruce de Datos SITFF</th>
              <th style={{ padding: '12px' }}>Acción Automatizada</th>
            </tr>
          </thead>
          <tbody>
            {alertasOCR.map((alerta, index) => (
              <tr key={alerta.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? '#fafafa' : 'white' }}>
                <td style={{ padding: '12px', color: '#666' }}>{alerta.fecha}</td>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#1565c0' }}>{alerta.camara}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ backgroundColor: '#fff9c4', padding: '4px 8px', border: '1px solid #fbc02d', borderRadius: '4px', fontWeight: 'bold', fontSize: '16px' }}>
                    {alerta.placa}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <strong style={{ color: alerta.estado === 'Alerta Roja' ? '#c62828' : alerta.estado === 'Alerta Naranja' ? '#f57c00' : '#2e7d32' }}>
                    {alerta.motivo}
                  </strong>
                </td>
                <td style={{ padding: '12px' }}>
                  {alerta.estado === 'Alerta Roja' && <button style={{ backgroundColor: '#d32f2f', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>🚨 Detonar Intervención</button>}
                  {alerta.estado === 'Alerta Naranja' && <button style={{ backgroundColor: '#f57c00', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>⚠️ Revisión Manual</button>}
                  {alerta.estado === 'Verde' && <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>✓ Barrera Abierta (Paso Libre)</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =====================================================================
// BLOQUE 7: SIMULADOR DE APP MÓVIL (Login, Registro y Perfiles Web/Movil)
// =====================================================================
// =====================================================================
// BLOQUE 7: SIMULADOR DE APP MÓVIL (Perfiles Fiscalizador y Concesionario/Minero)
// =====================================================================
function ComponenteSimuladorMovil({ volverAlDashboard }) {
  const [pantallaApp, setPantallaApp] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Funciones de Acceso Directo (Para Demostración Rápida)
  const loginFiscalizador = () => {
    setEmail('inspector@ugffs.gob.pe');
    setPassword('******');
    setTimeout(() => setPantallaApp('home_fiscalizador'), 500);
  };

  const loginCiudadano = () => {
    setEmail('titular@petitorio.pe');
    setPassword('******');
    setTimeout(() => setPantallaApp('home_concesionario'), 500);
  };

  const manejarLogin = () => {
    if (!email || !password) return alert("Por favor ingrese usuario y contraseña.");
    if (email.toLowerCase().includes('atffs') || email.toLowerCase().includes('ugffs')) {
      setPantallaApp('home_fiscalizador');
    } else {
      setPantallaApp('home_concesionario');
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#1a1a1a', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 9999 }}>
      
      {/* Botón para regresar al Dashboard Web */}
      <button 
        onClick={volverAlDashboard} 
        style={{ position: 'absolute', top: '30px', left: '30px', padding: '12px 24px', backgroundColor: '#ffeb3b', color: '#1b5e20', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}
      >
        ⬅ Volver al Dashboard Web (PC)
      </button>

      {/* Carcasa del Teléfono Móvil */}
      <div style={{ width: '375px', height: '780px', backgroundColor: '#f4f6f8', borderRadius: '40px', border: '14px solid #000', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', position: 'relative' }}>
         
         {/* ================= PANTALLA 1: LOGIN ================= */}
         {pantallaApp === 'login' && (
           <div style={{ padding: '30px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: 'white' }}>
             <div style={{ textAlign: 'center', marginBottom: '30px' }}>
               <div style={{ fontSize: '60px' }}>📱</div>
               <h1 style={{ color: '#2e7d32', margin: '10px 0 0 0', fontSize: '26px' }}>SITFF Móvil</h1>
               <p style={{ color: '#666', marginTop: '5px', fontSize: '13px' }}>Gestión Forestal y Minera Sostenible</p>
             </div>
             
             {/* Formulario Manual */}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
               <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '15px', backgroundColor: '#f5f5f5', outline: 'none' }} />
               <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '15px', backgroundColor: '#f5f5f5', outline: 'none' }} />
               <button onClick={manejarLogin} style={{ padding: '15px', backgroundColor: '#1565c0', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '5px' }}>Ingresar</button>
             </div>

             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0' }}>
               <div style={{ height: '1px', backgroundColor: '#ddd', flex: 1 }}></div><span style={{ color: '#999', fontSize: '12px' }}>ACCESO DIRECTO (DEMO)</span><div style={{ height: '1px', backgroundColor: '#ddd', flex: 1 }}></div>
             </div>

             {/* Botones de Acceso Directo */}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <button onClick={loginFiscalizador} style={{ padding: '14px', backgroundColor: '#e8f5e9', color: '#1b5e20', border: '2px solid #4caf50', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                 👨‍✈️ Entrar como Fiscalizador
               </button>
               <button onClick={loginCiudadano} style={{ padding: '14px', backgroundColor: '#fff3e0', color: '#e65100', border: '2px solid #ff9800', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                 👷 Entrar como Titular / Ciudadano
               </button>
             </div>
           </div>
         )}

         {/* ================= PANTALLA 2: HOME FISCALIZADOR ================= */}
         {pantallaApp === 'home_fiscalizador' && (
           <div style={{ flex: 1, backgroundColor: '#f4f6f8', display: 'flex', flexDirection: 'column' }}>
             {/* Cabecera App */}
             <div style={{ backgroundColor: '#1b5e20', padding: '30px 20px 20px 20px', color: 'white', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Inspector Autorizado</p>
                    <h2 style={{ margin: '5px 0 0 0', fontSize: '20px' }}>Carlos Rey</h2>
                    <span style={{ display: 'inline-block', marginTop: '5px', padding: '3px 8px', backgroundColor: '#4caf50', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>📍 Puesto: Rancho</span>
                  </div>
                  <button onClick={() => { setEmail(''); setPassword(''); setPantallaApp('login'); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Salir</button>
                </div>
             </div>
             
             {/* Grid de Herramientas */}
             <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
               <div onClick={() => alert('Abriendo Cámara del Celular...')} style={{ backgroundColor: 'white', padding: '20px 10px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid #eee' }}>
                 <div style={{ fontSize: '35px', marginBottom: '10px' }}>📷</div><strong style={{ color: '#333', fontSize: '13px' }}>Escanear QR (GTF)</strong>
               </div>
               <div onClick={() => alert('Generando Acta de Inmovilización en el sistema...')} style={{ backgroundColor: 'white', padding: '20px 10px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid #eee' }}>
                 <div style={{ fontSize: '35px', marginBottom: '10px' }}>🛑</div><strong style={{ color: '#d32f2f', fontSize: '13px' }}>Emitir Acta PAS</strong>
               </div>
               <div style={{ backgroundColor: 'white', padding: '20px 10px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid #eee' }}>
                 <div style={{ fontSize: '35px', marginBottom: '10px' }}>🚁</div><strong style={{ color: '#333', fontSize: '13px' }}>Enlace Dron RTK</strong>
               </div>
               <div style={{ backgroundColor: 'white', padding: '20px 10px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid #eee' }}>
                 <div style={{ fontSize: '35px', marginBottom: '10px' }}>📋</div><strong style={{ color: '#333', fontSize: '13px' }}>Mis Inspecciones</strong>
               </div>
             </div>

             {/* Notificaciones */}
             <div style={{ padding: '0 20px' }}>
                <h4 style={{ color: '#555', margin: '0 0 10px 0', fontSize: '14px' }}>Alertas Recientes</h4>
                <div style={{ backgroundColor: '#ffebee', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #f44336', fontSize: '13px', color: '#c62828' }}>
                  <strong>🚨 Alerta LPR:</strong> Vehículo W5M-430 detectado sin GTF acercándose al control.
                </div>
             </div>
           </div>
         )}

         {/* ================= PANTALLA 3: HOME CIUDADANO / CONCESIONARIO ================= */}
         {pantallaApp === 'home_concesionario' && (
           <div style={{ flex: 1, backgroundColor: '#f4f6f8', display: 'flex', flexDirection: 'column' }}>
             {/* Cabecera App */}
             <div style={{ backgroundColor: '#e65100', padding: '30px 20px 20px 20px', color: 'white', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Titular / Representante Legal</p>
                    <h2 style={{ margin: '5px 0 0 0', fontSize: '20px' }}>Maderera Amazonas</h2>
                    <span style={{ display: 'inline-block', marginTop: '5px', padding: '3px 8px', backgroundColor: '#ff9800', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>RUC: 20123456789</span>
                  </div>
                  <button onClick={() => { setEmail(''); setPassword(''); setPantallaApp('login'); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Salir</button>
                </div>
             </div>
             
             {/* Grid de Herramientas Ciudadano */}
             <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
               <div onClick={() => alert('Abriendo Billetera Digital...')} style={{ backgroundColor: 'white', padding: '20px 10px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid #eee' }}>
                 <div style={{ fontSize: '35px', marginBottom: '10px' }}>🪪</div><strong style={{ color: '#333', fontSize: '13px' }}>Mi Billetera QR</strong>
               </div>
               <div onClick={() => alert('Generando nueva Guía Electrónica...')} style={{ backgroundColor: 'white', padding: '20px 10px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid #eee' }}>
                 <div style={{ fontSize: '35px', marginBottom: '10px' }}>📝</div><strong style={{ color: '#2e7d32', fontSize: '13px' }}>Emitir GTF</strong>
               </div>
               <div style={{ backgroundColor: 'white', padding: '20px 10px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid #eee' }}>
                 <div style={{ fontSize: '35px', marginBottom: '10px' }}>🟩</div><strong style={{ color: '#333', fontSize: '13px' }}>Mis Petitorios</strong>
               </div>
               <div onClick={() => alert('Ingresando al portal de transparencia PAS...')} style={{ backgroundColor: 'white', padding: '20px 10px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid #eee' }}>
                 <div style={{ fontSize: '35px', marginBottom: '10px' }}>⚖️</div><strong style={{ color: '#1565c0', fontSize: '13px' }}>Seguimiento PAS</strong>
               </div>
             </div>

             {/* Estado de Permisos */}
             <div style={{ padding: '0 20px' }}>
                <h4 style={{ color: '#555', margin: '0 0 10px 0', fontSize: '14px' }}>Estado Legal de Concesiones</h4>
                <div style={{ backgroundColor: '#e8f5e9', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #4caf50', fontSize: '13px', color: '#2e7d32', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>ATF-2026-1045</strong><br/>
                    Vigente hasta Dic 2026
                  </div>
                  <span style={{ fontSize: '20px' }}>✅</span>
                </div>
                <div style={{ backgroundColor: '#fff3e0', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #ff9800', fontSize: '13px', color: '#e65100', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <div>
                    <strong>EXP-PAS-001</strong><br/>
                    Descargos en evaluación
                  </div>
                  <span style={{ fontSize: '20px' }}>⏳</span>
                </div>
             </div>
           </div>
         )}
         
         {/* BARRA INFERIOR DEL CELULAR FÍSICO */}
         <div style={{ height: '35px', backgroundColor: '#000', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 'auto' }}>
            <div style={{ width: '120px', height: '5px', backgroundColor: '#555', borderRadius: '10px' }}></div>
         </div>
      </div>
    </div>
  );
}
// =====================================================================
// BLOQUE NUEVO: SIMULADOR DE DRON Y PREDICCIÓN DE INCENDIOS (IA + SATELITAL)
// =====================================================================
function ComponenteDronIncendios() {
  const [horaPrediccion, setHoraPrediccion] = useState(0); 
  const [dronDesplegado, setDronDesplegado] = useState(false);

  // Iconos locales para este componente
  const iconoFuego = new L.DivIcon({ html: '🔥', className: 'dummy', iconSize: [24, 24] });
  const iconoDron = new L.DivIcon({ html: '🚁', className: 'dummy', iconSize: [35, 35] });

  // Variables del entorno (Investigación Forestal)
  const variablesEntorno = {
    vientoDesc: "25 km/h (Rachas 40 km/h)",
    vientoDir: "Noreste (NE)",
    temp: "34 °C",
    humedad: "22% (Crítico)",
    pendiente: "35% (Cuesta Arriba)",
    combustible: "Bosque Secundario Denso",
    ndvi: "0.82 (Satelite Sentinel-2)",
    altitud: "850 msnm"
  };

  const baseIncendio = [-9.55, -75.10];

  // Simulación de propagación del modelo Rothermel
  const poligonosPropagacion = {
    0: [[-9.55, -75.10], [-9.54, -75.09], [-9.56, -75.08], [-9.57, -75.11]],
    1: [[-9.55, -75.10], [-9.53, -75.07], [-9.56, -75.06], [-9.58, -75.11]],
    2: [[-9.55, -75.10], [-9.51, -75.04], [-9.57, -75.03], [-9.59, -75.11]],
    3: [[-9.55, -75.10], [-9.48, -75.00], [-9.58, -74.98], [-9.60, -75.11]]
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '15px 25px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', borderLeft: '5px solid #d32f2f' }}>
        <div>
          <h1 style={{ color: '#d32f2f', margin: '0 0 5px 0', fontSize: '24px' }}>🔥 Modelo de Predicción de Incendios (IA-SAT)</h1>
          <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>Integración de datos de Dron RTK, Sentinel-2 y Algoritmo de Rothermel.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px', border: '1px solid #ef9a9a' }}>🚨 ALERTA NIVEL 4 (PUERTO INCA)</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* COLUMNA IZQUIERDA: TELEMETRÍA DEL DRON */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ backgroundColor: '#111', borderRadius: '8px', padding: '15px', color: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', border: '2px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <strong style={{ color: '#00e676' }}>🚁 Matrice 300 RTK (Enlace Activo)</strong>
              <span style={{ fontSize: '12px', color: '#aaa' }}>Batería: 68%</span>
            </div>
            
            {/* Pantalla Simulada del Dron */}
            <div style={{ width: '100%', height: '200px', backgroundColor: dronDesplegado ? '#3e2723' : '#000', borderRadius: '4px', border: '1px dashed #666', position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {!dronDesplegado ? (
                <button onClick={() => setDronDesplegado(true)} style={{ backgroundColor: '#f57c00', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Desplegar Dron 🚀</button>
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,87,34,0.8) 0%, rgba(33,33,33,1) 80%)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '10px', left: '10px', color: '#00e676', fontSize: '11px', fontFamily: 'monospace' }}>ALT: 120m<br/>VEL: 8.5 m/s</div>
                  <div style={{ position: 'absolute', top: '10px', right: '10px', color: 'red', fontSize: '11px', fontWeight: 'bold' }}>🔴 REC (TÉRMICA H20T)</div>
                  <div style={{ position: 'absolute', bottom: '10px', left: '10px', color: '#fff', fontSize: '11px' }}>LAT: -9.5521<br/>LNG: -75.1044</div>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', border: '1px solid rgba(255,255,255,0.5)', width: '40px', height: '40px' }}></div>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: '20px' }}>+</div>
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '15px', fontSize: '13px', color: '#ddd' }}>
              <p style={{ margin: '0 0 5px 0' }}><strong>Levantamiento Topográfico:</strong> Procesando...</p>
              <p style={{ margin: '0' }}><strong>Punto Caliente Máx:</strong> <span style={{ color: '#ff5252', fontWeight: 'bold' }}>640 °C</span></p>
            </div>
          </div>
        </div>

        {/* COLUMNA CENTRAL: MAPA DE PROPAGACIÓN */}
        <div style={{ flex: '2 1 500px', backgroundColor: '#fff', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>🗺️ Simulación Geográfica de Propagación</h3>
          <div style={{ height: '350px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #ccc' }}>
             <MapContainer center={baseIncendio} zoom={12} style={{ height: '100%', width: '100%', zIndex: 0 }}>
               <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
               
               <Marker position={baseIncendio} icon={iconoFuego}><Popup>Punto de Ignición Cero</Popup></Marker>
               
               {dronDesplegado && (
                 <Marker position={[-9.56, -75.12]} icon={iconoDron}><Popup>Dron escaneando terreno</Popup></Marker>
               )}

               <Polygon positions={poligonosPropagacion[horaPrediccion]} pathOptions={{ color: '#ff3d00', fillColor: '#ff3d00', fillOpacity: 0.6, weight: 2 }} />

               {horaPrediccion > 0 && (
                 <Polygon positions={poligonosPropagacion[horaPrediccion].map(coord => [coord[0] + 0.02, coord[1] + 0.02])} pathOptions={{ color: '#ffeb3b', fillColor: '#ffeb3b', fillOpacity: 0.2, dashArray: '5, 5', weight: 2 }} />
               )}
             </MapContainer>
          </div>
        </div>

        {/* COLUMNA DERECHA: VARIABLES Y LÍNEA DE TIEMPO IA */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div style={{ backgroundColor: '#fff3e0', padding: '20px', borderRadius: '8px', border: '1px solid #ffcc80' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#e65100' }}>⏱️ Horizonte de Predicción IA</h4>
            <input type="range" min="0" max="3" value={horaPrediccion} onChange={(e) => setHoraPrediccion(parseInt(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>
              <span style={{ color: horaPrediccion === 0 ? '#d32f2f' : '#555' }}>Actual</span>
              <span style={{ color: horaPrediccion === 1 ? '#d32f2f' : '#555' }}>+1 Hora</span>
              <span style={{ color: horaPrediccion === 2 ? '#d32f2f' : '#555' }}>+2 Horas</span>
              <span style={{ color: horaPrediccion === 3 ? '#d32f2f' : '#555' }}>+3 Horas</span>
            </div>
            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff', borderRadius: '4px', fontSize: '13px', color: '#d32f2f', fontWeight: 'bold', textAlign: 'center', border: '1px dashed #d32f2f' }}>
              {horaPrediccion === 0 && "Magnitud Actual: 450 Hectáreas"}
              {horaPrediccion === 1 && "Predicción 1H: 820 Hectáreas (Crecimiento Rápido)"}
              {horaPrediccion === 2 && "Predicción 2H: 1,450 Hectáreas (Peligro Población)"}
              {horaPrediccion === 3 && "Predicción 3H: 2,300 Hectáreas (Catástrofe)"}
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#1565c0' }}>📊 Variables del Modelo (Rothermel)</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', lineHeight: '1.8', color: '#444' }}>
              <li>💨 <strong>Viento:</strong> {variablesEntorno.vientoDesc} <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>{variablesEntorno.vientoDir}</span></li>
              <li>🌡️ <strong>Temperatura:</strong> {variablesEntorno.temp}</li>
              <li>💧 <strong>Humedad Relativa:</strong> {variablesEntorno.humedad}</li>
              <li style={{ borderTop: '1px solid #eee', margin: '8px 0' }}></li>
              <li>⛰️ <strong>Topografía (Dron DEM):</strong> {variablesEntorno.pendiente}</li>
              <li>🌲 <strong>Combustible (Carga):</strong> {variablesEntorno.combustible}</li>
              <li>🛰️ <strong>Índice Vegetación:</strong> {variablesEntorno.ndvi}</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
// =====================================================================
// BLOQUE 8: COMPONENTE PRINCIPAL (Sidebar y Zorro IA Flotante)
// =====================================================================
export default function App() {
  const [modoVisualizacion, setModoVisualizacion] = useState('web');
  const [vistaActiva, setVistaActiva] = useState('dron'); // Por defecto abre el Dron ahora
  const [tipoMapa, setTipoMapa] = useState('satelite');
  
  const [capasActivas, setCapasActivas] = useState({ 
    concesiones: true, puntosControl: true, intervenciones: true, rutasEnVivo: true, mapaCalor: false, incendios: true 
  });
  const toggleCapa = (capa) => setCapasActivas({ ...capasActivas, [capa]: !capasActivas[capa] });

  const [iaAbierta, setIaAbierta] = useState(false);
  const [preguntaIA, setPreguntaIA] = useState('');
  const [respuestaIA, setRespuestaIA] = useState('¡Hola! Soy tu asistente de IA Forestal 🦊.');
  const simularRespuestaIA = () => setRespuestaIA('🦊 Analizando variables topográficas, meteorológicas y de combustible para la propagación...');
if (modoVisualizacion === 'app_movil') {
    return <ComponenteSimuladorMovilV2 volverAlDashboard={() => setModoVisualizacion('web')} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial', backgroundColor: '#f4f6f8', margin: 0, position: 'relative' }}>
      
      {/* SIDEBAR VERDE */}
      <div style={{ width: '280px', backgroundColor: '#1b5e20', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ borderBottom: '1px solid #4caf50', paddingBottom: '10px', marginTop: 0 }}>🌲 SITFF</h2>
        
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div onClick={() => setVistaActiva('mapa')} style={{ cursor: 'pointer', padding: '10px', backgroundColor: vistaActiva === 'mapa' ? '#2e7d32' : 'transparent', borderRadius: '4px', fontWeight: vistaActiva === 'mapa' ? 'bold' : 'normal' }}>📍 Mapa de Monitoreo</div>
          <div onClick={() => setVistaActiva('gtf')} style={{ cursor: 'pointer', padding: '10px', backgroundColor: vistaActiva === 'gtf' ? '#2e7d32' : 'transparent', borderRadius: '4px', fontWeight: vistaActiva === 'gtf' ? 'bold' : 'normal' }}>📋 Guías de Transporte</div>
          <div onClick={() => setVistaActiva('estadisticas')} style={{ cursor: 'pointer', padding: '10px', backgroundColor: vistaActiva === 'estadisticas' ? '#2e7d32' : 'transparent', borderRadius: '4px', fontWeight: vistaActiva === 'estadisticas' ? 'bold' : 'normal' }}>📊 Estadísticas Forestales</div>
          <div onClick={() => setVistaActiva('pas')} style={{ cursor: 'pointer', padding: '10px', backgroundColor: vistaActiva === 'pas' ? '#2e7d32' : 'transparent', borderRadius: '4px', borderLeft: '3px solid #ffeb3b', fontWeight: vistaActiva === 'pas' ? 'bold' : 'normal' }}>⚖️ Expediente PAS</div>
          <div onClick={() => setVistaActiva('ocr')} style={{ cursor: 'pointer', padding: '10px', backgroundColor: vistaActiva === 'ocr' ? '#d32f2f' : 'transparent', borderRadius: '4px', fontWeight: vistaActiva === 'ocr' ? 'bold' : 'normal' }}>🚨 Alertas OCR</div>
          
          {/* BOTÓN DEL DRON AÑADIDO AQUÍ */}
          <div onClick={() => setVistaActiva('dron')} style={{ cursor: 'pointer', padding: '10px', backgroundColor: vistaActiva === 'dron' ? '#d32f2f' : 'transparent', borderRadius: '4px', borderLeft: '3px solid #ff5252', fontWeight: vistaActiva === 'dron' ? 'bold' : 'normal' }}>🚁 Simulador Dron y Fuego</div>
        </div>

        {vistaActiva === 'mapa' && (
          <div style={{ marginTop: '30px', borderTop: '1px solid #4caf50', paddingTop: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#81c784' }}>🛰️ MAPA BASE:</h4>
            <label style={{ display: 'block', cursor:'pointer', marginBottom: '8px' }}><input type="radio" checked={tipoMapa==='satelite'} onChange={()=>setTipoMapa('satelite')}/> Satélite</label>
            <label style={{ display: 'block', cursor:'pointer' }}><input type="radio" checked={tipoMapa==='osm'} onChange={()=>setTipoMapa('osm')}/> Calles</label>
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <button onClick={() => setModoVisualizacion('app_movil')} style={{ width: '100%', padding: '15px', backgroundColor: '#ffeb3b', color: '#1b5e20', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', fontSize: '15px' }}>📱 Simulador App Móvil</button>
        </div>
      </div>

      {/* ÁREA CENTRAL MULTI-VISTA */}
      <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: '100vh' }}>
        {vistaActiva === 'mapa' && <ComponenteMapa capasActivas={capasActivas} toggleCapa={toggleCapa} tipoMapa={tipoMapa} />}
        {vistaActiva === 'gtf' && <ComponenteGTF />}
        {vistaActiva === 'estadisticas' && <ComponenteEstadisticas />}
        {vistaActiva === 'pas' && <ComponentePAS />}
        {vistaActiva === 'ocr' && <ComponenteOCR />}
        
        {/* COMPONENTE DEL DRON AÑADIDO AQUÍ */}
        {vistaActiva === 'dron' && <ComponenteDronIncendios />} 
      </div>

      {/* BURBUJA DE IA FLOTANTE */}
      <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        {iaAbierta && (
          <div style={{ width: '320px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 5px 20px rgba(0,0,0,0.3)', marginBottom: '15px', overflow: 'hidden', border: '1px solid #ccc' }}>
            <div style={{ backgroundColor: '#2e7d32', color: 'white', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><strong style={{ fontSize: '15px' }}>🦊 IA SITFF Connect</strong><span onClick={() => setIaAbierta(false)} style={{ cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>×</span></div>
            <div style={{ padding: '15px', backgroundColor: '#f9fbe7', fontSize: '14px', minHeight: '120px', color: '#33691e', lineHeight: '1.4' }}>{respuestaIA}</div>
            <div style={{ padding: '10px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '8px', backgroundColor: 'white' }}>
              <input type="text" value={preguntaIA} onChange={(e) => setPreguntaIA(e.target.value)} placeholder="Pregunta algo..." style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' }} onKeyDown={(e) => { if(e.key === 'Enter') simularRespuestaIA() }} />
              <button onClick={simularRespuestaIA} style={{ backgroundColor: '#1565c0', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Enviar</button>
            </div>
          </div>
        )}
        <div onClick={() => setIaAbierta(!iaAbierta)} style={{ width: '65px', height: '65px', backgroundColor: '#f57c00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '35px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', transition: 'transform 0.2s', transform: iaAbierta ? 'scale(0.9)' : 'scale(1)' }} title="Abrir Asistente IA">🦊</div>
      </div>

    </div>
  );
}
// =====================================================================
// BLOQUE 10: SIMULADOR MÓVIL V4 (Cámaras Web Reales, QR, Dron Avanzado y Módulo Ciudadano)
// =====================================================================
function ComponenteSimuladorMovilV2({ volverAlDashboard }) {
  const [pantallaApp, setPantallaApp] = useState('permisos');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tipoActa, setTipoActa] = useState('');

  // Estados de Permisos del Celular
  const [permisoUbicacion, setPermisoUbicacion] = useState(false);
  const [permisoCamara, setPermisoCamara] = useState(false);

  // Estados para la Cubicación e Inteligencia de Cámara
  const [diametroProm, setDiametroProm] = useState('');
  const [longitudTroza, setLongitudTroza] = useState('');
  const [cantidadTrozas, setCantidadTrozas] = useState('');
  const [volumenM3, setVolumenM3] = useState(null);
  const [volumenPies3, setVolumenPies3] = useState(null);
  const [gtfDeclarada, setGtfDeclarada] = useState('12.5');

  // Estados del Módulo Ciudadano
  const [tipoSolicitud, setTipoSolicitud] = useState('petitorio');
  const [detalleSolicitud, setDetalleSolicitud] = useState('');

  // Funciones de Acceso Directo
  const loginFiscalizador = () => {
    setEmail('inspector@ugffs.gob.pe'); setPassword('******');
    setTimeout(() => setPantallaApp('home_fiscalizador'), 300);
  };

  const loginCiudadano = () => {
    setEmail('titular@petitorio.pe'); setPassword('******');
    setTimeout(() => setPantallaApp('home_concesionario'), 300);
  };

  const manejarLogin = () => {
    if (!email || !password) return alert("Por favor ingrese usuario y contraseña.");
    if (email.toLowerCase().includes('atffs') || email.toLowerCase().includes('ugffs')) {
      setPantallaApp('home_fiscalizador');
    } else {
      setPantallaApp('home_concesionario');
    }
  };

  // Cálculo de Cubicación Forestal
  const calcularCubicacion = () => {
    const d = parseFloat(diametroProm); const l = parseFloat(longitudTroza); const c = parseInt(cantidadTrozas);
    if (!d || !l || !c) return alert("Por favor ingrese todos los valores.");
    const radioM = (d / 100) / 2;
    const volTotalm3 = (Math.PI * Math.pow(radioM, 2) * l) * c;
    const volTotalPies3 = volTotalm3 * 35.3147; // Conversión a pies cúbicos estándar
    setVolumenM3(volTotalm3.toFixed(3));
    setVolumenPies3(volTotalPies3.toFixed(2));
  };

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#1a1a1a', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 9999 }}>
      
      {/* Botón flotante para salir del simulador */}
      <button onClick={volverAlDashboard} style={{ position: 'absolute', top: '30px', left: '30px', padding: '12px 24px', backgroundColor: '#ffeb3b', color: '#1b5e20', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
        ⬅ Volver al Dashboard Web (PC)
      </button>

      {/* CARCASA DEL TELÉFONO MÓVIL */}
      <div style={{ width: '375px', height: '780px', backgroundColor: '#f4f6f8', borderRadius: '40px', border: '14px solid #000', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', position: 'relative' }}>
         
         {/* BARRA SUPERIOR DE ESTADO */}
         <div style={{ backgroundColor: '#000', color: '#fff', height: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', fontSize: '11px', fontWeight: 'bold' }}>
           <span>14:05</span><div style={{ display: 'flex', gap: '5px' }}><span>📶</span><span>🔋 98%</span></div>
         </div>

         {/* ================= PANTALLA 0: PERMISOS DEL SISTEMA ================= */}
         {pantallaApp === 'permisos' && (
           <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
             <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', width: '100%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
               <div style={{ fontSize: '45px', marginBottom: '10px' }}>🔒</div>
               <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '18px' }}>Permisos de la App SITFF</h3>
               <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.4', marginBottom: '20px' }}>La app requiere acceso a GPS y a la Cámara Web para la lectura de códigos QR y cubicación inteligente.</p>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', marginBottom: '20px', fontSize: '13px', backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '8px' }}>
                 <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                   <input type="checkbox" checked={permisoUbicacion} onChange={(e)=>setPermisoUbicacion(e.target.checked)} /> 📍 Acceso a Ubicación GPS
                 </label>
                 <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                   <input type="checkbox" checked={permisoCamara} onChange={(e)=>setPermisoCamara(e.target.checked)} /> 📷 Uso de Cámara Web y LPR
                 </label>
               </div>

               <button onClick={() => {
                 if(!permisoUbicacion || !permisoCamara) {
                   alert("Debe autorizar ambos permisos."); return;
                 }
                 setPantallaApp('login');
               }} style={{ width: '100%', padding: '14px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
                 Autorizar y Continuar ➔
               </button>
             </div>
           </div>
         )}

         {/* ================= PANTALLA 1: LOGIN ================= */}
         {pantallaApp === 'login' && (
           <div style={{ padding: '30px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: 'white' }}>
             <div style={{ textAlign: 'center', marginBottom: '25px' }}><div style={{ fontSize: '50px' }}>🌲</div><h1 style={{ color: '#2e7d32', margin: '5px 0 0 0', fontSize: '24px' }}>SITFF Móvil V4</h1><p style={{ color: '#666', marginTop: '3px', fontSize: '12px' }}>Control Forestal, Minero y Ciudadano</p></div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px', backgroundColor: '#f5f5f5', outline: 'none' }} />
               <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px', backgroundColor: '#f5f5f5', outline: 'none' }} />
               <button onClick={manejarLogin} style={{ padding: '14px', backgroundColor: '#1565c0', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '5px' }}>Ingresar</button>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '15px 0' }}><div style={{ height: '1px', backgroundColor: '#ddd', flex: 1 }}></div><span style={{ color: '#999', fontSize: '11px' }}>ACCESO RÁPIDO (DEMO)</span><div style={{ height: '1px', backgroundColor: '#ddd', flex: 1 }}></div></div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
               <button onClick={loginFiscalizador} style={{ padding: '12px', backgroundColor: '#e8f5e9', color: '#1b5e20', border: '2px solid #4caf50', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>👨‍✈️ Entrar como Fiscalizador</button>
               <button onClick={loginCiudadano} style={{ padding: '12px', backgroundColor: '#fff3e0', color: '#e65100', border: '2px solid #ff9800', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>👷 Entrar como Titular / Ciudadano</button>
             </div>
           </div>
         )}

         {/* ================= PANTALLA 2: HOME FISCALIZADOR ================= */}
         {pantallaApp === 'home_fiscalizador' && (
           <div style={{ flex: 1, backgroundColor: '#f4f6f8', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
             <div style={{ backgroundColor: '#1b5e20', padding: '20px 20px 15px 20px', color: 'white', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><p style={{ margin: 0, fontSize: '11px', opacity: 0.8 }}>Inspector Ambiental</p><h2 style={{ margin: '3px 0 0 0', fontSize: '17px' }}>Carlos Reyes</h2><span style={{ display: 'inline-block', marginTop: '3px', padding: '2px 8px', backgroundColor: '#4caf50', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>📍 Puesto: Rancho</span></div>
                  <button onClick={() => setPantallaApp('login')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Salir</button>
                </div>
             </div>
             
             <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
               <div onClick={() => setPantallaApp('fisc_escaner_qr')} style={{ backgroundColor: 'white', padding: '15px 10px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid #eee' }}>
                 <div style={{ fontSize: '28px', marginBottom: '6px' }}>📷</div><strong style={{ color: '#333', fontSize: '12px' }}>Escanear QR (Cámara Real)</strong>
               </div>
               
               <div onClick={() => setPantallaApp('fisc_cubicacion')} style={{ backgroundColor: 'white', padding: '15px 10px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', cursor: 'pointer', border: '2px solid #2e7d32' }}>
                 <div style={{ fontSize: '28px', marginBottom: '6px' }}>🪵</div><strong style={{ color: '#2e7d32', fontSize: '12px' }}>Cámara Inteligente (Cubicación)</strong>
               </div>

               <div onClick={() => setPantallaApp('fisc_intervencion')} style={{ backgroundColor: 'white', padding: '15px 10px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid #eee' }}>
                 <div style={{ fontSize: '28px', marginBottom: '6px' }}>🛑</div><strong style={{ color: '#d32f2f', fontSize: '12px' }}>Intervención Tráfico</strong>
               </div>
               <div onClick={() => setPantallaApp('fisc_incendio')} style={{ backgroundColor: 'white', padding: '15px 10px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid #eee' }}>
                 <div style={{ fontSize: '28px', marginBottom: '6px' }}>🔥</div><strong style={{ color: '#e65100', fontSize: '12px' }}>Reporte Incendio (Dron)</strong>
               </div>
               <div onClick={() => setPantallaApp('fisc_inspecciones')} style={{ backgroundColor: 'white', padding: '15px 10px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', gridColumn: 'span 2', cursor: 'pointer', border: '1px solid #eee' }}>
                 <div style={{ fontSize: '22px', marginBottom: '4px' }}>📋</div><strong style={{ color: '#333', fontSize: '12px' }}>Mis Inspecciones (Expedientes)</strong>
               </div>
             </div>
           </div>
         )}

         {/* ================= SUB-PANTALLA: ESCÁNER QR CON CÁMARA REAL DE LA LAPTOP ================= */}
         {pantallaApp === 'fisc_escaner_qr' && (
           <div style={{ flex: 1, backgroundColor: '#000', display: 'flex', flexDirection: 'column', position: 'relative' }}>
             <button onClick={() => setPantallaApp('home_fiscalizador')} style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 10, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>⬅ Atrás</button>
             
             {/* Componente nativo de HTML5 para activar la cámara web real */}
             <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
               <video autoPlay playsInline muted ref={node => {
                 if (node && !node.srcObject) {
                   navigator.mediaDevices.getUserMedia({ video: true })
                     .then(stream => { node.srcObject = stream; })
                     .catch(err => console.log("Cámara no disponible:", err));
                 }
               }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               
               {/* Visor Láser Superpuesto */}
               <div style={{ position: 'absolute', border: '3px dashed #00e676', width: '220px', height: '220px', borderRadius: '12px', boxShadow: '0 0 20px rgba(0,230,118,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                 <div style={{ color: '#fff', backgroundColor: 'rgba(0,0,0,0.7)', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', textAlign: 'center' }}>Alinee el Código QR de la GTF aquí</div>
               </div>
             </div>
           </div>
         )}

         {/* ================= SUB-PANTALLA: CÁMARA INTELIGENTE (CUBICACIÓN M3 y PIES3) ================= */}
         {pantallaApp === 'fisc_cubicacion' && (
           <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', overflowY: 'auto' }}>
             <button onClick={() => setPantallaApp('home_fiscalizador')} style={{ background: 'none', border: 'none', color: '#1565c0', fontSize: '14px', cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold', padding: 0 }}>⬅ Atrás</button>
             <h2 style={{ color: '#2e7d32', marginTop: 0, fontSize: '18px' }}>🪵 Cubicación y Cámara en Vivo</h2>
             
             {/* Activar también cámara web para cubicación visual */}
             <div style={{ width: '100%', height: '130px', backgroundColor: '#000', borderRadius: '6px', overflow: 'hidden', marginBottom: '10px', position: 'relative' }}>
               <video autoPlay playsInline muted ref={node => {
                 if (node && !node.srcObject) {
                   navigator.mediaDevices.getUserMedia({ video: true })
                     .then(stream => { node.srcObject = stream; })
                     .catch(err => console.log("Cámara no disponible:", err));
                 }
               }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               <div style={{ position: 'absolute', bottom: '5px', left: '5px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#00e676', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>🟢 IA Analizando Trozas</div>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               <div><label style={{ fontSize: '11px', fontWeight: 'bold', color: '#555' }}>GTF Declarada (m³)</label><input type="number" value={gtfDeclarada} onChange={(e)=>setGtfDeclarada(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} /></div>
               <div style={{ display: 'flex', gap: '8px' }}>
                 <div style={{ flex: 1 }}><label style={{ fontSize: '10px', fontWeight: 'bold' }}>Diámetro (cm)</label><input type="number" placeholder="55" value={diametroProm} onChange={(e)=>setDiametroProm(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                 <div style={{ flex: 1 }}><label style={{ fontSize: '10px', fontWeight: 'bold' }}>Longitud (m)</label><input type="number" placeholder="5.0" value={longitudTroza} onChange={(e)=>setLongitudTroza(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                 <div style={{ flex: 1 }}><label style={{ fontSize: '10px', fontWeight: 'bold' }}>Cantidad</label><input type="number" placeholder="12" value={cantidadTrozas} onChange={(e)=>setCantidadTrozas(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
               </div>
               
               <button onClick={calcularCubicacion} style={{ padding: '10px', backgroundColor: '#1565c0', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Calcular Volumen Real</button>

               {volumenM3 !== null && (
                 <div style={{ backgroundColor: '#f1f8e9', padding: '10px', borderRadius: '6px', border: '1px solid #c8e6c9' }}>
                   <p style={{ margin: '2px 0', fontSize: '11px' }}><strong>Metros Cúbicos:</strong> {volumenM3} m³</p>
                   <p style={{ margin: '2px 0', fontSize: '11px' }}><strong>Pies Cúbicos:</strong> {volumenPies3} pies³</p>
                   <div style={{ marginTop: '5px', padding: '4px', backgroundColor: parseFloat(volumenM3) > parseFloat(gtfDeclarada) ? '#ffebee' : '#e8f5e9', color: parseFloat(volumenM3) > parseFloat(gtfDeclarada) ? '#c62828' : '#2e7d32', fontWeight: 'bold', fontSize: '10px', textAlign: 'center' }}>
                     {parseFloat(volumenM3) > parseFloat(gtfDeclarada) ? '🚨 EXCESO DETECTADO (Sobrepeso)' : '✓ CARGA CONFORME'}
                   </div>
                 </div>
               )}
             </div>
           </div>
         )}

         {/* ================= SUB-PANTALLA: REPORTE INCENDIO AVANZADO (ROTHERMEL) ================= */}
         {pantallaApp === 'fisc_incendio' && (
           <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', overflowY: 'auto' }}>
             <button onClick={() => setPantallaApp('home_fiscalizador')} style={{ background: 'none', border: 'none', color: '#1565c0', fontSize: '14px', cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold', padding: 0 }}>⬅ Atrás</button>
             <h2 style={{ color: '#e65100', marginTop: 0, fontSize: '18px' }}>🔥 Reporte y Variables de Incendio</h2>
             <p style={{ fontSize: '11px', color: '#666', marginBottom: '10px' }}>Parámetros para modelar la dispersión del fuego (Rothermel).</p>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               <div><label style={{ fontSize: '11px', fontWeight: 'bold' }}>Velocidad del Viento (km/h)</label><input type="number" placeholder="25" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
               <div><label style={{ fontSize: '11px', fontWeight: 'bold' }}>Dirección del Viento</label><select style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: 'white' }}><option>Noreste (NE)</option><option>Noroeste (NO)</option><option>Sureste (SE)</option><option>Suroeste (SO)</option></select></div>
               <div><label style={{ fontSize: '11px', fontWeight: 'bold' }}>Pendiente del Terreno (%)</label><input type="number" placeholder="35 (Cuesta arriba)" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
               <div><label style={{ fontSize: '11px', fontWeight: 'bold' }}>Humedad del Combustible (%)</label><input type="number" placeholder="22 (Crítico)" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
               
               <button onClick={() => { alert('Variables enviadas al modelo de predicción del Dashboard.'); volverAlDashboard(); }} style={{ padding: '12px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>🚁 Enlazar con Dron y Predecir</button>
             </div>
           </div>
         )}

         {/* ================= SUB-PANTALLA: MENÚ DE ACTAS ================= */}
         {pantallaApp === 'fisc_intervencion' && (
           <div style={{ flex: 1, backgroundColor: '#f4f6f8', padding: '20px', overflowY: 'auto' }}>
             <button onClick={() => setPantallaApp('home_fiscalizador')} style={{ background: 'none', border: 'none', color: '#1565c0', fontSize: '14px', cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold', padding: 0 }}>⬅ Atrás</button>
             <h2 style={{ color: '#d32f2f', marginTop: 0, marginBottom: '5px', fontSize: '18px' }}>Generar Actas</h2>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
               <button onClick={() => { setTipoActa('Inmovilización Maderable'); setPantallaApp('fisc_form_acta'); }} style={{ padding: '12px', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '6px', textAlign: 'left', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>🛑 Acta de Inmovilización</button>
               <button onClick={() => { setTipoActa('Decomiso de Fauna'); setPantallaApp('fisc_form_acta'); }} style={{ padding: '12px', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '6px', textAlign: 'left', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>🐒 Acta de Decomiso de Fauna</button>
             </div>
           </div>
         )}

         {pantallaApp === 'fisc_form_acta' && (
           <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', overflowY: 'auto' }}>
             <button onClick={() => setPantallaApp('fisc_intervencion')} style={{ background: 'none', border: 'none', color: '#1565c0', fontSize: '14px', cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold', padding: 0 }}>⬅ Atrás</button>
             <h2 style={{ color: '#1b5e20', marginTop: 0, fontSize: '18px' }}>Acta de {tipoActa}</h2>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
               <div><label style={{ fontSize: '11px', fontWeight: 'bold' }}>Infractor / RUC / DNI</label><input type="text" placeholder="Nombre o RUC" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
               <div><label style={{ fontSize: '11px', fontWeight: 'bold' }}>Coordenadas GPS</label><input type="text" value="-9.88001, -76.15234" readOnly style={{ width: '100%', padding: '10px', border: '1px solid #ccc', backgroundColor: '#f5f5f5' }} /></div>
               <button onClick={() => { alert('Acta guardada correctamente.'); setPantallaApp('home_fiscalizador'); }} style={{ padding: '12px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar y Sincronizar</button>
             </div>
           </div>
         )}

         {pantallaApp === 'fisc_inspecciones' && (
           <div style={{ flex: 1, backgroundColor: '#f4f6f8', padding: '20px', overflowY: 'auto' }}>
             <button onClick={() => setPantallaApp('home_fiscalizador')} style={{ background: 'none', border: 'none', color: '#1565c0', fontSize: '14px', cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold', padding: 0 }}>⬅ Atrás</button>
             <h2 style={{ color: '#333', marginTop: 0, fontSize: '18px' }}>Mis Inspecciones</h2>
             <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #4caf50' }}>
               <strong style={{ color: '#2e7d32' }}>EXP-001-2026</strong><p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Inspección Maderera Sincronizada</p>
             </div>
           </div>
         )}

         {/* ================= PANTALLA 3: HOME CIUDADANO / TITULAR (PETITORIOS, GTF, PAS, REPUTACIÓN) ================= */}
         {pantallaApp === 'home_concesionario' && (
           <div style={{ flex: 1, backgroundColor: '#f4f6f8', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
             <div style={{ backgroundColor: '#e65100', padding: '20px 20px 15px 20px', color: 'white', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px' }}>Titular / Concesionario</p>
                    <h2 style={{ margin: '3px 0 0 0', fontSize: '17px' }}>Maderera Amazonas</h2>
                    {/* SEMÁFORO DE REPUTACIÓN / BUEN TITULAR */}
                    <span style={{ display: 'inline-block', marginTop: '4px', padding: '3px 8px', backgroundColor: '#2e7d32', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>⭐ Calificación: Titular Sostenible (Ejemplar)</span>
                  </div>
                  <button onClick={() => setPantallaApp('login')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>Salir</button>
                </div>
             </div>

             {/* Grid de Servicios del Ciudadano */}
             <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
               <div onClick={() => setPantallaApp('ciu_petitorio')} style={{ backgroundColor: 'white', padding: '15px 10px', borderRadius: '10px', textAlign: 'center', border: '1px solid #eee', cursor: 'pointer' }}>
                 <div style={{ fontSize: '26px', marginBottom: '6px' }}>🟩</div><strong style={{ fontSize: '12px' }}>Solicitud Petitorio</strong>
               </div>
               <div onClick={() => setPantallaApp('ciu_transporte')} style={{ backgroundColor: 'white', padding: '15px 10px', borderRadius: '10px', textAlign: 'center', border: '1px solid #eee', cursor: 'pointer' }}>
                 <div style={{ fontSize: '26px', marginBottom: '6px' }}>📝</div><strong style={{ fontSize: '12px' }}>Solicitud Transporte</strong>
               </div>
               <div onClick={() => setPantallaApp('ciu_descargo')} style={{ backgroundColor: 'white', padding: '15px 10px', borderRadius: '10px', textAlign: 'center', border: '1px solid #eee', cursor: 'pointer' }}>
                 <div style={{ fontSize: '26px', marginBottom: '6px' }}>📂</div><strong style={{ fontSize: '12px' }}>Presentar Evidencias PAS</strong>
               </div>
               <div onClick={() => setPantallaApp('ciu_seguimiento')} style={{ backgroundColor: 'white', padding: '15px 10px', borderRadius: '10px', textAlign: 'center', border: '1px solid #eee', cursor: 'pointer' }}>
                 <div style={{ fontSize: '26px', marginBottom: '6px' }}>⚖️</div><strong style={{ fontSize: '12px' }}>Estado Sanciones PAS</strong>
               </div>
             </div>
           </div>
         )}

         {/* SUB-PANTALLA: SOLICITUD DE PETITORIO */}
         {pantallaApp === 'ciu_petitorio' && (
           <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', overflowY: 'auto' }}>
             <button onClick={() => setPantallaApp('home_concesionario')} style={{ background: 'none', border: 'none', color: '#1565c0', fontSize: '14px', cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold', padding: 0 }}>⬅ Atrás</button>
             <h2 style={{ color: '#e65100', marginTop: 0, fontSize: '18px' }}>🟩 Solicitud de Petitorio</h2>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
               <div><label style={{ fontSize: '11px', fontWeight: 'bold' }}>Tipo de Concesión</label><select style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: 'white' }}><option>Bosque de Producción Permanente (BPP)</option><option>Pequeña Minería / Minería Artesanal</option></select></div>
               <div><label style={{ fontSize: '11px', fontWeight: 'bold' }}>Área Solicitada (Hectáreas)</label><input type="number" placeholder="500 ha" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
               <button onClick={() => { alert('Solicitud enviada a evaluación regional.'); setPantallaApp('home_concesionario'); }} style={{ padding: '12px', backgroundColor: '#e65100', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>Enviar Solicitud</button>
             </div>
           </div>
         )}

         {/* SUB-PANTALLA: SOLICITUD DE TRANSPORTE Y EXTRACCIÓN */}
         {pantallaApp === 'ciu_transporte' && (
           <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', overflowY: 'auto' }}>
             <button onClick={() => setPantallaApp('home_concesionario')} style={{ background: 'none', border: 'none', color: '#1565c0', fontSize: '14px', cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold', padding: 0 }}>⬅ Atrás</button>
             <h2 style={{ color: '#e65100', marginTop: 0, fontSize: '18px' }}>📝 Solicitud de Guía (GTF)</h2>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
               <div><label style={{ fontSize: '11px', fontWeight: 'bold' }}>Especie Maderable</label><input type="text" placeholder="Tornillo / Lupuna" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
               <div><label style={{ fontSize: '11px', fontWeight: 'bold' }}>Volumen a Extraer (m³)</label><input type="number" placeholder="20 m³" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
               <button onClick={() => { alert('Guía solicitada con éxito.'); setPantallaApp('home_concesionario'); }} style={{ padding: '12px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>Solicitar GTF</button>
             </div>
           </div>
         )}

         {/* SUB-PANTALLA: PRESENTAR EVIDENCIAS PARA DAR DE BAJA PAS */}
         {pantallaApp === 'ciu_descargo' && (
           <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', overflowY: 'auto' }}>
             <button onClick={() => setPantallaApp('home_concesionario')} style={{ background: 'none', border: 'none', color: '#1565c0', fontSize: '14px', cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold', padding: 0 }}>⬅ Atrás</button>
             <h2 style={{ color: '#e65100', marginTop: 0, fontSize: '18px' }}>📂 Presentar Descargos (PAS)</h2>
             <p style={{ fontSize: '11px', color: '#666' }}>Adjunte pruebas y descargos para solicitar la baja del procedimiento sancionador.</p>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
               <div><label style={{ fontSize: '11px', fontWeight: 'bold' }}>N° de Expediente PAS</label><input type="text" placeholder="EXP-PAS-001" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
               <div><label style={{ fontSize: '11px', fontWeight: 'bold' }}>Justificación / Descargos</label><textarea placeholder="Explique los fundamentos..." style={{ width: '100%', padding: '8px', border: '1px solid #ccc', height: '60px' }}></textarea></div>
               <button onClick={() => { alert('Evidencias enviadas para revisión legal.'); setPantallaApp('home_concesionario'); }} style={{ padding: '12px', backgroundColor: '#1565c0', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>Enviar Descargos</button>
             </div>
           </div>
         )}

         {/* SUB-PANTALLA: SEGUIMIENTO DE SANCIONES PAS */}
         {pantallaApp === 'ciu_seguimiento' && (
           <div style={{ flex: 1, backgroundColor: '#f4f6f8', padding: '20px', overflowY: 'auto' }}>
             <button onClick={() => setPantallaApp('home_concesionario')} style={{ background: 'none', border: 'none', color: '#1565c0', fontSize: '14px', cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold', padding: 0 }}>⬅ Atrás</button>
             <h2 style={{ color: '#333', marginTop: 0, fontSize: '18px' }}>⚖️ Estado de Sanciones</h2>
             <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #ff9800', marginTop: '10px' }}>
               <strong style={{ color: '#e65100' }}>EXP-PAS-001</strong>
               <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Estado: En evaluación de descargos (Sin sanción firme)</p>
             </div>
           </div>
         )}
         
         <div style={{ height: '35px', backgroundColor: '#000', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 'auto' }}>
            <div style={{ width: '120px', height: '5px', backgroundColor: '#555', borderRadius: '10px' }}></div>
         </div>
      </div>
    </div>
  );
}
// =====================================================================
// BLOQUE 11: MÓDULO DE AUDITORÍA DE MITIGACIÓN Y PORCENTAJE DE DEFORESTACIÓN
// =====================================================================
function ComponenteMitigacionPetitorios() {
  const [petitorioSeleccionado, setPetitorioSeleccionado] = useState('ATF-2026-1045 (Maderera Amazonas)');

  // Base de datos de auditoría ambiental por petitorio
  const datosAuditoria = {
    'ATF-2026-1045 (Maderera Amazonas)': {
      titular: 'Maderera Amazonas SAC',
      ubicacion: 'Puerto Inca, Huánuco',
      areaTotal: '500 ha',
      deforestacionPct: 18.5, // Porcentaje deforestado del total
      mitigacionPct: 82.0,    // Porcentaje de avance del plan de mitigación
      extraccionPct: 65.4,    // Cuota de madera extraída vs autorizada
      especiesPrincipal: 'Tornillo, Lupuna',
      estadoPlan: '🟢 Cumplimiento Satisfactorio',
      observaciones: 'El titular mantiene vivero forestal activo y cumple con las cortas de protección.'
    },
    'ATF-2026-1088 (Consorcio El Shaddai)': {
      titular: 'Consorcio Forestal El Shaddai',
      ubicacion: 'Ucayali / Frontera',
      areaTotal: '1,200 ha',
      deforestacionPct: 45.2,
      mitigacionPct: 40.0,
      extraccionPct: 91.0,
      especiesPrincipal: 'Caoba, Cedro',
      estadoPlan: '🟡 En Advertencia (Mitigación Lenta)',
      observaciones: 'Se requiere visita de inspección inopinada por retraso en reforestación de fajas.'
    },
    'MIN-2026-3021 (Minera Aurífera Sostenible)': {
      titular: 'Inversiones Mineras Huánuco EIRL',
      ubicacion: 'Ambo, Huánuco',
      areaTotal: '150 ha',
      deforestacionPct: 12.0,
      mitigacionPct: 90.0,
      extraccionPct: 50.0,
      especiesPrincipal: 'Mineral Polimetálico / Suelos',
      estadoPlan: '🟢 Excelente Remediación de Relaves',
      observaciones: 'Plan de cierre progresivo ejecutándose según cronograma aprobado.'
    }
  };

  const actual = datosAuditoria[petitorioSeleccionado];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', backgroundColor: '#f4f6f8', overflowY: 'auto' }}>
      
      {/* CABECERA */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', borderLeft: '5px solid #2e7d32' }}>
        <h1 style={{ color: '#2e7d32', margin: '0 0 5px 0', fontSize: '22px' }}>📊 Auditoría de Planes de Mitigación y Deforestación</h1>
        <p style={{ color: '#666', margin: 0, fontSize: '13px' }}>Control porcentual de impacto ambiental, cuotas de extracción y remediación por titular.</p>
      </div>

      {/* SELECTOR DE PETITORIO */}
      <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>Seleccione Concesión / Petitorio a Auditar:</label>
        <select value={petitorioSeleccionado} onChange={(e) => setPetitorioSeleccionado(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontWeight: 'bold', fontSize: '14px', backgroundColor: '#f9f9f9' }}>
          {Object.keys(datosAuditoria).map(key => <option key={key} value={key}>{key}</option>)}
        </select>
      </div>

      {/* TARJETAS DE INDICADORES (KPIs) */}
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        
        {/* PORCENTAJE DE DEFORESTACIÓN */}
        <div style={{ flex: '1 1 250px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, color: '#666', fontSize: '13px', fontWeight: 'bold' }}>📉 % Deforestación vs Área Total</p>
          <h2 style={{ margin: '10px 0', color: '#d32f2f', fontSize: '28px' }}>{actual.deforestacionPct}%</h2>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${actual.deforestacionPct}%`, height: '100%', backgroundColor: '#d32f2f' }}></div>
          </div>
          <span style={{ fontSize: '11px', color: '#888', marginTop: '6px', display: 'block' }}>Área total autorizada: {actual.areaTotal}</span>
        </div>

        {/* AVANCE PLAN DE MITIGACIÓN */}
        <div style={{ flex: '1 1 250px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, color: '#666', fontSize: '13px', fontWeight: 'bold' }}>🌱 % Avance Plan de Mitigación</p>
          <h2 style={{ margin: '10px 0', color: '#2e7d32', fontSize: '28px' }}>{actual.mitigacionPct}%</h2>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${actual.mitigacionPct}%`, height: '100%', backgroundColor: '#2e7d32' }}></div>
          </div>
          <span style={{ fontSize: '11px', color: '#888', marginTop: '6px', display: 'block' }}>Estatus: {actual.estadoPlan}</span>
        </div>

        {/* CUOTA DE EXTRACCIÓN REAL */}
        <div style={{ flex: '1 1 250px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, color: '#666', fontSize: '13px', fontWeight: 'bold' }}>🪵 % Cuota Extraída vs Máxima</p>
          <h2 style={{ margin: '10px 0', color: '#1565c0', fontSize: '28px' }}>{actual.extraccionPct}%</h2>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${actual.extraccionPct}%`, height: '100%', backgroundColor: '#1565c0' }}></div>
          </div>
          <span style={{ fontSize: '11px', color: '#888', marginTop: '6px', display: 'block' }}>Especies: {actual.especiesPrincipal}</span>
        </div>

      </div>

      {/* INFORME TÉCNICO DE AUDITORÍA */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '16px' }}>📝 Dictamen Técnico de la ATFFS / UGFFS</h3>
        <p style={{ fontSize: '14px', color: '#444', lineHeight: '1.5', margin: '0 0 15px 0' }}>{actual.observaciones}</p>
        <button onClick={() => alert(`Generando reporte PDF de auditoría ambiental para ${actual.titular}...`)} style={{ backgroundColor: '#1565c0', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          📥 Descargar Expediente de Mitigación (PDF)
        </button>
      </div>

    </div>
  );
}
// =====================================================================
// BLOQUE 12: PREDICCIÓN DE RUTAS DE TRÁFICO ILEGAL (MADERA Y FAUNA)
// =====================================================================
function ComponentePrediccionRutas() {
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos', 'madera', 'fauna'
  const [corredorSeleccionado, setCorredorSeleccionado] = useState(0);

  // Iconos locales independientes para el mapa predictivo
  const iconoGarita = new L.DivIcon({ html: '🛡️', className: 'dummy', iconSize: [28, 28] });
  const iconoTargetIA = new L.DivIcon({ html: '🎯', className: 'dummy', iconSize: [32, 32] });
  const iconoReporte = new L.DivIcon({ html: '⚠️', className: 'dummy', iconSize: [24, 24] });

  // Zonas con mayor concentración histórica de reportes e intervenciones (Hotspots)
  const zonasConcentracion = [
    { id: 1, nombre: 'Núcleo Puerto Inca - Sungaro', coords: [-9.38, -74.96], reportes: 64, radio: 18000, tipo: 'Madera Ilegal (Tornillo / Caoba)' },
    { id: 2, nombre: 'Núcleo Frontera Ucayali - Pachitea', coords: [-8.85, -74.85], reportes: 52, radio: 22000, tipo: 'Mixto (Madera y Fauna Exótica)' },
    { id: 3, nombre: 'Núcleo Tingo María - Valle del Monzón', coords: [-9.28, -76.08], reportes: 47, radio: 15000, tipo: 'Fauna Silvestre (Aves / Primates)' },
    { id: 4, nombre: 'Núcleo Codo del Pozuzo', coords: [-9.67, -75.46], reportes: 39, radio: 16000, tipo: 'Madera en Trozas y Carbón' }
  ];

  // Puestos de control fijos que los traficantes intentan evadir
  const controlesFijos = [
    { id: 1, nombre: 'Garita Oficial Rancho', coords: [-9.83, -76.12] },
    { id: 2, nombre: 'Garita Oficial Ambo', coords: [-10.13, -76.20] },
    { id: 3, nombre: 'Control Policial Tingo María', coords: [-9.30, -75.99] }
  ];

  // Rutas predichas por la IA basadas en densidad de reportes y evasión de garitas
  const rutasPredichas = [
    {
      id: 0,
      nombre: 'Corredor Evasión Oriental (Puerto Inca ➔ Codo del Pozuzo ➔ Oxapampa)',
      tipo: 'madera',
      etiquetaTipo: '🪵 Tráfico de Madera',
      probabilidad: 92,
      color: '#d32f2f', // Rojo intenso
      reportesAsociados: 103,
      horarioCritico: '23:30 hrs - 04:30 hrs',
      modalidad: 'Camiones plataforma por trocha carrozable secundaria sin control LPR.',
      especiesFrecuentes: 'Tornillo, Cedro, Lupuna en cuartones',
      coordenadasRuta: [
        [-9.38, -74.96], [-9.48, -75.15], [-9.58, -75.32], [-9.67, -75.46], [-9.85, -75.55]
      ],
      puntoInterdiccionIA: [-9.58, -75.32],
      lugarInterdiccion: 'Cruce Rural Río Sungaroyacu (Cuello de botella)'
    },
    {
      id: 1,
      nombre: 'Corredor Bioclimático (Monzón ➔ Ruta Alterna Carpish ➔ Huánuco)',
      tipo: 'fauna',
      etiquetaTipo: '🐒 Tráfico de Fauna Silvestre',
      probabilidad: 87,
      color: '#8e24aa', // Morado para fauna
      reportesAsociados: 78,
      horarioCritico: '03:00 hrs - 06:00 hrs',
      modalidad: 'Ocultamiento en bodegas de buses, furgonetas y vehículos particulares.',
      especiesFrecuentes: 'Loro Cabeza Azul, Guacamayos, Mono Choro, Tortugas Taricaya',
      coordenadasRuta: [
        [-9.28, -76.08], [-9.42, -76.15], [-9.62, -76.18], [-9.75, -76.15], [-9.90, -76.22]
      ],
      puntoInterdiccionIA: [-9.62, -76.18],
      lugarInterdiccion: 'Desvío Trocha Chinchao - Antes de Túnel Carpish'
    },
    {
      id: 2,
      nombre: 'Corredor Fluvial-Terrestre (Río Pachitea ➔ Honoria ➔ Carretera FBT)',
      tipo: 'madera',
      etiquetaTipo: '🪵/🐒 Ruta Mixta (Fluvial + Terrestre)',
      probabilidad: 81,
      color: '#f57c00', // Naranja
      reportesAsociados: 65,
      horarioCritico: '19:00 hrs - 02:00 hrs',
      modalidad: 'Transporte en balsas/peque-peque de noche y transbordo a camiones en puerto clandestino.',
      especiesFrecuentes: 'Caoba, Ishpingo y pieles/animales vivos en jaulas ocultas',
      coordenadasRuta: [
        [-8.85, -74.85], [-8.95, -74.78], [-9.12, -74.82], [-9.25, -74.90], [-9.38, -74.96]
      ],
      puntoInterdiccionIA: [-9.12, -74.82],
      lugarInterdiccion: 'Embarcadero No Autorizado Sector Baños / Pachitea'
    }
  ];

  // Filtrar rutas según selección
  const rutasFiltradas = rutasPredichas.filter(r => filtroTipo === 'todos' || r.tipo === filtroTipo);
  const rutaActiva = rutasPredichas[corredorSeleccionado] || rutasPredichas[0];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#f4f6f8' }}>
      
      {/* CABECERA */}
      <div style={{ backgroundColor: 'white', padding: '18px 25px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', borderLeft: '6px solid #6a1b9a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ color: '#4a148c', margin: '0 0 5px 0', fontSize: '22px' }}>🧠 Predicción IA de Rutas de Tráfico Ilegal (Madera y Fauna)</h1>
          <p style={{ color: '#666', margin: 0, fontSize: '13px' }}>Modelado espacial basado en concentración histórica de intervenciones, denuncias y evasión de garitas ATFFS.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setFiltroTipo('todos')} style={{ padding: '8px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', backgroundColor: filtroTipo === 'todos' ? '#4a148c' : '#e0e0e0', color: filtroTipo === 'todos' ? 'white' : '#333' }}>🔍 Todos los Corredores</button>
          <button onClick={() => setFiltroTipo('madera')} style={{ padding: '8px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', backgroundColor: filtroTipo === 'madera' ? '#d32f2f' : '#e0e0e0', color: filtroTipo === 'madera' ? 'white' : '#333' }}>🪵 Tráfico Madera</button>
          <button onClick={() => setFiltroTipo('fauna')} style={{ padding: '8px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', backgroundColor: filtroTipo === 'fauna' ? '#8e24aa' : '#e0e0e0', color: filtroTipo === 'fauna' ? 'white' : '#333' }}>🐒 Tráfico Fauna</button>
        </div>
      </div>

      {/* CUERPO PRINCIPAL: MAPA + PANEL DE INTELIGENCIA */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', flex: 1 }}>
        
        {/* COLUMNA IZQUIERDA: MAPA PREDICTIVO */}
        <div style={{ flex: '2 1 550px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '12px' }}>
            <strong style={{ color: '#333', fontSize: '14px' }}>🗺️ Mapa de Probabilidad de Rutas y Cuellos de Botella</strong>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span>🔴 Ruta Madera</span>
              <span>🟣 Ruta Fauna</span>
              <span>🎯 Punto Interdicción IA</span>
              <span>🛡️ Garita Oficial</span>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: '460px', borderRadius: '6px', overflow: 'hidden', border: '2px solid #ccc' }}>
            <MapContainer center={[-9.45, -75.50]} zoom={8} style={{ height: '100%', width: '100%', zIndex: 0 }}>
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />

              {/* 1. ZONAS DE ALTA CONCENTRACIÓN DE REPORTES (HOTSPOTS DE ORIGEN) */}
              <LayerGroup>
                {zonasConcentracion.map((zona) => (
                  <LayerGroup key={`zona-${zona.id}`}>
                    <Circle center={zona.coords} radius={zona.radio} pathOptions={{ color: '#ffeb3b', weight: 1, fillColor: '#ff1744', fillOpacity: 0.35 }} />
                    <Marker position={zona.coords} icon={iconoReporte}>
                      <Popup>
                        <div style={{ fontSize: '12px' }}>
                          <strong style={{ color: '#d32f2f' }}>⚠️ {zona.nombre}</strong><br/>
                          <strong>Reportes acumulados:</strong> {zona.reportes} intervenciones<br/>
                          <strong>Incidencia:</strong> {zona.tipo}
                        </div>
                      </Popup>
                    </Marker>
                  </LayerGroup>
                ))}
              </LayerGroup>

              {/* 2. GARITAS DE CONTROL OFICIALES */}
              <LayerGroup>
                {controlesFijos.map((ctrl) => (
                  <Marker key={`ctrl-${ctrl.id}`} position={ctrl.coords} icon={iconoGarita}>
                    <Popup><strong>🛡️ {ctrl.nombre}</strong><br/>Punto fijo vigilado (Evadido por rutas ilegales).</Popup>
                  </Marker>
                ))}
              </LayerGroup>

              {/* 3. POLILÍNEAS DE RUTAS PREDICHAS Y OBJETIVOS DE EMBOSCADA IA */}
              <LayerGroup>
                {rutasFiltradas.map((ruta) => (
                  <LayerGroup key={`ruta-${ruta.id}`}>
                    {/* Sombra de la ruta */}
                    <Polyline positions={ruta.coordenadasRuta} pathOptions={{ color: '#000', weight: 8, opacity: 0.4 }} />
                    {/* Línea principal de probabilidad */}
                    <Polyline 
                      positions={ruta.coordenadasRuta} 
                      pathOptions={{ color: ruta.color, weight: 5, dashArray: '12, 8' }}
                      eventHandlers={{ click: () => setCorredorSeleccionado(ruta.id) }}
                    >
                      <Popup>
                        <div style={{ fontSize: '12px' }}>
                          <strong style={{ color: ruta.color }}>{ruta.nombre}</strong><br/>
                          <strong>Probabilidad de tránsito:</strong> {ruta.probabilidad}%<br/>
                          <strong>Horario crítico:</strong> {ruta.horarioCritico}
                        </div>
                      </Popup>
                    </Polyline>

                    {/* Marcador de Interdicción Recomendado por IA */}
                    <Marker position={ruta.puntoInterdiccionIA} icon={iconoTargetIA} eventHandlers={{ click: () => setCorredorSeleccionado(ruta.id) }}>
                      <Popup>
                        <div style={{ fontSize: '12px', minWidth: '180px' }}>
                          <strong style={{ color: '#d32f2f' }}>🎯 PUNTO DE INTERDICCIÓN IA</strong><br/>
                          <strong>Ubicación:</strong> {ruta.lugarInterdiccion}<br/>
                          <strong>Probabilidad de captura:</strong> {ruta.probabilidad}%<br/>
                          <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>Recomendado para patrullaje móvil</span>
                        </div>
                      </Popup>
                    </Marker>
                  </LayerGroup>
                ))}
              </LayerGroup>

            </MapContainer>
          </div>
        </div>

        {/* COLUMNA DERECHA: PANEL DE INTELIGENCIA Y SELECCIÓN DE CORREDOR */}
        <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Selector de Corredores Detectados */}
          <div style={{ backgroundColor: 'white', padding: '18px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#4a148c', fontSize: '15px' }}>📡 Corredores Ilegales Detectados</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rutasPredichas.map((r) => (
                <div 
                  key={r.id} 
                  onClick={() => setCorredorSeleccionado(r.id)}
                  style={{ 
                    padding: '12px', borderRadius: '8px', cursor: 'pointer', 
                    border: corredorSeleccionado === r.id ? `2px solid ${r.color}` : '1px solid #ddd',
                    backgroundColor: corredorSeleccionado === r.id ? '#f3e5f5' : '#fafafa'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: r.color }}>{r.etiquetaTipo}</span>
                    <span style={{ backgroundColor: r.color, color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                      {r.probabilidad}% Prob.
                    </span>
                  </div>
                  <strong style={{ fontSize: '13px', color: '#333', display: 'block' }}>{r.nombre}</strong>
                  <span style={{ fontSize: '11px', color: '#666' }}>Basado en {r.reportesAsociados} reportes cercanos</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ficha Forense de la Ruta Seleccionada */}
          <div style={{ backgroundColor: 'white', padding: '18px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', borderTop: `4px solid ${rutaActiva.color}` }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '15px' }}>📋 Análisis Predictivo del Corredor</h3>
            
            <div style={{ fontSize: '13px', color: '#444', lineHeight: '1.7' }}>
              <div><strong>🔥 Nivel de Riesgo:</strong> <span style={{ color: rutaActiva.color, fontWeight: 'bold' }}>CRÍTICO ({rutaActiva.probabilidad}% probabilidad)</span></div>
              <div><strong>🕒 Ventana Horaria Predicha:</strong> {rutaActiva.horarioCritico}</div>
              <div><strong>🎯 Punto de Emboscada IA:</strong> {rutaActiva.lugarInterdiccion}</div>
              <div style={{ marginTop: '6px' }}><strong>🚚 Modalidad de Evasión:</strong><br/><span style={{ fontSize: '12px', color: '#666' }}>{rutaActiva.modalidad}</span></div>
              <div style={{ marginTop: '6px' }}><strong>🐾/🪵 Especies en Riesgo:</strong><br/><span style={{ fontSize: '12px', color: '#666' }}>{rutaActiva.especiesFrecuentes}</span></div>
            </div>

            <button 
              onClick={() => alert(`🚓 OPERATIVO ACTIVADO:\nSe ha enviado la coordenada de interdicción (${rutaActiva.lugarInterdiccion}) a las unidades móviles de la ATFFS y Policía Ambiental para bloqueo en horario ${rutaActiva.horarioCritico}.`)}
              style={{ width: '100%', marginTop: '15px', padding: '12px', backgroundColor: '#4a148c', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', boxShadow: '0 3px 6px rgba(0,0,0,0.2)' }}
            >
              🚓 Desplegar Patrulla en Punto IA (🎯)
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}