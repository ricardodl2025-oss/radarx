function demoSearch(q){
  const base = q.toLowerCase().includes('ar-condicionado') || q.includes('9000') ? [
    {id:'demo-1',title:'Ar-condicionado Inverter 9.000 BTUs Frio 220V',price:1499,original_price:1899,store:'Loja demonstrativa A',official_store:true,shipping_free:true,condition:'new',url:'#'},
    {id:'demo-2',title:'Ar-condicionado 9.000 BTUs Inverter Wi-Fi',price:1599,original_price:1799,store:'Loja demonstrativa B',official_store:false,shipping_free:true,condition:'new',url:'#'},
    {id:'demo-3',title:'Evaporadora avulsa 9.000 BTUs',price:599,original_price:999,store:'Marketplace demo',official_store:false,shipping_free:false,condition:'new',url:'#'}
  ]:[
    {id:'demo-g1',title:`${q} • oferta demonstrativa`,price:999,original_price:1299,store:'Loja demonstrativa',official_store:true,shipping_free:true,condition:'new',url:'#'}
  ];
  return Promise.resolve(base);
}
module.exports={demoSearch};
