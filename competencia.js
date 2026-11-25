const $ = id => document.getElementById(id);

const EQUIPO_DEFAULT = ['Laura Gómez', 'Andrés Pinto', 'Camila Rojas', 'Mateo Gómez', 'Sofía Díaz', 'Julián Mora'];
const PROGRAMAS_DEFAULT = ['Despierta Onda', 'Onda Noticias', 'Conexión Viva', 'Tarde de Parche', 'Ruta Nocturna'];

const hoyISO = () => new Date().toISOString().slice(0, 10);
const mananaISO = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);

const DATOS_EJEMPLO = [
  { id: 1, fecha: '2026-12-03', programa: 'Despierta Onda', horaIni: '07:00', horaFin: '08:00', estado: 'Cubierto', titular: 'Laura Gómez', relevo: 'Andrés Pinto', motivo: 'Enfermedad', obs: 'Avisó a las 6:30 a. m.' },
  { id: 2, fecha: hoyISO(), programa: 'Onda Noticias', horaIni: '12:00', horaFin: '13:30', estado: 'Pendiente', titular: 'Camila Rojas', relevo: '', motivo: 'Cita médica', obs: 'Pendiente confirmar reemplazo para hoy' },
  { id: 3, fecha: mananaISO(), programa: 'Conexión Viva', horaIni: '15:00', horaFin: '17:00', estado: 'Pendiente', titular: 'Sofía Díaz', relevo: '', motivo: 'Permiso', obs: 'Turnos de tarde sin asignar aún' },
  { id: 4, fecha: '2026-11-20', programa: 'Ruta Nocturna', horaIni: '20:00', horaFin: '22:00', estado: 'Sin cubrir', titular: 'Mateo Gómez', relevo: '', motivo: 'Calamidad', obs: 'Se emitió lista musical automatizada' }
];

let equipo = JSON.parse(localStorage.getItem('ov_equipo')) || [...EQUIPO_DEFAULT];
let programas = JSON.parse(localStorage.getItem('ov_programas')) || [...PROGRAMAS_DEFAULT];
let relevos = JSON.parse(localStorage.getItem('ov_relevos')) || [...DATOS_EJEMPLO];

const guardarTodo = () => {
  localStorage.setItem('ov_equipo', JSON.stringify(equipo));
  localStorage.setItem('ov_programas', JSON.stringify(programas));
  localStorage.setItem('ov_relevos', JSON.stringify(relevos));
  renderizarConfig();
  renderizar();
};

function calcularHoras(ini, fin) {
  const [h1, m1] = ini.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  return Math.max(0, ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60);
}

function getSemana(fechaStr) {
  const d = new Date(fechaStr + 'T00:00:00');
  const inicio = new Date(d.getFullYear(), 0, 1);
  return d.getFullYear() + '-W' + Math.ceil((((d - inicio) / 86400000) + inicio.getDay() + 1) / 7);
}

const relevosEnSemana = (nombre, fecha) =>
  relevos.filter(r => r.estado === 'Cubierto' && r.relevo.toLowerCase() === nombre.toLowerCase() && getSemana(r.fecha) === getSemana(fecha)).length;

function hayChoqueHorario(nombre, fecha, ini, fin) {
  return relevos.some(r =>
    r.fecha === fecha &&
    r.estado === 'Cubierto' &&
    r.relevo.toLowerCase() === nombre.toLowerCase() &&
    (ini < r.horaFin && fin > r.horaIni)
  );
}

function sugerirRelevo(fecha, ini, fin, titular) {
  const f = fecha || hoyISO();
  const candidatos = equipo
    .filter(p => p.toLowerCase() !== titular.toLowerCase() && relevosEnSemana(p, f) < 3 && !hayChoqueHorario(p, f, ini, fin))
    .sort((a, b) => relevosEnSemana(a, f) - relevosEnSemana(b, f));
  return candidatos[0] || '';
}

