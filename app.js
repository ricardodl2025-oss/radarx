const $ = s => document.querySelector(s);
const money = v => Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
let results = [];

const agents = [
  ['🎯','Orquestrador','Entende a busca e distribui a missão.'],
  ['🛰️','Caçador','Consulta os conectores de lojas.'],
  ['🧬','Comparador','Agrupa anúncios equivalentes.'],
  ['📉','Histórico','Mede preço atual contra histórico.'],
  ['🛡️','Verificador','Filtra anúncios suspeitos e incompletos.'],
  ['⚡','PromoScore','Calcula a força real da oportunidade.'],
];

function renderAgents(state='idle'){
  $('#agentGrid').innerHTML = agents.map((a,i)=>`
    <div class="agent ${state==='running'?'running':state==='done'?'done':''}">
      <div class="ico">${a[0]}</div><strong>${a[1]}</strong><small>${a[2]}</small>
    </div>`).join('');
}
renderAgents();

function render(){
  const sort = $('#sort').value;
  const list = [...results].sort((a,b)=>{
    if(sort==='price') return a.price-b.price;
    if(sort==='discount') return (b.discount||0)-(a.discount||0);
    return (b.score||0)-(a.score||0);
  });
  $('#empty').style.display = list.length ? 'none':'block';
  $('#cards').innerHTML = list.map(x=>`
    <article class="card">
      <div class="top"><span class="store">${x.store}</span><span class="score">Score ${x.score}/100</span></div>
      <h3>${x.title}</h3>
      <div><span class="price">${money(x.price)}</span>${x.original_price?` <span class="old">${money(x.original_price)}</span>`:''}</div>
      <div class="meta">
        <span>Desconto: ${x.discount||0}%</span>
        <span>${x.shipping_free?'Frete grátis':'Frete a consultar'}</span>
        <span>${x.official_store?'Loja oficial':'Marketplace'}</span>
        <span>${x.condition==='new'?'Novo':x.condition||'Não informado'}</span>
      </div>
      <a href="${x.url}" target="_blank" rel="noopener">Ver na loja</a>
    </article>`).join('');
}

async function search(q){
  $('#agentSummary').textContent='Agentes trabalhando...';
  renderAgents('running');
  $('#empty').style.display='block';
  $('#empty').textContent='Consultando fontes e analisando ofertas...';
  $('#cards').innerHTML='';
  try{
    const r = await fetch(`/.netlify/functions/search?q=${encodeURIComponent(q)}`);
    const data = await r.json();
    if(!r.ok) throw new Error(data.error||'Erro na busca');
    results = data.items||[];
    $('#resultTitle').textContent = `${results.length} ofertas para “${q}”`;
    $('#agentSummary').textContent = `${data.providers_ok||0} fonte(s) consultada(s) • ${data.elapsed_ms||0} ms`;
    renderAgents('done');
    render();
  }catch(e){
    renderAgents('idle');
    $('#agentSummary').textContent='Falha na consulta';
    $('#empty').textContent = e.message + '. Configure as variáveis do Netlify para ativar os conectores reais.';
  }
}

$('#searchForm').addEventListener('submit',e=>{
  e.preventDefault(); const q=$('#query').value.trim(); if(q) search(q);
});
document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{ $('#query').value=b.dataset.q; search(b.dataset.q); });
$('#sort').onchange=render;

$('#alertForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const payload={query:$('#alertQuery').value.trim(),target_price:Number($('#alertPrice').value),email:$('#alertEmail').value.trim()};
  $('#alertMessage').textContent='Salvando...';
  try{
    const r=await fetch('/.netlify/functions/alerts',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    const data=await r.json(); if(!r.ok) throw new Error(data.error||'Erro');
    $('#alertMessage').textContent='Alerta criado com sucesso.';
    e.target.reset();
  }catch(err){ $('#alertMessage').textContent='Não foi possível criar: '+err.message; }
});
