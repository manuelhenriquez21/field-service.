let editingProjectName='';

renderPortfolio=function(){
  const fieldUser=state.role==='field',allKey='__all_projects__';
  if(fieldUser&&!state.people.includes(portfolioPerson))portfolioPerson=state.user;
  if(!fieldUser&&portfolioPerson!==allKey&&!state.people.includes(portfolioPerson))portfolioPerson=state.people[0]||allKey;
  const tabs=fieldUser?[state.user]:[allKey,...state.people];
  $('portfolioTabs').innerHTML=tabs.map(person=>{
    const isAll=person===allKey,label=isAll?'Todas las obras':person;
    const count=isAll?state.projectDetails.length:state.projectDetails.filter(p=>(p.assignedFs||[]).includes(person)).length;
    const color=isAll?'#51616e':COLORS[state.people.indexOf(person)]||'#777';
    return `<button class="portfolio-person ${person===portfolioPerson?'active':''}" data-person="${esc(person)}"><i class="dot" style="display:inline-block;background:${color}"></i> ${esc(label)} <span class="count">${count} obras</span></button>`;
  }).join('');
  $('portfolioTabs').querySelectorAll('.portfolio-person').forEach(button=>button.onclick=()=>{portfolioPerson=button.dataset.person;renderPortfolio()});
  const visible=state.projectDetails.filter(project=>(fieldUser?(project.assignedFs||[]).includes(state.user):(portfolioPerson===allKey||(project.assignedFs||[]).includes(portfolioPerson)))&&matchesProject(project.name,$('search').value.trim()));
  $('portfolioRows').innerHTML=visible.length?visible.map(project=>`<tr class="portfolio-row" data-project="${esc(project.name)}" draggable="${state.editor}"><td class="work-name">${esc(project.name)}</td><td>${esc(project.contractor||'')}</td><td>${esc(project.contract||'')}</td><td>${esc(project.tm||'')}</td><td>${esc(project.commune||'')}</td><td><span class="badge">${visitCountFor(project.name)} visitas</span></td></tr>`).join(''):'<tr><td colspan="6" class="subtle">No hay obras que coincidan con la búsqueda.</td></tr>';
  document.querySelectorAll('.portfolio-row[draggable=true]').forEach(row=>row.ondragstart=event=>event.dataTransfer.setData('text/plain',row.dataset.project));
};

function decorateFlightVisits(){
  document.querySelectorAll('.event[data-id]').forEach(node=>{
    const event=state.events.find(item=>item.id===node.dataset.id);
    node.classList.toggle('requires-flight',!!event?.requiresFlight);
    if(event)node.title=`${event.project} · ${event.person||''}${event.requiresFlight?' · Requiere viaje en avión':''}`;
  });
  if(!$('legend').querySelector('.legend-flight'))$('legend').insertAdjacentHTML('beforeend','<span class="legend-flight"><i style="display:inline-block;width:10px;height:10px;border:2px solid #111;border-radius:3px"></i>Viaje en avión</span>');
}

function renderRequestMarkers(){
  document.querySelectorAll('.request-marker').forEach(node=>node.remove());
  const query=$('search').value.trim(),visibleFs=state.role==='field'?[state.user]:[...activePeople];
  const monthKey=`${view.getFullYear()}-${pad(view.getMonth()+1)}`;
  const requests=(state.requests||[]).filter(request=>request.status!=='Rechazada'&&request.requestedDate?.startsWith(monthKey)&&(!request.preferredFs||visibleFs.includes(request.preferredFs))&&(!query||matchesProject(request.project,query)||normText(request.preferredFs).includes(normText(query))||normText(request.requester).includes(normText(query))));
  for(const request of requests){
    const day=document.querySelector(`.day[data-date="${request.requestedDate}"]`);
    if(!day)continue;
    const marker=document.createElement('div');marker.className='request-marker';marker.dataset.requestId=request.id;
    marker.title=`Solicitud ${request.status||'Pendiente'} · ${request.project} · ${request.requester}`;
    marker.innerHTML=`<strong>Solicitud ${esc(request.status||'Pendiente')}</strong> · ${esc(request.project)}<small>${esc(request.requester)}${request.preferredFs?' · FS: '+esc(request.preferredFs):''}</small>`;
    marker.addEventListener('click',event=>event.stopPropagation());
    day.querySelector('.day-events').appendChild(marker);
  }
  const queryEvents=$('search').value.trim();
  const monthEvents=state.events.filter(event=>event.date.startsWith(monthKey)&&(state.role==='field'?event.person===state.user:activePeople.has(event.person))&&(!queryEvents||matchesProject(event.project,queryEvents)||normText(event.person).includes(normText(queryEvents)))).length;
  $('monthTotal').textContent=`${monthEvents} actividades · ${requests.length} solicitudes`;
}

