// CONFIGURAÇÃO INICIAL
// Troque pelo WhatsApp da loja com DDI + DDD + número, somente números.
const WHATSAPP_PADRAO = "5562999999999";
// Senha solicitada. Atenção: em um site estático, a senha fica visível no código-fonte.
const SENHA_GESTAO = "acaiformulaoficial";

const produtosIniciais = [
  { id: "p1", nome: "Açaí 300 ml", categoria: "Açaí", preco: 12, descricao: "Açaí cremoso para matar a vontade.", imagem: "" },
  { id: "p2", nome: "Açaí 500 ml", categoria: "Açaí", preco: 17, descricao: "Mais açaí para aproveitar cada colherada.", imagem: "" },
  { id: "p3", nome: "Açaí 700 ml", categoria: "Açaí", preco: 22, descricao: "Tamanho ideal para compartilhar ou caprichar.", imagem: "" },
  { id: "p4", nome: "Leite em pó", categoria: "Adicionais", preco: 2, descricao: "Adicione uma porção de leite em pó.", imagem: "" },
  { id: "p5", nome: "Paçoca", categoria: "Adicionais", preco: 2, descricao: "Um toque especial de paçoca.", imagem: "" },
  { id: "p6", nome: "Morango", categoria: "Adicionais", preco: 3, descricao: "Morango para deixar seu açaí ainda melhor.", imagem: "" }
];

const carregar = (chave, padrao) => {
  try {
    const valor = localStorage.getItem(chave);
    return valor ? JSON.parse(valor) : padrao;
  } catch {
    return padrao;
  }
};
let produtos = carregar("formulaProdutos", produtosIniciais);
let carrinho = [];
let categoriaAtiva = "Todos";
let whatsappLoja = localStorage.getItem("formulaWhatsApp") || WHATSAPP_PADRAO;

const el = (id) => document.getElementById(id);
const dinheiro = (valor) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const salvarProdutos = () => localStorage.setItem("formulaProdutos", JSON.stringify(produtos));

function converterImagemArquivo(arquivo) {
  return new Promise((resolve, reject) => {
    if (!arquivo || !arquivo.type.startsWith("image/")) {
      reject(new Error("Selecione um arquivo de imagem válido."));
      return;
    }

    const leitor = new FileReader();
    leitor.onload = () => {
      const imagem = new Image();
      imagem.onload = () => {
        const limite = 900;
        const proporcao = Math.min(1, limite / Math.max(imagem.width, imagem.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(imagem.width * proporcao));
        canvas.height = Math.max(1, Math.round(imagem.height * proporcao));

        const contexto = canvas.getContext("2d");
        contexto.fillStyle = "#ffffff";
        contexto.fillRect(0, 0, canvas.width, canvas.height);
        contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);

        // Reduz o tamanho do arquivo para facilitar o armazenamento no navegador.
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      imagem.onerror = () => reject(new Error("Não foi possível abrir essa imagem."));
      imagem.src = leitor.result;
    };
    leitor.onerror = () => reject(new Error("Não foi possível ler o arquivo selecionado."));
    leitor.readAsDataURL(arquivo);
  });
}

function renderCategorias() {
  const categorias = ["Todos", ...new Set(produtos.map(p => p.categoria).filter(Boolean))];
  if (!categorias.includes(categoriaAtiva)) categoriaAtiva = "Todos";
  el("categorias").innerHTML = categorias.map(cat =>
    `<button class="categoria-btn ${cat === categoriaAtiva ? "ativa" : ""}" data-categoria="${escapeHTML(cat)}">${escapeHTML(cat)}</button>`
  ).join("");
  el("categorias").querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      categoriaAtiva = btn.dataset.categoria;
      renderCategorias();
      renderProdutos();
    });
  });
}

function escapeHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function renderProdutos() {
  const lista = categoriaAtiva === "Todos" ? produtos : produtos.filter(p => p.categoria === categoriaAtiva);
  el("produtos").innerHTML = lista.length ? lista.map(p => `
    <article class="produto">
      ${p.imagem ? `<img class="produto-img" src="${escapeHTML(p.imagem)}" alt="${escapeHTML(p.nome)}" onerror="this.outerHTML='<div class=&quot;produto-sem-img&quot;>🍧</div>'">` : `<div class="produto-sem-img">🍧</div>`}
      <div class="produto-info">
        <h3>${escapeHTML(p.nome)}</h3>
        <p>${escapeHTML(p.descricao || "Uma delícia da Fórmula Açaí.")}</p>
        <div class="produto-rodape">
          <span class="preco">${dinheiro(Number(p.preco) || 0)}</span>
          <button class="botao-adicionar" data-id="${escapeHTML(p.id)}">Adicionar +</button>
        </div>
      </div>
    </article>`).join("") : '<p>Nenhum produto cadastrado nesta categoria.</p>';
  el("produtos").querySelectorAll("[data-id]").forEach(btn => {
    btn.addEventListener("click", () => adicionarAoCarrinho(btn.dataset.id));
  });
}