$('btnSugerir').onclick = () => {
  const sug = sugerirRelevo($('fecha').value, $('horaIni').value, $('horaFin').value, $('titular').value.trim());
  if (!sug) return $('errorMsg').textContent = '⚠️ No hay presentadores disponibles sin choque horario o límite semanal.';
  $('errorMsg').textContent = '';
  $('relevo').value = sug;
  $('estado').value = 'Cubierto';
};

function renderizarConfig() {
  $('listaEquipo').innerHTML = equipo.map(p => `<option value="${p}">`).join('');
  $('tagsLocutores').innerHTML = equipo.map((p, i) => `<span class="chip">${p} <button type="button" onclick="delLocutor(${i})">×</button></span>`).join('');

  const valProg = $('programa').value;
  $('programa').innerHTML = '<option value="">Selecciona programa...</option>' + programas.map(p => `<option value="${p}">${p}</option>`).join('');
  $('programa').value = valProg;

  const valFiltroProg = $('filtroPrograma').value;
  $('filtroPrograma').innerHTML = '<option value="Todos">Todos los programas</option>' + programas.map(p => `<option value="${p}">${p}</option>`).join('');
  $('filtroPrograma').value = valFiltroProg || 'Todos';

  $('tagsProgramas').innerHTML = programas.map((p, i) => `<span class="chip">${p} <button type="button" onclick="delPrograma(${i})">×</button></span>`).join('');
}

$('btnAddLocutor').onclick = () => {
  const nom = $('nuevoLocutor').value.trim();
  if (nom && !equipo.includes(nom)) { equipo.push(nom); $('nuevoLocutor').value = ''; guardarTodo(); }
};
$('btnAddPrograma').onclick = () => {
  const prog = $('nuevoPrograma').value.trim();
  if (prog && !programas.includes(prog)) { programas.push(prog); $('nuevoPrograma').value = ''; guardarTodo(); }
};
window.delLocutor = i => { equipo.splice(i, 1); guardarTodo(); };
window.delPrograma = i => { programas.splice(i, 1); guardarTodo(); };

