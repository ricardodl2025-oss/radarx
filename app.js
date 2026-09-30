const $ = s => document.querySelector(s);
const money = v => Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
let results = [];
let searchController;
let searchVersion = 0;
let searching = false;

function safe(value){
  return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function safeUrl(value){
  try{
    const url=new URL(value);
    return url.protocol==='https:'?url.href:'#';
  }catch{return '#'}
}

const agents = [
  ['🎯','Orquestrador','Entende a busca e distribui a missão.'],
  ['🛰️','Caçador','Consulta os conectores de lojas.'],
  ['🛡️','Verificador','Filtra anúncios suspeitos e incompletos.'],
  ['⚡','Classificador','Ordena por preço, desconto ou pontuação.'],
];

function renderAgents(state='idle'){
  $('#agentGrid').innerHTML = agents.map((a,i)=>`
    <div class="agent ${state==='running'?'running':state==='done'?'done':''}">
      <div class="ico">${a[0]}</div><strong>${a[1]}</strong><small>${a[2]}</small>
    </div>`).join('');
}
renderAgents();

function render(){
  if(searching) return;
  const sort = $('#sort').value;
  const list = [...results].sort((a,b)=>{
    if(sort==='price') return a.price-b.price;
    if(sort==='discount') return (b.discount||0)-(a.discount||0);
    return (b.score||0)-(a.score||0);
  });
  $('#empty').style.display = list.length ? 'none':'block';
  const featured=$('#featuredOffer');
  if(featured){
    if(list.length){
      const best=list[0];
      featured.hidden=false;
      featured.innerHTML=`
        <div class="featured-copy">
          <span class="deal-kicker">MELHOR OPORTUNIDADE AGORA</span>
          <strong>${safe(best.title)}</strong>
          <small>${safe(best.store)}${best.discount?` • ${best.discount}% de desconto`:''}</small>
          <small>Oferta válida enquanto durarem os estoques. Confirme preço e frete na loja.</small>
        </div>
        <div class="featured-price">${money(best.price)}</div>
        <a href="${safeUrl(best.affiliate_url||best.url)}" target="_blank" rel="noopener noreferrer${best.affiliate?' sponsored':''}">Ver oferta</a>`;
    }else{
      featured.hidden=true;
      featured.innerHTML='';
    }
  }
  if(!list.length) $('#empty').textContent='Nenhuma oferta encontrada nesta consulta. Tente um nome mais simples ou pesquise nas lojas abaixo.';
  $('#cards').innerHTML = list.map(x=>`
    <article class="card">
      ${x.image?`<div class="product-image"><img src="${safeUrl(x.image)}" alt="" loading="lazy"></div>`:''}
      <div class="top"><span class="store">${safe(x.store)}</span><span class="score">Score ${Number(x.score)||0}/100</span></div>
      <h3>${safe(x.title)}</h3>
      <div><span class="price">${money(x.price)}</span>${x.original_price?` <span class="old">${money(x.original_price)}</span>`:''}</div>
      <div class="meta">
        <span>Desconto: ${x.discount||0}%</span>
        <span>${x.shipping_free?'Frete grátis':'Frete a consultar'}</span>
        <span>${x.official_store?'Loja oficial':'Marketplace'}</span>
        <span>${x.condition==='new'?'Novo':x.condition||'Não informado'}</span>
      </div>
      ${x.affiliate?'<div class="affiliate-tag">Link comissionado</div>':''}
      <div class="meta">Oferta válida enquanto durarem os estoques. Confirme preço e frete na loja.</div>
      <a href="${safeUrl(x.affiliate_url||x.url)}" target="_blank" rel="noopener noreferrer${x.affiliate?' sponsored':''}">Ver na loja</a>
    </article>`).join('');
}

function renderStoreSearches(searches=[]){
  const box=$('#storeSearches');
  if(!searches.length){ box.innerHTML=''; return; }
  box.innerHTML=searches.map(store=>`
    <a class="store-search" href="${safeUrl(store.url)}" target="_blank" rel="noopener noreferrer${store.affiliate?' sponsored':''}">
      <span class="store-mark">${safe(store.name).slice(0,2).toUpperCase()}</span>
      <span><strong>${safe(store.name)}</strong><small>${store.affiliate?'Link comissionado':'Ver resultados atuais'}</small></span>
      <b>↗</b>
    </a>`).join('');
}

async function search(q){
  const version=++searchVersion;
  searchController?.abort();
  const controller=new AbortController();
  searchController=controller;
  searching=true;
  results=[];
  $('#featuredOffer').hidden=true;
  $('#featuredOffer').innerHTML='';
  $('#resultTitle').textContent=`Buscando “${q}”`;
  $('#providerStatus').innerHTML='';
  $('#agentSummary').textContent='Agentes trabalhando...';
  renderAgents('running');
  $('#empty').style.display='block';
  $('#empty').textContent='Consultando fontes e analisando ofertas...';
  $('#cards').innerHTML='';
  $('#storeSearches').innerHTML='';
  try{
    const r = await fetch(`/.netlify/functions/search?q=${encodeURIComponent(q)}`,{signal:controller.signal});
    const data = await r.json();
    if(version!==searchVersion) return;
    if(!r.ok) throw new Error(data.error||'Erro na busca');
    results = data.items||[];
    $('#resultTitle').textContent = `${results.length} ofertas para “${q}”`;
    renderStoreSearches(data.direct_searches||[]);
    const statuses=data.provider_status||[];
    $('#providerStatus').innerHTML=statuses.map(store=>{
      const detail=store.status==='connected'
        ? `${store.count||0} ofertas recebidas`
        : store.status==='direct'?'Pesquisa no site da loja'
        : store.status==='error'?'Consulta indisponível agora; use a pesquisa direta abaixo'
        : 'Consulta automática ainda não disponível';
      return `<p><strong>${safe(store.name)}</strong>: ${safe(detail)}</p>`;
    }).join('');
    const affiliateBox=$('#affiliateStatus');
    if(affiliateBox){
      const activeStores=data.affiliate?.stores||[];
      const pendingStores=data.affiliate?.pending||[];
      affiliateBox.textContent=data.affiliate?.active
        ? `Monetização ativa em ${activeStores.map(store=>store==='kabum'?'KaBuM!':store).join(', ')}.`
        : pendingStores.includes('kabum')
          ? 'Solicitação enviada à KaBuM!. Aguardando aprovação do anunciante.'
          : 'Comissões ainda não habilitadas. As ofertas levam ao site oficial da loja.';
      affiliateBox.dataset.active=data.affiliate?.active?'true':'false';
    }
    const connected=statuses.filter(x=>x.status==='connected').length;
    const mercadoLivre=statuses.find(x=>x.key==='mercadolivre');
    const mlConnect=$('#mlConnect');
    if(mlConnect) mlConnect.hidden=true;
    if(mercadoLivre?.status==='error'){
      $('#agentSummary').textContent = `Mercado Livre: ${mercadoLivre.error||'falha na conexão'} • ${data.elapsed_ms||0} ms`;
    }else if(mercadoLivre?.status==='pending'){
      $('#agentSummary').textContent = `Mercado Livre: credenciais não encontradas no servidor • ${data.elapsed_ms||0} ms`;
    }else{
      $('#agentSummary').textContent = `${connected} lojas responderam à consulta • ${(data.direct_searches||[]).length} lojas por pesquisa direta`;
    }
    searching=false;
    renderAgents(connected?'done':'idle');
    render();
  }catch(e){
    if(version!==searchVersion) return;
    searching=false;
    renderAgents('idle');
    $('#agentSummary').textContent='Falha na consulta';
    $('#resultTitle').textContent=`Não foi possível buscar “${q}”`;
    $('#empty').textContent='Não foi possível consultar as ofertas agora. Tente novamente em instantes.';
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
    $('#alertMessage').textContent='Interesse salvo. O envio automático de avisos por e-mail ainda não está disponível.';
    e.target.reset();
  }catch(err){ $('#alertMessage').textContent='Não foi possível criar: '+err.message; }
});
