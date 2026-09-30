const $ = s => document.querySelector(s);
const money = v => Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
let results = [];
let searchController;
let searchVersion = 0;
let searching = false;
let currentQuery = '';
let directSearches = [];
let providerStatuses = [];
const compared = new Map();
let manualSequence = 0;

function voltage(title){
  const text=String(title||'').toLowerCase();
  if(/\bbivolt\b/.test(text)) return 'bivolt';
  const values=[...text.matchAll(/\b(110|127|220|380)\s*(?:v(?:olts?)?)\b/g)].map(match=>match[1]);
  return [...new Set(values)].length===1 ? values[0] : '';
}
function voltageLabel(title){const v=voltage(title); return v==='bivolt'?'Bivolt':v?`${v} V`:'Voltagem não identificada';}
function offerKey(item){return `${item.source||item.store}:${item.id||item.url}`;}
function totalCost(item,shipping,extraDiscount){
  if(String(shipping).trim()==='') return null;
  const price=Number(item.price), freight=Number(shipping), discount=String(extraDiscount).trim()===''?0:Number(extraDiscount);
  if(!Number.isFinite(price)||price<=0||!Number.isFinite(freight)||freight<0||freight>100000000||!Number.isFinite(discount)||discount<0||discount>price) return null;
  return Math.round((price+freight-discount)*100)/100;
}
function comparisonSummary(entries){
  if(entries.length<2) return 'Selecione pelo menos duas ofertas para comparar os totais.';
  const totals=entries.map(entry=>totalCost(entry.item,entry.shipping,entry.discount));
  if(totals.some(value=>value===null)) return 'Preencha o frete de todas as opções (0 se for grátis) e confira os descontos. Sem isso, não dá para apontar o menor total.';
  const ordered=entries.map((entry,index)=>({...entry,total:totals[index]})).sort((a,b)=>a.total-b.total);
  if(ordered[0].total===ordered[1].total) return `Empate no menor total: ${money(ordered[0].total)}. Compare modelo, vendedor, entrega e forma de pagamento.`;
  const difference=Math.round((ordered[1].total-ordered[0].total)*100)/100;
  return `Menor total simulado: ${ordered[0].item.title} (${ordered[0].item.store}), ${money(ordered[0].total)}. São ${money(difference)} a menos que a segunda opção. Isso compara valores, não garante que os produtos sejam equivalentes.`;
}

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
  const store=$('#storeFilter').value;
  const selectedVoltage=$('#voltageFilter').value;
  const maximum=$('#maxPrice').value;
  const list = results.filter(item=>(!store||item.source===store)&&(!selectedVoltage||voltage(item.title)===selectedVoltage)&&(!maximum||item.price<=Number(maximum))).sort((a,b)=>{
    if(sort==='price') return a.price-b.price;
    if(sort==='discount') return (b.discount||0)-(a.discount||0);
    return (b.score||0)-(a.score||0);
  });
  $('#filterCount').textContent=`${list.length} de ${results.length} ofertas nesta lista. Modelos e condições podem variar.`;
  $('#empty').style.display = list.length ? 'none':'block';
  const featured=$('#featuredOffer');
  if(featured){
    if(list.length){
      const best=list[0];
      featured.hidden=false;
      featured.innerHTML=`
        <div class="featured-copy">
          <span class="deal-kicker">${sort==='price'?'MENOR PREÇO NESTA LISTA, SEM FRETE':sort==='discount'?'MAIOR DESCONTO INFORMADO PELA LOJA':'DESTAQUE PELOS CRITÉRIOS DA OFERTA'}</span>
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
  if(!list.length) $('#empty').textContent='Nenhuma oferta atende à consulta e aos filtros. Limpe os filtros ou use os botões de pesquisa nas lojas acima.';
  $('#cards').innerHTML = list.map(x=>`
    <article class="card">
      ${x.image?`<div class="product-image"><img src="${safeUrl(x.image)}" alt="" loading="lazy"></div>`:''}
      <div class="top"><span class="store">${safe(x.store)}</span><span class="score">${safe(voltageLabel(x.title))}</span></div>
      <h3>${safe(x.title)}</h3>
      <div><span class="price">${money(x.price)}</span>${x.original_price?` <span class="old">${money(x.original_price)}</span>`:''}</div>
      <div class="meta">
        <span>${x.discount?`Redução anunciada: ${x.discount}%`:'Sem preço anterior informado'}</span>
        <span>${x.shipping_free?'Frete grátis':'Frete a consultar'}</span>
        <span>${x.official_store?'Loja oficial informada':'Confirme o vendedor'}</span>
        <span>${x.condition==='new'?'Novo':x.condition||'Não informado'}</span>
      </div>
      <label class="compare-select"><input type="checkbox" data-compare="${safe(offerKey(x))}" ${compared.has(offerKey(x))?'checked':''}> Comparar esta oferta</label>
      ${x.affiliate?'<div class="affiliate-tag">Link comissionado</div>':''}
      <div class="meta">Oferta válida enquanto durarem os estoques. Confirme preço e frete na loja.</div>
      <a href="${safeUrl(x.affiliate_url||x.url)}" target="_blank" rel="noopener noreferrer${x.affiliate?' sponsored':''}">Ver na loja</a>
    </article>`).join('');
}

function renderStoreSearches(searches=[]){
  const box=$('#storeSearches');
  if(!searches.length){box.innerHTML='';return;}
  box.innerHTML=searches.map(store=>{
    const status=providerStatuses.find(item=>item.key===store.key);
    const count=results.filter(item=>item.source===store.key).length;
    const loaded=status?.status==='connected';
    const detail=loaded?`${count} ofertas nesta lista`:status?.status==='error'?'Consulta automática indisponível':'Pesquisa no site da loja';
    const explanation=store.key==='magalu'&&!loaded?'Os produtos do Magalu não foram carregados aqui. O botão abre a busca na loja Primoportado.':loaded&&!count?'A loja respondeu, mas não retornou ofertas compatíveis.':!loaded?'Os resultados abrem fora do RadarX.':'';
    return `<article class="coverage-card" data-state="${loaded?'loaded':'external'}"><div><strong>${safe(store.name)}</strong><span class="coverage-badge">${safe(detail)}</span></div>${explanation?`<p>${safe(explanation)}</p>`:''}<a class="store-search" href="${safeUrl(store.url)}" target="_blank" rel="noopener noreferrer${store.affiliate?' sponsored':''}">${store.key==='magalu'?'Buscar no Magalu':'Abrir pesquisa na loja'}</a>${store.affiliate?'<small>Link comissionado. Isso não significa catálogo conectado.</small>':''}</article>`;
  }).join('');
}

function renderComparison(){
  const entries=[...compared.entries()];
  $('#compareJump').hidden=!entries.length;
  $('#compareJump').textContent=`Ver comparação (${entries.length}/3)`;
  $('#comparisonMessage').textContent=entries.length?`${entries.length} de 3 opções selecionadas. Confira modelo, capacidade, voltagem e pagamento antes de decidir.`:'Escolha “Comparar” em uma oferta para começar.';
  $('#comparisonCards').innerHTML=entries.map(([key,entry],index)=>`<article class="comparison-card"><div class="top"><strong>Opção ${index+1} · ${safe(entry.item.store)}</strong><button type="button" data-remove="${safe(key)}" aria-label="Remover opção ${index+1}">Remover</button></div><h3>${safe(entry.item.title)}</h3><p>${safe(voltageLabel(entry.item.title))}</p><small>${entry.item.manual?'Informada por você. Preço não consultado pelo RadarX.':'Preço recebido da loja nesta pesquisa.'}</small><p class="compare-base">Preço do produto: <strong>${money(entry.item.price)}</strong></p><label>Frete para seu endereço (R$)<input data-cost="shipping" data-key="${safe(key)}" type="number" min="0" max="100000000" step="0.01" value="${safe(entry.shipping)}" placeholder="Preencha; use 0 se grátis"></label><label>Desconto adicional válido (R$)<input data-cost="discount" data-key="${safe(key)}" type="number" min="0" max="${Number(entry.item.price)}" step="0.01" value="${safe(entry.discount)}"></label><small>Não repita um desconto que já esteja no preço acima.</small><output data-total="${safe(key)}"></output></article>`).join('');
  updateComparisonTotals();
}
function updateComparisonTotals(){
  document.querySelectorAll('[data-total]').forEach(output=>{
    const entry=compared.get(output.dataset.total);
    const total=totalCost(entry.item,entry.shipping,entry.discount);
    output.textContent=total===null?'Total pendente: confira frete e desconto.':`Total simulado: ${money(total)}`;
  });
  $('#comparisonVerdict').textContent=compared.size?comparisonSummary([...compared.values()]):'';
}

async function search(q){
  q=String(q).trim().slice(0,200);
  if(q.length<2) return;
  currentQuery=q;
  const shareUrl=new URL(location.href);shareUrl.searchParams.set('q',q);history.replaceState(null,'',shareUrl);
  compared.clear();renderComparison();
  $('#storeFilter').innerHTML='<option value="">Todas com ofertas</option>';
  $('#voltageFilter').value='';$('#maxPrice').value='';
  $('#searchFreshness').textContent='';$('#filterCount').textContent='';
  providerStatuses=[];

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
  $('#agentSummary').textContent='Consultando lojas...';
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
    directSearches=data.direct_searches||[];
    providerStatuses=data.provider_status||[];
    renderStoreSearches(directSearches);
    $('#storeFilter').innerHTML='<option value="">Todas com ofertas</option>'+[...new Set(results.map(item=>item.source))].map(key=>`<option value="${safe(key)}">${safe(results.find(item=>item.source===key).store)}</option>`).join('');
    const observed=new Date(data.checked_at||Date.now());
    $('#searchFreshness').textContent=`Consulta concluída em ${observed.toLocaleString('pt-BR')}. Preços sem frete; confirme a forma de pagamento na loja. Sem histórico suficiente para afirmar “menor preço histórico”.`;
    $('#alertQuery').value=q;
    const statuses=data.provider_status||[];
    $('#providerStatus').textContent='Consulte abaixo a disponibilidade de cada loja.';
    const affiliateBox=$('#affiliateStatus');
    if(affiliateBox){
      const activeStores=data.affiliate?.stores||[];
      const pendingStores=data.affiliate?.pending||[];
      affiliateBox.textContent=data.affiliate?.active
        ? `Links de afiliado disponíveis em ${activeStores.map(store=>store==='kabum'?'KaBuM!':store==='magalu'?'Magalu':store).join(', ')}. A comissão depende de uma venda elegível pelas regras do programa.`
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

['storeFilter','voltageFilter','maxPrice'].forEach(id=>$('#'+id).addEventListener('input',render));
$('#clearFilters').onclick=()=>{$('#storeFilter').value='';$('#voltageFilter').value='';$('#maxPrice').value='';render();};
$('#cards').addEventListener('change',event=>{
  const input=event.target.closest('[data-compare]');if(!input)return;
  const key=input.dataset.compare;
  if(!input.checked)compared.delete(key);
  else {
    if(compared.size>=3){input.checked=false;$('#comparisonMessage').textContent='Limite de três ofertas. Remova uma opção para incluir outra.';$('#compareJump').textContent='Limite de 3 ofertas. Abra a comparação para remover uma.';return;}
    const item=results.find(item=>offerKey(item)===key);
    if(item)compared.set(key,{item,shipping:item.shipping_free?'0':'',discount:'0'});
  }
  renderComparison();
});
$('#comparisonCards').addEventListener('input',event=>{
  const input=event.target.closest('[data-cost]');if(!input)return;
  const entry=compared.get(input.dataset.key);if(!entry)return;
  entry[input.dataset.cost]=input.value;updateComparisonTotals();
});
$('#comparisonCards').addEventListener('click',event=>{
  const button=event.target.closest('[data-remove]');if(!button)return;
  compared.delete(button.dataset.remove);renderComparison();render();
});
$('#clearComparison').onclick=()=>{compared.clear();renderComparison();render();};
$('#manualOfferForm').addEventListener('submit',event=>{
  event.preventDefault();
  if(compared.size>=3){$('#comparisonMessage').textContent='Remova uma opção antes de incluir outra. O limite é de três.';return;}
  const price=Number($('#manualPrice').value), title=$('#manualTitle').value.trim();
  if(!title||!Number.isFinite(price)||price<=0||price>100000000)return;
  const item={id:`manual-${++manualSequence}`,source:'manual',title,store:$('#manualStore').value,price,manual:true};
  compared.set(offerKey(item),{item,shipping:'',discount:'0'});renderComparison();event.target.reset();
});
const initialQuery=new URLSearchParams(location.search).get('q');
if(initialQuery&&initialQuery.trim().length>=2){$('#query').value=initialQuery.slice(0,200);search($('#query').value);}