$('relevoForm').addEventListener('submit', e => {
  e.preventDefault();
  $('errorMsg').textContent = '';

  const fecha = $('fecha').value;
  const programa = $('programa').value;
  const horaIni = $('horaIni').value;
  const horaFin = $('horaFin').value;
  const estado = $('estado').value;
  const titular = $('titular').value.trim();
  const relevo = $('relevo').value.trim();
  const motivo = $('motivo').value;
  const obs = $('obs').value.trim() || 'Sin observaciones';

  if (horaFin <= horaIni) return $('errorMsg').textContent = '⚠️ La hora de fin debe ser posterior a la hora de inicio.';
  if (estado === 'Cubierto' && !relevo) return $('errorMsg').textContent = '⚠️ Si el estado es "Cubierto", debes indicar quién cubre.';
  if (relevo && titular.toLowerCase() === relevo.toLowerCase()) return $('errorMsg').textContent = '⚠️ El titular y el relevo deben ser personas distintas.';
  if (estado === 'Cubierto' && relevosEnSemana(relevo, fecha) >= 3) {
    const alt = sugerirRelevo(fecha, horaIni, horaFin, titular);
    return $('errorMsg').textContent = `⚠️ ${relevo} ya tiene 3 relevos esta semana. ${alt ? 'Sugerencia: ' + alt : ''}`;
  }
  if (estado === 'Cubierto' && hayChoqueHorario(relevo, fecha, horaIni, horaFin)) {
    return $('errorMsg').textContent = `⚠️ Choque de horario: ${relevo} ya cubre otro programa el ${fecha} en esa franja.`;
  }

  relevos.unshift({ id: Date.now(), fecha, programa, horaIni, horaFin, estado, titular, relevo, motivo, obs });
  e.target.reset();
  $('fecha').value = hoyISO();
  guardarTodo();
});
function renderizar() {
  const mesSel = $('filtroMes').value;
  const baseMes = mesSel ? relevos.filter(r => r.fecha.startsWith(mesSel)) : relevos;

  const urgentes = relevos.filter(r => r.estado === 'Pendiente' && (r.fecha === hoyISO() || r.fecha === mananaISO()));
  if (urgentes.length > 0) {
    $('bannerAlertas').classList.remove('hidden');
    $('bannerAlertas').innerHTML = `🚨 <strong>Alertas Hoy / Mañana:</strong> Tienes <b>${urgentes.length}</b> turno(s) pendiente(s) próximo(s): ${urgentes.map(u => `<u>${u.programa}</u> (${u.fecha === hoyISO() ? 'HOY' : 'MAÑANA'} ${u.horaIni})`).join(' · ')}`;
  } else {
    $('bannerAlertas').classList.add('hidden');
  }

  const cubiertos = baseMes.filter(r => r.estado === 'Cubierto');
  const pendientes = baseMes.filter(r => r.estado !== 'Cubierto');
  const totalHoras = cubiertos.reduce((acc, r) => acc + calcularHoras(r.horaIni, r.horaFin), 0);

  $('kpiTotal').textContent = baseMes.length;
  $('kpiCubiertos').textContent = cubiertos.length;
  $('kpiPendientes').textContent = pendientes.length;
  $('kpiHoras').textContent = totalHoras.toFixed(1) + ' h';

  const stats = {};
  baseMes.forEach(r => {
    stats[r.titular] = stats[r.titular] || { hechos: 0, faltas: 0, horas: 0 };
    stats[r.titular].faltas++;
    if (r.estado === 'Cubierto' && r.relevo) {
      stats[r.relevo] = stats[r.relevo] || { hechos: 0, faltas: 0, horas: 0 };
      stats[r.relevo].hechos++;
      stats[r.relevo].horas += calcularHoras(r.horaIni, r.horaFin);
    }
  });

  const entradas = Object.entries(stats);
  const maxHoras = Math.max(1, ...entradas.map(([, s]) => s.horas));

  $('graficaHoras').innerHTML = entradas.filter(([, s]) => s.horas > 0).length
    ? entradas.filter(([, s]) => s.horas > 0).sort((a, b) => b.horas - a.horas).map(([nom, s]) => `
        <div class="bar-row">
          <div class="bar-info"><span><strong>${nom}</strong></span><span>${s.horas.toFixed(1)} h (${s.hechos} relevos)</span></div>
          <div class="bar-track"><div class="bar-fill" style="width: ${(s.horas / maxHoras) * 100}%"></div></div>
        </div>
      `).join('')
    : '<p class="empty">Registra turnos cubiertos para ver la gráfica.</p>';

  $('contadorLista').innerHTML = entradas.length
    ? entradas.map(([nom, s]) => {
        const saldo = s.hechos - s.faltas;
        const cls = saldo > 0 ? 'pos' : saldo < 0 ? 'neg' : '';
        const txtSaldo = saldo > 0 ? `+${saldo} a favor` : saldo < 0 ? `${saldo} debe` : 'Equilibrado';
        return `<div class="stat-box">
          <div class="stat-top"><strong>${nom}</strong><span class="badge-eq ${cls}">${txtSaldo}</span></div>
          <div>Cubrió: <b>${s.hechos}</b> · Faltó: <b>${s.faltas}</b></div>
        </div>`;
      }).join('')
    : '<p class="empty">Sin movimientos en este periodo.</p>';

  const txt = $('buscador').value.toLowerCase();
  const est = $('filtroEstado').value;
  const progFiltro = $('filtroPrograma').value;

  const filtrados = [...baseMes]
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id)
    .filter(r =>
      (r.titular + r.relevo + r.programa).toLowerCase().includes(txt) &&
      (est === 'Todos' || r.estado === est) &&
      (progFiltro === 'Todos' || r.programa === progFiltro)
    );

  $('listaRelevos').innerHTML = filtrados.length ? filtrados.map(r => `
    <article class="relevo-card ${r.estado.replace(' ', '-')}">
      <div>
        <div class="meta-line">📅 ${r.fecha} · ⏰ ${r.horaIni} - ${r.horaFin} (${calcularHoras(r.horaIni, r.horaFin).toFixed(1)}h) · 📻 <strong>${r.programa}</strong> · <span class="status-pill">${r.estado}</span></div>
        <p>Titular (faltó): <strong>${r.titular}</strong> ➔ Relevo (cubre): <strong>${r.relevo || 'Sin asignar'}</strong></p>
        <div class="meta-line">Motivo: ${r.motivo} · ${r.obs}</div>
      </div>
      <div class="actions no-print">
        ${r.estado === 'Pendiente' ? `<button class="btn-sm btn-ok" onclick="asignarRapido(${r.id})">✅ Cubrir</button>` : ''}
        <button class="btn-sm btn-del" onclick="eliminarRelevo(${r.id})">Eliminar</button>
      </div>
    </article>
  `).join('') : '<p class="empty">No hay relevos que coincidan con los filtros.</p>';
}