function adicionarAoCarrinho(id) {
  const produto = produtos.find(p => p.id === id);
  if (!produto) return;
  const existente = carrinho.find(i => i.id === id);
  if (existente) existente.quantidade++;
  else carrinho.push({ ...produto, quantidade: 1 });
  renderCarrinho();
}

function alterarQuantidade(id, delta) {
  const item = carrinho.find(i => i.id === id);
  if (!item) return;
  item.quantidade += delta;
  if (item.quantidade <= 0) carrinho = carrinho.filter(i => i.id !== id);
  renderCarrinho();
}

function renderCarrinho() {
  const quantidade = carrinho.reduce((s, i) => s + i.quantidade, 0);
  const total = carrinho.reduce((s, i) => s + Number(i.preco) * i.quantidade, 0);
  el("contador-itens").textContent = `${quantidade} ${quantidade === 1 ? "item" : "itens"}`;
  el("total").textContent = dinheiro(total);
  el("itens-carrinho").innerHTML = carrinho.length ? carrinho.map(i => `
    <div class="item-carrinho">
      <div><strong>${escapeHTML(i.nome)}</strong><small>${dinheiro(Number(i.preco))} cada</small></div>
      <div class="controles-qtd">
        <button data-delta="-1" data-id="${escapeHTML(i.id)}" aria-label="Diminuir">−</button>
        <strong>${i.quantidade}</strong>
        <button data-delta="1" data-id="${escapeHTML(i.id)}" aria-label="Aumentar">+</button>
      </div>
      <button class="remover" data-remover="${escapeHTML(i.id)}" aria-label="Remover">✕</button>
    </div>`).join("") : '<p class="vazio">Seu carrinho está vazio. Escolha seus açaís favoritos!</p>';
  el("itens-carrinho").querySelectorAll("[data-delta]").forEach(btn =>
    btn.addEventListener("click", () => alterarQuantidade(btn.dataset.id, Number(btn.dataset.delta)))
  );
  el("itens-carrinho").querySelectorAll("[data-remover]").forEach(btn =>
    btn.addEventListener("click", () => {
      carrinho = carrinho.filter(i => i.id !== btn.dataset.remover);
      renderCarrinho();
    })
  );
}

function finalizarPedido() {
  if (!carrinho.length) {
    alert("Adicione pelo menos um produto ao pedido.");
    return;
  }
  const nome = el("nome-cliente").value.trim();
  if (!nome) {
    alert("Informe seu nome para continuar.");
    el("nome-cliente").focus();
    return;
  }
  if (!whatsappLoja || whatsappLoja === WHATSAPP_PADRAO) {
    const confirmar = confirm("O número de WhatsApp ainda está com o exemplo padrão. Deseja continuar? Configure o número real na área de gestão.");
    if (!confirmar) return;
  }
  const total = carrinho.reduce((s, i) => s + Number(i.preco) * i.quantidade, 0);
  const linhas = carrinho.map(i => `• ${i.quantidade}x ${i.nome} — ${dinheiro(Number(i.preco) * i.quantidade)}`);
  const observacao = el("observacao-pedido").value.trim();
  const mensagem = [
    "Olá, Fórmula Açaí! Quero fazer este pedido:",
    "",
    `👤 Cliente: ${nome}`,
    ...linhas,
    "",
    `*Total: ${dinheiro(total)}*`,
    observacao ? `📝 Observações: ${observacao}` : "",
    "",
    "Aguardo a chave PIX para realizar o pagamento. Obrigado(a)!"
  ].filter(Boolean).join("\n");

  const numero = whatsappLoja.replace(/\D/g, "");
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank", "noopener,noreferrer");

  el("catalogo").classList.add("escondido");
  el("carrinho").classList.add("escondido");
  el("gestao").classList.add("escondido");
  document.querySelector(".topo").classList.add("escondido");
  document.querySelector(".rodape").classList.add("escondido");
  el("confirmacao").classList.remove("escondido");
  carrinho = [];
  renderCarrinho();
}

