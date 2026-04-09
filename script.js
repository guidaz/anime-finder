const btnBuscar = document.getElementById("btnBuscar");
const principal = document.getElementById("principal");
const opcoes = document.getElementById("opcoes");
const favoritosDiv = document.getElementById("favoritos");

document.getElementById("homeBtn").addEventListener("click", voltarInicio);

btnBuscar.addEventListener("click", buscarAnime);
window.onload = mostrarFavoritos;

/**
 * Busca animes na API Jikan pelo nome informado no input.
 * Atualiza o anime principal e as opções de outros animes.
 * @returns {Promise<void>}
 */
async function buscarAnime() {
    const nome = document.getElementById("searchInput").value.trim();
    if (!nome) return;

    principal.innerHTML = "Carregando...";
    opcoes.innerHTML = "";

    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${nome}`);
    const data = await res.json();

    if (!data.data.length) {
        principal.innerHTML = "<p>Nenhum anime encontrado.</p>";
        return;
    }

    const lista = data.data;

    mostrarPrincipal(lista[0]);
    mostrarOpcoes(lista.slice(1, 7));
}

/**
 * Mostra o anime selecionado na área principal.
 * @param {Object} anime - Objeto contendo os dados do anime
 * @returns {Promise<void>}
 */
async function mostrarPrincipal(anime) {
    const sinopseTraduzida = await traduzirTexto(anime.synopsis || "");

    principal.innerHTML = `
        <div class="principal-card">
            <img src="${anime.images.jpg.image_url}">
            <div>
                <h2>${anime.title}</h2>
                <p><strong>Nota geral:</strong> ${anime.score ?? "N/A"}</p>
                <p>${sinopseTraduzida}</p>
                <button onclick='favoritar(${JSON.stringify({
                    id: anime.mal_id,
                    titulo: anime.title,
                    imagem: anime.images.jpg.image_url,
                    nota: anime.score
                })})'>⭐ Favoritar</button>
            </div>
        </div>
    `;
}

/**
 * Mostra os cards das outras opções de animes clicáveis.
 * @param {Array<Object>} lista - Lista de animes
 * @returns {void}
 */
function mostrarOpcoes(lista) {
    opcoes.innerHTML = "";

    lista.forEach(anime => {
        const card = document.createElement("div");
        card.classList.add("card");
        card.style.cursor = "pointer";

        card.innerHTML = `
            <img src="${anime.images.jpg.image_url}">
            <div class="card-content">
                <h3>${anime.title}</h3>
                <p>Nota: ${anime.score ?? "N/A"}</p>
            </div>
        `;

        // Clique para mostrar como principal
        card.addEventListener("click", () => {
            mostrarPrincipal(anime);
        });

        opcoes.appendChild(card);
    });
}

/**
 * Adiciona um anime aos favoritos e salva no localStorage.
 * @param {Object} anime - Objeto com dados do anime
 * @returns {void}
 */
function favoritar(anime) {
    let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

    if (favoritos.find(a => a.id === anime.id)) {
        alert("Já está nos favoritos!");
        return;
    }

    favoritos.push(anime);
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
    mostrarFavoritos();
}

/**
 * Mostra os favoritos salvos no localStorage.
 * Cada card é clicável para abrir como anime principal e possui botão de remover.
 * @returns {void}
 */
function mostrarFavoritos() {
    const favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

    favoritosDiv.innerHTML = "";

    favoritos.forEach(anime => {
        const card = document.createElement("div");
        card.classList.add("card");
        card.style.cursor = "pointer";

        card.innerHTML = `
            <img src="${anime.imagem}">
            <div class="card-content">
                <h3>${anime.titulo}</h3>
                <p>Nota: ${anime.nota ?? "N/A"}</p>
                <button>❌ Remover</button>
            </div>
        `;

        // Abrir anime ao clicar no card
        card.addEventListener("click", () => {
            buscarAnimePorID(anime.id);
        });

        // Botão de remover sem disparar o click do card
        const btnRemover = card.querySelector("button");
        btnRemover.addEventListener("click", (e) => {
            e.stopPropagation();
            desfavoritar(anime.id);
        });

        favoritosDiv.appendChild(card);
    });
}

/**
 * Remove um anime dos favoritos pelo ID.
 * @param {number} id - ID do anime a ser removido
 * @returns {void}
 */
function desfavoritar(id) {
    let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
    favoritos = favoritos.filter(anime => anime.id !== id);
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
    mostrarFavoritos();
}

/**
 * Busca um anime pelo ID na API e o mostra como principal.
 * @param {number} id - ID do anime
 * @returns {Promise<void>}
 */
async function buscarAnimePorID(id) {
    principal.innerHTML = "Carregando...";
    opcoes.innerHTML = "";

    const res = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
    const data = await res.json();

    mostrarPrincipal(data.data);
}

/**
 * Traduz o texto da sinopse do inglês para português usando a API MyMemory.
 * Limita o texto a 450 caracteres.
 * @param {string} texto - Texto original em inglês
 * @returns {Promise<string>} - Texto traduzido
 */
async function traduzirTexto(texto) {
    if (!texto) return "Sem descrição disponível.";

    const textoCortado = texto.substring(0, 450);

    try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textoCortado)}&langpair=en|pt`);
        const data = await res.json();
        return data.responseData.translatedText + "...";
    } catch {
        return textoCortado;
    }
}

/**
 * Limpa a área principal e o input de pesquisa.
 * Mantém as opções e favoritos visíveis.
 * @returns {void}
 */
function voltarInicio() {
    principal.innerHTML = "";
    document.getElementById("searchInput").value = "";
    mostrarFavoritos();
}