window.asignarRapido = id => {
  const item = relevos.find(r => r.id === id);
  const sug = sugerirRelevo(item.fecha, item.horaIni, item.horaFin, item.titular);
  const nombre = prompt(`¿Quién cubrirá ${item.programa} el ${item.fecha}?\n(Sugerencia disponible: ${sug || 'Ninguna'})`, sug);
  if (!nombre) return;
  if (nombre.trim().toLowerCase() === item.titular.toLowerCase()) return alert('No puede ser el mismo titular.');
  if (relevosEnSemana(nombre.trim(), item.fecha) >= 3) return alert(`${nombre} ya alcanzó el máximo de 3 relevos esa semana.`);
  if (hayChoqueHorario(nombre.trim(), item.fecha, item.horaIni, item.horaFin)) return alert(`${nombre} tiene choque de horario.`);

  item.relevo = nombre.trim();
  item.estado = 'Cubierto';
  guardarTodo();
};

window.eliminarRelevo = id => {
  if (confirm('¿Confirmas que deseas eliminar este registro?')) {
    relevos = relevos.filter(r => r.id !== id);
    guardarTodo();
  }
};

$('btnExportarCSV').onclick = () => {
  const head = ['Fecha,Programa,Inicio,Fin,Horas,Estado,Titular,Relevo,Motivo,Observaciones'];
  const rows = relevos.map(r => `"${r.fecha}","${r.programa}","${r.horaIni}","${r.horaFin}","${calcularHoras(r.horaIni, r.horaFin).toFixed(1)}","${r.estado}","${r.titular}","${r.relevo}","${r.motivo}","${r.obs}"`);
  descargarArchivo(head.concat(rows).join('\n'), 'Bitacora_Onda_Viva.csv', 'text/csv;charset=utf-8;');
};

$('btnBackup').onclick = () => {
  const backup = JSON.stringify({ equipo, programas, relevos }, null, 2);
  descargarArchivo(backup, `Respaldo_OndaViva_${hoyISO()}.json`, 'application/json');
};

$('inputRestore').onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.relevos) {
        relevos = data.relevos;
        if (data.equipo) equipo = data.equipo;
        if (data.programas) programas = data.programas;
        guardarTodo();
        alert('✅ Copia de seguridad restaurada correctamente.');
      }
    } catch { alert('❌ Archivo de respaldo inválido.'); }
  };
  reader.readAsText(file);
};

function descargarArchivo(contenido, nombre, tipo) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  a.download = nombre;
  a.click();
}

$('btnLimpiar').onclick = () => { if (confirm('¿Borrar todos los registros y empezar de cero?')) { relevos = []; guardarTodo(); } };
$('btnEjemplo').onclick = () => { relevos = [...DATOS_EJEMPLO]; guardarTodo(); };
$('btnVerTodosMeses').onclick = () => { $('filtroMes').value = ''; renderizar(); };

$('fecha').value = hoyISO();
$('buscador').oninput = $('filtroEstado').onchange = $('filtroPrograma').onchange = $('filtroMes').onchange = renderizar;
renderizarConfig();
renderizar();
