const API_URL = "https://script.google.com/macros/s/AKfycbxSplq_s5tCcyfsUv0VMYoHnfl7zgdIvNn2CAZ4FjhLOMuUEIBcbXos-e1SLOQgk6klEg/exec?path=news";

const $ = s => document.querySelector(s);
const data = d => isNaN(new Date(d)) ? d || "" : new Date(d).toLocaleDateString("pt-BR");

(async () => {
  const id = new URLSearchParams(location.search).get("id");
  const [titulo, meta, imagem, resumo, conteudo, compartilhar] =
    ["#titulo", "#meta", "#imagem", "#resumo", "#conteudo", "#btn-compartilhar"].map($);

  const erro = (t, r) => {
    titulo.textContent = t;
    meta.textContent = "";
    resumo.textContent = r;
    conteudo.innerHTML = "";
    if (compartilhar) compartilhar.style.display = "none";
  };

  if (compartilhar) compartilhar.style.display = "none";

  if (!id)
    return erro("Notícia não encontrada", "Nenhum ID de notícia foi informado na URL.");

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw Error("Erro na API");

    const json = await res.json();
    const lista = json.news || json.noticias || (Array.isArray(json) ? json : []);
    const n = lista.find(x => String(x.id ?? x.ID) === String(id));

    if (!n)
      return erro("Notícia não encontrada", "Ela pode não estar publicada ou o ID informado é inválido.");

    const noticia = {
      titulo: n.nome ?? n.titulo ?? n.Nome ?? n.Titulo ?? "Sem título",
      categoria: n.categoria ?? n.Categoria ?? "Geral",
      autor: n.autor ?? n.Autor ?? "Anônimo",
      data: data(n.data ?? n.Data),
      resumo: n.resumo ?? n.Resumo ?? "",
      conteudo: n.conteudo ?? n.Conteudo ?? "<p>O conteúdo desta notícia ainda não foi publicado.</p>",
      imagem: n.imagem ?? n.Imagem ?? "",
      midiaUrl: n.midiaUrl ?? n.MidiaUrl ?? ""
    };

    titulo.textContent = noticia.titulo;
    meta.textContent = `${noticia.categoria} • ${noticia.data} • Por ${noticia.autor}`;
    resumo.textContent = noticia.resumo;
    
    // Insere o conteúdo principal dos blocos do Notion
    conteudo.innerHTML = noticia.conteudo;
    
    const videos = conteudo.querySelectorAll("video");

videos.forEach(video => {
  try {
    video.setAttribute("playsinline", "");

    new Plyr(video, {
      controls: [
        "play-large",
        "play",
        "progress",
        "current-time",
        "mute",
        "volume",
        "settings",
        "fullscreen"
      ],
      settings: ["speed"],
      seekTime: 10,
      clickToPlay: true,
      hideControls: true
    });
  } catch (erroVideo) {
    console.error("Erro ao inicializar o Plyr:", erroVideo);

    // Se o Plyr não conseguir inicializar,
    // mantém o player nativo do navegador funcionando.
    video.controls = true;
  }
});

    // Se houver uma mídia vinculada diretamente via propriedade URL do Notion
    if (noticia.midiaUrl) {
      const mediaDiv = document.createElement("div");
      mediaDiv.className = "media-container";

      const catLower = noticia.categoria.toLowerCase();
      if (catLower.includes("vídeo") || catLower.includes("video")) {
        const embedUrl = noticia.midiaUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/");
        mediaDiv.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`;
        conteudo.prepend(mediaDiv);
      } else if (catLower.includes("áudio") || catLower.includes("audio")) {
        mediaDiv.innerHTML = `<audio controls src="${noticia.midiaUrl}"></audio>`;
        conteudo.prepend(mediaDiv);
      }
    }

    document.title = `${noticia.titulo} | BloxyFeed`;

    imagem.style.display = noticia.imagem ? "block" : "none";

    if (noticia.imagem) {
  imagem.src = noticia.imagem;
  imagem.alt = noticia.titulo;

  const fundo = document.querySelector("#background-blur");

  if (fundo) {
    fundo.style.backgroundImage = `url("${noticia.imagem}")`;
    fundo.style.opacity = "1";
  }
}

    if (compartilhar) {
      compartilhar.style.display = "inline-flex";
      compartilhar.onclick = async () => {
        const share = {
          title: noticia.titulo,
          text: noticia.resumo || "Confira esta notícia no BloxyFeed!",
          url: location.href
        };

        if (navigator.share) {
          try { await navigator.share(share); } catch {}
        } else {
          try {
            await navigator.clipboard.writeText(location.href);
            const txt = compartilhar.textContent;
            compartilhar.textContent = "Link copiado! ✔️";
            setTimeout(() => compartilhar.textContent = txt, 2000);
          } catch (e) {
            console.error("Não foi possível copiar o link:", e);
          }
        }
      };
    }
  } catch (e) {
    console.error(e);
    erro("Erro ao carregar notícia", "Verifique sua conexão ou a URL do backend.");
  }
})();

let ultimaRolagem = window.scrollY;
let bloqueioScroll = false;

window.addEventListener("scroll", () => {
  if (bloqueioScroll) return;

  bloqueioScroll = true;

  requestAnimationFrame(() => {
    const header = document.querySelector("header");
    const rolagemAtual = window.scrollY;

    if (!header) {
      bloqueioScroll = false;
      return;
    }

    if (rolagemAtual <= 10) {
      header.classList.remove("header-hidden");
    }
    else if (rolagemAtual > ultimaRolagem) {
      header.classList.add("header-hidden");
    }
    else if (rolagemAtual < ultimaRolagem) {
      header.classList.remove("header-hidden");
    }

    ultimaRolagem = rolagemAtual;
    bloqueioScroll = false;
  });
}, { passive: true });
