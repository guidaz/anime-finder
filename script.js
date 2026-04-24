const btnBuscar = document.getElementById("btnBuscar");
const principal = document.getElementById("principal");
const opcoes = document.getElementById("opcoes");
const favoritosDiv = document.getElementById("favoritos");

document.getElementById("homeBtn").addEventListener("click", voltarInicio);

btnBuscar.addEventListener("click", buscarAnime);
window.onload = mostrarFavoritos;

async function buscarAnime() {
    const nome = document.getElementById("searchInput").value.trim();

    // ✅ ALERTA CAMPO VAZIO
    if (!nome) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo vazio',
            text: 'Digite algo para buscar um anime.'
        });
        return;
    }

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

        card.addEventListener("click", () => {
            mostrarPrincipal(anime);
        });

        opcoes.appendChild(card);
    });
}

function favoritar(anime) {
    let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

    // ✅ TROCA DO ALERT
    if (favoritos.find(a => a.id === anime.id)) {
        Swal.fire({
            icon: 'info',
            title: 'Esse anime já está nos favoritos'
        });
        return;
    }

    favoritos.push(anime);
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
    mostrarFavoritos();

    // ✅ RETORNO AO FAVORITAR
    Swal.fire({
        icon: 'success',
        title: 'Adicionado aos favoritos!'
    });
}

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

        card.addEventListener("click", () => {
            buscarAnimePorID(anime.id);
        });

        const btnRemover = card.querySelector("button");

        // ✅ CONFIRMAÇÃO AO REMOVER
        btnRemover.addEventListener("click", (e) => {
            e.stopPropagation();

            Swal.fire({
                title: 'Tem certeza?',
                text: 'Deseja remover dos favoritos?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sim, remover',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    desfavoritar(anime.id);
                }
            });
        });

        favoritosDiv.appendChild(card);
    });
}

function desfavoritar(id) {
    let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
    favoritos = favoritos.filter(anime => anime.id !== id);
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
    mostrarFavoritos();
}

async function buscarAnimePorID(id) {
    principal.innerHTML = "Carregando...";
    opcoes.innerHTML = "";

    const res = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
    const data = await res.json();

    mostrarPrincipal(data.data);
}

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

function voltarInicio() {
    principal.innerHTML = "";
    opcoes.innerHTML = "";
    document.getElementById("searchInput").value = "";
    mostrarFavoritos();
}