function abrirGestao() {
  el("modal-acesso").classList.remove("escondido");
  el("senha-admin").value = "";
  el("erro-login").textContent = "";
  el("senha-admin").focus();
}
function entrarGestao(event) {
  event.preventDefault();
  if (el("senha-admin").value !== SENHA_GESTAO) {
    el("erro-login").textContent = "Senha incorreta. Tente novamente.";
    return;
  }
  el("modal-acesso").classList.add("escondido");
  el("catalogo").classList.add("escondido");
  el("carrinho").classList.add("escondido");
  el("gestao").classList.remove("escondido");
  document.querySelector(".topo").classList.add("escondido");
  el("whatsapp-loja").value = whatsappLoja;
  renderAdmin();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function renderAdmin() {
  el("lista-admin").innerHTML = produtos.length ? produtos.map(p => `
    <div class="lista-admin-item">
      <div><strong>${escapeHTML(p.nome)}</strong><small>${escapeHTML(p.categoria)} · ${dinheiro(Number(p.preco))}</small></div>
      <div class="lista-admin-acoes">
        <button data-editar="${escapeHTML(p.id)}">Editar</button>
        <button data-excluir="${escapeHTML(p.id)}">Excluir</button>
      </div>
    </div>`).join("") : "<p>Nenhum produto cadastrado.</p>";
  el("lista-admin").querySelectorAll("[data-editar]").forEach(btn =>
    btn.addEventListener("click", () => editarProduto(btn.dataset.editar))
  );
  el("lista-admin").querySelectorAll("[data-excluir]").forEach(btn =>
    btn.addEventListener("click", () => excluirProduto(btn.dataset.excluir))
  );
}
function editarProduto(id) {
  const p = produtos.find(item => item.id === id);
  if (!p) return;
  el("produto-id").value = p.id;
  el("nome-produto").value = p.nome;
  el("categoria-produto").value = p.categoria;
  el("preco-produto").value = p.preco;
  el("imagem-produto").value = "";
  el("descricao-produto").value = p.descricao || "";
  el("titulo-form-produto").textContent = "Editar produto";
  el("cancelar-edicao").classList.remove("escondido");
  el("form-produto").scrollIntoView({ behavior: "smooth" });
}
function limparFormulario() {
  el("form-produto").reset();
  el("produto-id").value = "";
  el("titulo-form-produto").textContent = "Adicionar produto";
  el("cancelar-edicao").classList.add("escondido");
}
function excluirProduto(id) {
  if (!confirm("Deseja realmente excluir este produto?")) return;
  produtos = produtos.filter(p => p.id !== id);
  carrinho = carrinho.filter(p => p.id !== id);
  salvarProdutos();
  renderAdmin();
  renderCategorias();
  renderProdutos();
  renderCarrinho();
}

el("finalizar-pedido").addEventListener("click", finalizarPedido);
el("abrir-gestao").addEventListener("click", abrirGestao);
el("fechar-modal").addEventListener("click", () => el("modal-acesso").classList.add("escondido"));
el("form-login").addEventListener("submit", entrarGestao);
el("voltar-cardapio").addEventListener("click", () => {
  el("gestao").classList.add("escondido");
  el("catalogo").classList.remove("escondido");
  el("carrinho").classList.remove("escondido");
  document.querySelector(".topo").classList.remove("escondido");
  document.querySelector(".rodape").classList.remove("escondido");
  window.scrollTo({ top: 0, behavior: "smooth" });
});
el("salvar-whatsapp").addEventListener("click", () => {
  const numero = el("whatsapp-loja").value.replace(/\D/g, "");
  if (numero.length < 12) {
    alert("Digite o número com DDI 55, DDD e telefone. Ex.: 5562999999999");
    return;
  }
  whatsappLoja = numero;
  localStorage.setItem("formulaWhatsApp", numero);
  alert("WhatsApp da loja salvo neste navegador!");
});
el("form-produto").addEventListener("submit", async event => {
  event.preventDefault();

  const id = el("produto-id").value || `p${Date.now()}`;
  const produtoExistente = produtos.find(p => p.id === id);
  const arquivoImagem = el("imagem-produto").files[0];
  let imagem = produtoExistente?.imagem || "";

  try {
    if (arquivoImagem) {
      imagem = await converterImagemArquivo(arquivoImagem);
    }

    const produto = {
      id,
      nome: el("nome-produto").value.trim(),
      categoria: el("categoria-produto").value.trim(),
      preco: Number(el("preco-produto").value),
      imagem,
      descricao: el("descricao-produto").value.trim()
    };

    const index = produtos.findIndex(p => p.id === id);
    if (index >= 0) produtos[index] = produto;
    else produtos.push(produto);

    salvarProdutos();
    limparFormulario();
    renderAdmin();
    renderCategorias();
    renderProdutos();
    alert("Produto salvo com sucesso!");
  } catch (erro) {
    alert(erro.message || "Não foi possível salvar a imagem. Tente outro arquivo.");
  }
});
el("cancelar-edicao").addEventListener("click", limparFormulario);
el("novo-pedido").addEventListener("click", () => {
  el("confirmacao").classList.add("escondido");
  el("catalogo").classList.remove("escondido");
  el("carrinho").classList.remove("escondido");
  document.querySelector(".topo").classList.remove("escondido");
  document.querySelector(".rodape").classList.remove("escondido");
  el("nome-cliente").value = "";
  el("observacao-pedido").value = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

renderCategorias();
renderProdutos();
renderCarrinho();
