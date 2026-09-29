const BAD = ['controle remoto','capa para','suporte para','limpa tela','película','carregador avulso','placa','peça','evaporadora avulsa','condensadora avulsa','instalação'];
function verify(item, query){
  const t=(item.title||'').toLowerCase();
  const q=(query||'').toLowerCase();
  const suspicious = BAD.some(x=>t.includes(x)) && !BAD.some(x=>q.includes(x));
  return {...item,suspicious};
}
module.exports={verify};