function addMultiDayVisitSegments(){
  const visibleFs=state.role==='field'?[state.user]:[...activePeople],query=normText($('search').value.trim());
  const holidays=new Set(state.events.filter(item=>item.kind==='holiday').map(item=>item.date));
  const start=new Date(view.getFullYear(),view.getMonth(),1-((new Date(view.getFullYear(),view.getMonth(),1).getDay()+6)%7));
  const end=new Date(start);end.setDate(start.getDate()+42);
  for(const event of state.events){
    const duration=Math.max(1,Math.min(60,Number(event.durationDays)||1));
    if(event.kind!=='visit'||duration<2||(state.role==='field'?event.person!==state.user:!visibleFs.includes(event.person))||query&&!(matchesProject(event.project,query)||normText(event.person).includes(query)))continue;
    let cursor=new Date(`${event.date}T12:00:00`),remaining=duration-1;
    while(remaining>0){cursor.setDate(cursor.getDate()+1);const date=iso(cursor);if(cursor.getDay()===0||cursor.getDay()===6||holidays.has(date))continue;remaining--;if(cursor<start||cursor>=end)continue;
      const day=document.querySelector(`.day[data-date="${date}"]`);if(!day)continue;
      const personIndex=Math.max(0,state.people.indexOf(event.person)),segment=document.createElement('div');
      segment.className=`event p${personIndex%3} continuation${event.requiresFlight?' requires-flight':''}`;segment.dataset.id=event.id;segment.title=`Continúa · ${event.project} · ${event.person} · visita de ${duration} días hábiles`;
      segment.innerHTML=`<strong>${esc(event.person)}</strong> · ↳ ${esc(event.project)}`;day.querySelector('.day-events').appendChild(segment);
      segment.onclick=click=>{click.stopPropagation();if(state.role==='field'||state.role==='engineer'){if(fieldCanEditEvent(event))openModal(event)}else showProject(event.project)};
    }
  }
}

const renderWithMarkers=render;
render=function(){renderWithMarkers();decorateFlightVisits();renderRequestMarkers();addMultiDayVisitSegments()};

const syncEventFields=syncFields;
syncFields=function(){syncEventFields();const visit=$('kind').value==='visit';$('flightField').style.display=visit?'block':'none';$('durationField').style.display=visit?'block':'none';$('requiresFlight').disabled=!visit};
$('kind').onchange=syncFields;

const openEventModal=openModal;
openModal=function(data={}){openEventModal(data);$('requiresFlight').checked=!!data.requiresFlight;$('durationDays').value=Math.max(1,Number(data.durationDays)||1);syncFields()};

function updateFlightStatus(){const status=$('flightStatus'),enabled=$('needsFlight').checked;status.textContent=enabled?'ON':'OFF';status.classList.toggle('on',enabled)}
$('needsFlight').addEventListener('change',updateFlightStatus);

saveEvent=async function(){
  const kind=$('kind').value,project=kind==='visit'?$('project').value:$('titleInput').value.trim();
  if(!project)return toast('Escribe una descripción');
  const event={id:editId||crypto.randomUUID(),date:$('date').value,project,person:kind==='holiday'?'':$('person').value,kind,completed:kind==='visit'&&$('completed').checked,requiresFlight:kind==='visit'&&$('requiresFlight').checked,durationDays:kind==='visit'?Math.max(1,Math.min(60,Math.floor(Number($('durationDays').value)||1))):1};
  if(!event.date)return toast('Selecciona la fecha');
  if(kind==='visit'){const day=new Date(`${event.date}T12:00:00`);if(day.getDay()===0||day.getDay()===6||state.events.some(item=>item.kind==='holiday'&&item.date===event.date))return toast('Las visitas deben comenzar en un día hábil que no sea feriado')}
  if(editId)state.events=state.events.map(item=>item.id===editId?event:item);else state.events.push(event);
  if(await saveState()){closeModal();await load();toast('Actividad guardada')}
};
$('save').onclick=saveEvent;

