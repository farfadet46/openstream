class OpenStream {
    constructor() {
        this.data = null;
        this.filteredData = [];
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.populateFilters();
        this.renderContent();
    }

    async loadData() {
        try {
            const response = await fetch('data.json');
            this.data = await response.json();
            this.filteredData = [...this.data.movies];
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            this.showError('Impossible de charger les données');
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const filter = e.target.dataset.filter;
                this.setActiveNav(e.target);
                this.filterByType(filter);
            });
        });

        // Recherche
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        searchBtn.addEventListener('click', () => this.performSearch());
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });

        // Filtres
        document.getElementById('yearFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('genreFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('ratingFilter').addEventListener('change', () => this.applyFilters());
    }

    setActiveNav(activeLink) {
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }

    populateFilters() {
        // Années
        const years = [...new Set(this.data.movies.map(movie => movie.year))].sort((a, b) => b - a);
        const yearFilter = document.getElementById('yearFilter');
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearFilter.appendChild(option);
        });

        // Genres
        const genreFilter = document.getElementById('genreFilter');
        this.data.genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            genreFilter.appendChild(option);
        });
    }

    performSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        
        if (!searchTerm) {
            this.filteredData = [...this.data.movies];
        } else {
            this.filteredData = this.data.movies.filter(movie => {
                return movie.title.toLowerCase().includes(searchTerm) ||
                       movie.director.toLowerCase().includes(searchTerm) ||
                       movie.actors.some(actor => actor.toLowerCase().includes(searchTerm)) ||
                       movie.description.toLowerCase().includes(searchTerm);
            });
        }
        
        this.applyFilters();
    }

    filterByType(type) {
        if (type === 'all') {
            this.filteredData = [...this.data.movies];
        } else {
            this.filteredData = this.data.movies.filter(movie => movie.type === type);
        }
        this.applyFilters();
    }

    applyFilters() {
        let filtered = [...this.filteredData];

        // Filtre par année
        const yearFilter = document.getElementById('yearFilter').value;
        if (yearFilter) {
            filtered = filtered.filter(movie => movie.year == yearFilter);
        }

        // Filtre par genre
        const genreFilter = document.getElementById('genreFilter').value;
        if (genreFilter) {
            filtered = filtered.filter(movie => movie.genre.includes(genreFilter));
        }

        // Filtre par note
        const ratingFilter = document.getElementById('ratingFilter').value;
        if (ratingFilter) {
            filtered = filtered.filter(movie => movie.rating >= ratingFilter);
        }

        this.renderContent(filtered);
    }

    renderContent(data = this.filteredData) {
        const grid = document.getElementById('contentGrid');
        grid.innerHTML = '';

        if (data.length === 0) {
            grid.innerHTML = '<p class="no-results">Aucun contenu trouvé</p>';
            return;
        }

        data.forEach(item => {
            const card = this.createContentCard(item);
            grid.appendChild(card);
        });
    }

    createContentCard(item) {
        const card = document.createElement('div');
        card.className = 'content-card';
        
        card.innerHTML = `
            <img src="${item.thumbnail}" alt="${item.title}" class="content-thumbnail">
            <div class="content-info">
                <span class="content-type">${this.getTypeLabel(item.type)}</span>
                <h3 class="content-title">${item.title}</h3>
                <div class="content-meta">
                    <span class="content-year">${item.year}</span>
                    <span class="content-rating">★ ${item.rating}</span>
                </div>
                <p class="content-description">${item.description}</p>
                <!--<p class="content-license">License: ${item.license}</p>-->
            </div>
        `;

        card.addEventListener('click', () => this.handleVideoPlayback(item));
        return card;
    }

    getTypeLabel(type) {
        const labels = {
            'movie': 'Film',
            'series': 'Série',
            'anime': 'Annimation'
        };
        return labels[type] || type;
    }

    showDetails(item) {
        const modal = document.getElementById('videoModal');
        const videoContainer = modal.querySelector('.video-container');
        const closeBtn = modal.querySelector('.modal-close');
        
        // 1. Gestion du lien (YouTube vs Autres)
        let videoEmbedUrl = item.trailer;

        if (item.trailer.includes('youtube.com/watch?v=')) {
            // Transforme le lien classique en lien "embed" pour que YouTube accepte l'affichage
            const videoId = item.trailer.split('v=')[1].split('&')[0];
            videoEmbedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        } else if (item.trailer.includes('youtu.be/')) {
            // Gère les liens courts youtu.be
            const videoId = item.trailer.split('/').pop();
            videoEmbedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        }

        // 2. Injection de l'Iframe dans le container
        // On utilise une Iframe car c'est la seule façon d'afficher du contenu externe (YT, Archive.org)
        videoContainer.innerHTML = `
            <iframe 
                src="${videoEmbedUrl}" 
                width="100%" 
                height="100%" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>`;

        // 3. Remplissage des informations textuelles
        document.getElementById('modalTitle').textContent = item.title;
        document.getElementById('modalDescription').textContent = item.description;
        document.getElementById('modalYear').textContent = `📅 ${item.year}`;
        document.getElementById('modalRating').textContent = `⭐ ${item.rating}/10`;
        //document.getElementById('modalLicense').textContent = `📄 ${item.license}`;

        // 4. Ouverture du modal
        modal.classList.add('active');
        document.body.classList.add('modal-open');

        // 5. Gestion de la fermeture
        const closeModal = () => {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
            videoContainer.innerHTML = ''; // Très important : coupe le son de la vidéo en fermant
        };

        // Événements de fermeture
        closeBtn.onclick = closeModal;
        modal.querySelector('.modal-overlay').onclick = closeModal;

        // Fermeture avec la touche Échap
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    showError(message) {
        const grid = document.getElementById('contentGrid');
        grid.innerHTML = `<p class="error">${message}</p>`;
    }
    
    // Ajouter cette méthode dans la classe OpenStream
    handleVideoPlayback(item) {
        // Vérifier si c'est une vraie vidéo ou un trailer
        if (item.trailer) {
            this.showDetails(item);
        } else {
            // Si pas de trailer, afficher un message
            alert(`🎬 "${item.title}" est disponible sous licence ${item.license}\n\nMalheureusement, le fichier vidéo n'est pas encore disponible.\n\nCeci est une démo de la plateforme Open Source.`);
        }
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    new OpenStream();
});
