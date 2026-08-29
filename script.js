const API_URL="https://script.google.com/macros/s/AKfycbxSplq_s5tCcyfsUv0VMYoHnfl7zgdIvNn2CAZ4FjhLOMuUEIBcbXos-e1SLOQgk6klEg/exec?path=news";

const nomeSite=document.querySelector("header h1");
if(new Date().getMonth()===5)nomeSite.textContent="📰 BloxyFeed | Pride Month";

function formatarResumo(texto){
  if(!texto)return"";
  const linhas=texto.split(/\r?\n/).filter(linha=>linha.trim()!=="");
  if(linhas.length<=1)return texto;
  return`${linhas[0]}\n\n...`;
}

function formatarData(isoDate){
  if(!isoDate)return"";
  return new Date(isoDate).toLocaleDateString("pt-BR");
}

async function carregarNoticias(){
  const res=await fetch(API_URL,{method:"GET",redirect:"follow"});
  if(!res.ok)throw new Error("Falha ao buscar notícias");
  const data=await res.json();
  const listaOriginal=data.news||data.noticias||(Array.isArray(data)?data:[]);

  return listaOriginal.map(n=>{
    const valorDestaque=n.destaque!==undefined?n.destaque:n.Destaque;
    const ehDestaque=valorDestaque===true||String(valorDestaque).toLowerCase()==="true";

    return{
      id:String(n.id||n.ID||""),
      titulo:n.nome||n.titulo||n.Nome||n.Titulo||"Sem título",
      categoria:n.categoria||n.Categoria||"Geral",
      resumo:n.resumo||n.Resumo||"",
      imagem:n.imagem||n.Imagem||"",
      autor:n.autor||n.Autor||"Anônimo",
      data:formatarData(n.data||n.Data),
      destaque:ehDestaque
    };
  });
}

function renderizarDestaque(noticias){
  const tituloEl=document.querySelector("#destaqueTitulo");
  const resumoEl=document.querySelector("#destaqueResumo");
  const btn=document.querySelector("#btnLerDestaque");

  if(!noticias||noticias.length===0){
    tituloEl.textContent="Nenhuma notícia encontrada";
    resumoEl.textContent="Verifique o backend ou o status de publicação no Notion.";
    btn.disabled=true;
    btn.onclick=null;
    return;
  }

  const destaque=noticias.find(n=>n.destaque)||noticias[0];
  tituloEl.textContent=destaque.titulo;
  resumoEl.textContent=formatarResumo(destaque.resumo);
  btn.disabled=false;
  btn.onclick=()=>window.location.href=`noticia.html?id=${encodeURIComponent(destaque.id)}`;
}

function criarCardNoticia(noticia){
  const artigo=document.createElement("article");
  artigo.classList.add("noticia");

  const imgHtml=noticia.imagem?`<img src="${noticia.imagem}" alt="${noticia.titulo}">`:"";
  const resumoFormatado=formatarResumo(noticia.resumo);

  artigo.innerHTML=`
    ${imgHtml}
    <h3>${noticia.titulo}</h3>
    <p>${noticia.categoria}</p>
    <p class="card-resumo">${resumoFormatado}</p>
    <small>Por ${noticia.autor} • ${noticia.data}</small>
    <a class="btn-ler" href="noticia.html?id=${encodeURIComponent(noticia.id)}">Ler notícia</a>
  `;

  return artigo;
}

function renderizarLista(noticias){
  const lista=document.querySelector("#listaNoticias");
  lista.innerHTML="";

  if(!noticias||noticias.length===0){
    lista.innerHTML="<p>Nenhuma notícia encontrada.</p>";
    return;
  }

  const semDestaque=noticias.filter(n=>!n.destaque);
  semDestaque.forEach(noticia=>lista.appendChild(criarCardNoticia(noticia)));

  if(lista.children.length===0){
    const p=document.createElement("p");
    p.textContent="Não há outras notícias além do destaque.";
    lista.appendChild(p);
  }
}

function configurarBusca(noticias){
  const campoBusca=document.querySelector("#campoBusca");
  if(!campoBusca)return;

  campoBusca.addEventListener("input",()=>{
    const termo=campoBusca.value.trim().toLowerCase();

    if(!termo){
      renderizarLista(noticias);
      return;
    }

    const resultados=noticias.filter(noticia=>String(noticia.titulo).toLowerCase().includes(termo));
    renderizarLista(resultados);
  });
}

async function iniciar(){
  try{
    const noticias=await carregarNoticias();
    renderizarDestaque(noticias);
    renderizarLista(noticias);
    configurarBusca(noticias);
  }catch(err){
    console.error("Erro na requisição:",err);

    document.querySelector("#destaqueTitulo").textContent="Erro ao carregar notícias";
    document.querySelector("#destaqueResumo").textContent="Verifique a URL do backend (Apps Script), permissões de acesso ou CORS e tente novamente.";

    const btn=document.querySelector("#btnLerDestaque");
    btn.disabled=true;
  }
}

iniciar();