openNewProject=function(projectName=''){
  editingProjectName=projectName;
  const detail=projectName?projectInfo(projectName):null;
  $('newProjectTitle').textContent=projectName?'Editar obra':'Nueva obra';
  $('newProjectName').value=detail?.name||'';
  $('newProjectContractor').value=detail?.contractor||'';
  $('newProjectContract').value=detail?.contract||'';
  $('newProjectTM').value=detail?.tm||'';
  $('newProjectCommune').value=detail?.commune||'';
  const assignees=state.role==='field'?[state.user]:state.people;
  $('newProjectAssignments').innerHTML=assignees.map(person=>`<label><input type="checkbox" class="new-assignee" value="${esc(person)}" ${detail?(detail.assignedFs||[]).includes(person)?'checked':'' :state.role==='field'?'checked':''} ${state.role==='field'?'disabled':''}>${esc(person)}</label>`).join('');
  $('saveNewProject').textContent=projectName?'Guardar cambios':'Agregar obra';
  $('deleteProject').style.display=projectName&&state.role==='engineer'?'inline-flex':'none';
  $('newProjectBack').classList.add('open');
};
$('newProject').onclick=()=>openNewProject();
$('editProjectDetails').onclick=()=>{if(state.role==='engineer')openNewProject(focusProject)};

$('saveNewProject').onclick=async()=>{
  const name=$('newProjectName').value.trim();
  if(!name)return toast('Escribe el nombre de la obra');
  const assignedFs=state.role==='field'?[state.user]:[...document.querySelectorAll('.new-assignee:checked')].map(box=>box.value);
  if(state.role==='engineer'&&!assignedFs.length)return toast('Asigna la obra a un Field Service');
  const payload={name,contractor:$('newProjectContractor').value.trim(),contract:$('newProjectContract').value.trim(),tm:$('newProjectTM').value.trim(),commune:$('newProjectCommune').value.trim(),assignedFs};
  const editing=!!editingProjectName;
  const response=await fetch('/api/projects',{method:editing?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(editing?{...payload,oldName:editingProjectName}:payload)});
  if(!response.ok){const error=await response.json().catch(()=>({}));return toast(error.error||'No se pudo guardar la obra')}
  editingProjectName='';closeNewProject();$('detailBack').classList.remove('open');if(!editing)currentView='portfolio';
  if(state.role==='engineer'&&assignedFs.length)portfolioPerson=assignedFs[0];
  await load();setAppViewClasses();toast(editing?'Obra actualizada':'Obra agregada al portafolio');
};

$('deleteProject').onclick=async()=>{
  if(!editingProjectName||state.role!=='engineer')return;
  if(!confirm(`Eliminar "${editingProjectName}" y sus visitas y solicitudes asociadas?`))return;
  const response=await fetch(`/api/projects?name=${encodeURIComponent(editingProjectName)}`,{method:'DELETE'});
  if(!response.ok){const error=await response.json().catch(()=>({}));return toast(error.error||'No se pudo eliminar la obra')}
  editingProjectName='';closeNewProject();$('detailBack').classList.remove('open');await load();toast('Obra eliminada');
};

const renderWithPreviewGuard=render;
render=function(){
  renderWithPreviewGuard();
  if(state.preview){
    $('loginBtn').style.display='none';
    $('role').innerHTML='<span class="admin-label">Demostración · solo lectura</span>';
    document.querySelectorAll('.admin-only,.editor-only').forEach(element=>element.style.display='none');
    $('dragHint').textContent='Vista de demostración · solo lectura. Busca obras, contratos o Field Service.';
    $('viewHint').textContent='Consulta el portafolio y calendario con datos reales. Los cambios y las solicitudes están deshabilitados.';
  }
};
const showProjectWithPreviewGuard=showProject;
showProject=function(project){showProjectWithPreviewGuard(project);updateFlightStatus();if(state.preview)$('requestVisit').style.display='none'};
