const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 4173);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'cambiar-clave';
const FS_PASSWORD = process.env.FS_PASSWORD || 'field2026';
const DATA_FILE = path.resolve(process.env.DATA_FILE || path.join(__dirname, 'data.json'));
const PREVIEW_MODE = process.env.PREVIEW_MODE === 'true';
const seed = {
  projects: [
    'POWER SHIELD EDIFICIO MACUL','AMPLIACION AGROSUPER','METRO LINEA 7 ESTACION ISIDORA G','CD LO AGUIRRE','ESTANQUE WAYKU','ESTACION EXTENSION L6 METRO','TELEFERICO BICENTENARIO','TAM ESTACION CIUDAD SATELITE','TAM ESTACION MALLOCO','TAM ESTACION PADRE HURTADO','AMPLIACION COLEGIO LOS ANDES','DANCO ETAPA 2','TALLERES Y COCHERAS TAM PS PAJARITOS','Parque Pajonales','Estanque Nogales Bapa','Estanque Smapa III','Cenco Florida Center','Puente Rabuco','Cesfam Curimon','Estacionamiento Sn Fernando','Aducción Valparaiso','Peap Noruega','Acuenta Talca','Estanque Zapallar','Puente Lo Gallardo','Planta Litueche','Borde Costero Papudo','Muelle Bahía Mansa','La Platina','Estanque Bahía Mansa','Acceso Norte Osorno','UNAB VIÑA','BLUE EXPRESS II','INLAC','TECNASIC','CD MOSAICO','LICEO POLITECNICO','LABORATORIO UC CHRISTUS','CLINICA MEDS','PLANTA TRATAMIENTO TALAGANTE','BLUE EXPRESS ESTACIONAMIENTO','BOULEVARD TOTTUS','TAM PASO SUPERIOR PAJARITOS','ESTACIONAMIENTO ESTACION LOS ANDES','ESTACION SAN CARLOS ESCALA TELEFERICO','EDIFICIO MACUL POWER SHIELD','BOSQUES DE LA LIGUA','CESFAM LAS CABRAS','TAM ESTACION PARQUE HURTADO','TAM TALLERES Y COCHERAS PAJARITOS','ESTANQUE LITUECHE','POWER SHIELD EDIFICIO MACUL - MR','AMPLIACION COLEGIO LOS ANDES - MR','EXTENSION L6 METRO - MR','SALA CUNA HUASCO','TAM ESTACION MALLOCO - MR','TAM CASINO Y EDIFICIO SERVICIOS','TERRATUNEL VALPO','BLUE EXPRESS','BLUE EXPRESS II - SM','LICEO TALTAL','METRO LINEA 7 ESTACION ISIDORA G'
  ],
  people: ['Mauricio R.','Sergio M.','Cristian S.'],
  events: [
    {id:'demo1',date:'2026-08-03',project:'POWER SHIELD EDIFICIO MACUL',person:'Mauricio R.',kind:'visit'},
    {id:'demo2',date:'2026-08-04',project:'Cesfam Las Cabras',person:'Cristian S.',kind:'visit'},
    {id:'demo3',date:'2026-08-05',project:'Estanque Litueche',person:'Cristian S.',kind:'visit'},
    {id:'demo4',date:'2026-08-06',project:'TAM estación Parque Hurtado',person:'Mauricio R.',kind:'visit'},
    {id:'demo5',date:'2026-08-07',project:'Parque Pajonales',person:'Sergio M.',kind:'visit'},
    {id:'demo6',date:'2026-08-10',project:'AMPLIACION COLEGIO LOS ANDES',person:'Mauricio R.',kind:'visit'},
    {id:'demo7',date:'2026-08-11',project:'UNAB VIÑA',person:'Sergio M.',kind:'visit'},
    {id:'demo8',date:'2026-08-12',project:'Estanque Nogales Bapa',person:'Cristian S.',kind:'visit'},
    {id:'demo9',date:'2026-08-13',project:'TALLERES Y COCHERAS TAM PS PAJARITOS',person:'Mauricio R.',kind:'visit'},
    {id:'demo10',date:'2026-08-14',project:'Parque Pajonales',person:'Sergio M.',kind:'visit'},
    {id:'demo11',date:'2026-08-17',project:'La Platina',person:'Sergio M.',kind:'visit'},
    {id:'demo12',date:'2026-08-18',project:'AMPLIACION COLEGIO LOS ANDES',person:'Mauricio R.',kind:'visit'},
    {id:'demo13',date:'2026-08-19',project:'Metro Línea 7',person:'Mauricio R.',kind:'visit'},
    {id:'demo14',date:'2026-08-20',project:'Cesfam Las Cabras',person:'Cristian S.',kind:'visit'},
    {id:'demo15',date:'2026-08-21',project:'Puente Rabuco',person:'Cristian S.',kind:'visit'},
    {id:'demo16',date:'2026-08-24',project:'VACACIONES',person:'Mauricio R.',kind:'leave'},
    {id:'demo17',date:'2026-08-25',project:'Estanque Smapa III',person:'Sergio M.',kind:'visit'},
    {id:'demo18',date:'2026-08-26',project:'Cenco Florida Center',person:'Cristian S.',kind:'visit'},
    {id:'demo19',date:'2026-08-27',project:'Feriado',person:'',kind:'holiday'}
  ]
};
let data;
try { data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { data = seed; fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }
const sessions = new Map();
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
function send(res, status, body, type='application/json; charset=utf-8') { res.writeHead(status, {'Content-Type':type,'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}); res.end(typeof body === 'string' ? body : JSON.stringify(body)); }
function body(req) { return new Promise((resolve,reject)=>{let s='';req.on('data',c=>s+=c);req.on('end',()=>{try{resolve(JSON.parse(s||'{}'))}catch(e){reject(e)}})}); }
function currentSession(req) { return sessions.get((req.headers.cookie||'').match(/fs_session=([^;]+)/)?.[1]); }
function isAdmin(req) { return currentSession(req)?.role === 'engineer'; }
const app = http.createServer(async (req,res)=>{
  const url = new URL(req.url, `http://${req.headers.host||'localhost'}`);
  if (req.method==='OPTIONS') return send(res,204,'');
  if (url.pathname==='/api/login' && req.method==='POST') {
    if (PREVIEW_MODE) return send(res,403,{error:'La versión de demostración es de solo lectura'});
    try { const b=await body(req); let session=null; if(b.role==='engineer'&&b.password===ADMIN_PASSWORD)session={role:'engineer',user:''}; if(b.role==='field'&&b.password===FS_PASSWORD&&data.people.includes(b.user))session={role:'field',user:b.user}; if(!session)return send(res,401,{error:'Credenciales incorrectas'}); const token=crypto.randomBytes(24).toString('hex'); sessions.set(token,session); res.writeHead(200,{'Set-Cookie':`fs_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`,'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:true})); } catch { return send(res,400,{error:'Solicitud inválida'}); }
  }
  if (url.pathname==='/api/logout' && req.method==='POST') { sessions.delete((req.headers.cookie||'').match(/fs_session=([^;]+)/)?.[1]); res.writeHead(200,{'Set-Cookie':'fs_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0','Content-Type':'application/json'}); return res.end('{}'); }
  if (url.pathname==='/api/state' && req.method==='GET') { const session=currentSession(req); return send(res,200,{requests:[],airTravel:[],projectDetails:[],...data,requests:PREVIEW_MODE?[]:(data.requests||[]),admin:session?.role==='engineer',role:session?.role||'viewer',user:session?.user||'',editor:!!session,preview:PREVIEW_MODE}); }
  if (url.pathname==='/api/requests' && req.method==='POST') {
    if (PREVIEW_MODE) return send(res,403,{error:'La versión de demostración es de solo lectura'});
    try { const b=await body(req); if (!b.project || !b.requester || !b.requestedDate) return send(res,400,{error:'Completa obra, solicitante y fecha'}); data.requests ||= []; data.requests.unshift({id:crypto.randomUUID(),project:String(b.project),requester:String(b.requester).slice(0,100),requestedDate:String(b.requestedDate),preferredFs:String(b.preferredFs||''),note:String(b.note||'').slice(0,500),createdAt:new Date().toISOString(),status:'Pendiente'}); fs.writeFileSync(DATA_FILE,JSON.stringify(data,null,2)); return send(res,201,{ok:true}); } catch { return send(res,400,{error:'Solicitud inválida'}); }
  }
  if (url.pathname==='/api/projects' && req.method==='POST') {
    if (PREVIEW_MODE) return send(res,403,{error:'La versión de demostración es de solo lectura'});
    const session=currentSession(req); if(!session)return send(res,403,{error:'Acceso de solo lectura'});
    try { const b=await body(req),name=String(b.name||'').trim(); if(!name)return send(res,400,{error:'El nombre del proyecto es obligatorio'}); if(data.projects.some(p=>p.toLowerCase()===name.toLowerCase()))return send(res,409,{error:'El proyecto ya está en la lista'}); const assignedFs=session.role==='field'?[session.user]:(Array.isArray(b.assignedFs)?b.assignedFs.filter(p=>data.people.includes(p)):[]); data.projects.push(name); data.projectDetails ||= []; data.projectDetails.push({name,contractor:String(b.contractor||''),contract:String(b.contract||''),tm:String(b.tm||''),commune:String(b.commune||''),assignedFs}); fs.writeFileSync(DATA_FILE,JSON.stringify(data,null,2)); return send(res,201,{ok:true}); } catch { return send(res,400,{error:'No se pudo crear el proyecto'}); }
  }
  if (url.pathname==='/api/projects' && req.method==='PUT') {
    if (PREVIEW_MODE) return send(res,403,{error:'La versión de demostración es de solo lectura'});
    const session=currentSession(req); if(session?.role!=='engineer')return send(res,403,{error:'Solo Ingeniería puede modificar los datos de una obra'});
    try {
      const b=await body(req),oldName=String(b.oldName||'').trim(),name=String(b.name||'').trim();
      if(!oldName||!name)return send(res,400,{error:'El nombre del proyecto es obligatorio'});
      const index=data.projects.findIndex(p=>p.toLowerCase()===oldName.toLowerCase());
      if(index<0)return send(res,404,{error:'No se encontró la obra'});
      if(data.projects.some((p,i)=>i!==index&&p.toLowerCase()===name.toLowerCase()))return send(res,409,{error:'Ya existe una obra con ese nombre'});
      const detail={name,contractor:String(b.contractor||'').trim(),contract:String(b.contract||'').trim(),tm:String(b.tm||'').trim(),commune:String(b.commune||'').trim(),assignedFs:Array.isArray(b.assignedFs)?b.assignedFs.filter(p=>data.people.includes(p)):[]};
      data.projects[index]=name; data.projectDetails ||= [];
      const detailIndex=data.projectDetails.findIndex(p=>p.name.toLowerCase()===oldName.toLowerCase());
      if(detailIndex<0)data.projectDetails.push(detail);else data.projectDetails[detailIndex]=detail;
      for(const event of data.events)if(String(event.project||'').toLowerCase()===oldName.toLowerCase())event.project=name;
      for(const request of data.requests||[])if(String(request.project||'').toLowerCase()===oldName.toLowerCase())request.project=name;
      for(const travel of data.airTravel||[])if(String(travel.project||'').toLowerCase()===oldName.toLowerCase())travel.project=name;
      fs.writeFileSync(DATA_FILE,JSON.stringify(data,null,2)); return send(res,200,{ok:true});
    } catch { return send(res,400,{error:'No se pudieron guardar los cambios de la obra'}); }
  }
  if (url.pathname==='/api/projects' && req.method==='DELETE') {
    if (PREVIEW_MODE) return send(res,403,{error:'La versión de demostración es de solo lectura'});
    const session=currentSession(req); if(session?.role!=='engineer')return send(res,403,{error:'Solo Ingeniería puede eliminar una obra'});
    const name=String(url.searchParams.get('name')||'').trim(); if(!name)return send(res,400,{error:'Indica la obra que deseas eliminar'});
    const exists=data.projects.some(p=>p.toLowerCase()===name.toLowerCase()); if(!exists)return send(res,404,{error:'No se encontró la obra'});
    data.projects=data.projects.filter(p=>p.toLowerCase()!==name.toLowerCase());
    data.projectDetails=(data.projectDetails||[]).filter(p=>p.name.toLowerCase()!==name.toLowerCase());
    data.events=(data.events||[]).filter(e=>String(e.project||'').toLowerCase()!==name.toLowerCase());
    data.requests=(data.requests||[]).filter(r=>String(r.project||'').toLowerCase()!==name.toLowerCase());
    data.airTravel=(data.airTravel||[]).filter(t=>String(t.project||'').toLowerCase()!==name.toLowerCase());
    fs.writeFileSync(DATA_FILE,JSON.stringify(data,null,2)); return send(res,200,{ok:true});
  }
  if (url.pathname==='/api/state' && req.method==='PUT') {
    if (PREVIEW_MODE) return send(res,403,{error:'La versión de demostración es de solo lectura'});
    const session=currentSession(req); if (!session) return send(res,403,{error:'Acceso de solo lectura'});
    try { const b=await body(req); const incoming={projects:Array.isArray(b.projects)?b.projects:[],people:Array.isArray(b.people)?b.people:[],events:Array.isArray(b.events)?b.events:[],requests:Array.isArray(b.requests)?b.requests:[],airTravel:Array.isArray(b.airTravel)?b.airTravel:[],projectDetails:Array.isArray(b.projectDetails)?b.projectDetails:[]};
      if(session.role==='field'){
        if(JSON.stringify(incoming.projects)!==JSON.stringify(data.projects)||JSON.stringify(incoming.people)!==JSON.stringify(data.people)||JSON.stringify(incoming.projectDetails)!==JSON.stringify(data.projectDetails)||JSON.stringify(incoming.airTravel)!==JSON.stringify(data.airTravel)||JSON.stringify(incoming.requests)!==JSON.stringify(data.requests))return send(res,403,{error:'Field Service solo puede calendarizar su propia carga'});
        const oldById=new Map(data.events.map(e=>[e.id,e])),newById=new Map(incoming.events.map(e=>[e.id,e]));
        for(const e of incoming.events){const old=oldById.get(e.id),changed=!old||JSON.stringify(old)!==JSON.stringify(e);if(changed){const assigned=incoming.projectDetails.find(p=>p.name.toLowerCase()===String(e.project).toLowerCase())?.assignedFs||[];if(e.kind!=='visit'||e.person!==session.user||!assigned.includes(session.user))return send(res,403,{error:'Solo puedes calendarizar visitas de tus obras asignadas'});}}
        for(const e of data.events)if(!newById.has(e.id)&&(e.kind!=='visit'||e.person!==session.user))return send(res,403,{error:'No puedes quitar actividades de otro usuario'});
      }
      data=incoming; fs.writeFileSync(DATA_FILE,JSON.stringify(data,null,2)); return send(res,200,{ok:true}); } catch { return send(res,400,{error:'No se pudieron guardar los cambios'}); }
  }
  if (!['/','/index.html','/features.js'].includes(url.pathname)) return send(res,404,'No encontrado','text/plain');
  const f=path.join(__dirname,url.pathname==='/features.js'?'features.js':'index.html');
  if (!fs.existsSync(f) || !fs.statSync(f).isFile()) return send(res,404,'No encontrado','text/plain');
  res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY'}); fs.createReadStream(f).pipe(res);
});
app.listen(PORT,'0.0.0.0',()=>console.log(`Field Service ${PREVIEW_MODE?'demo de solo lectura':'Calendar'} listo en puerto ${PORT}`));
