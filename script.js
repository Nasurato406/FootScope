/* =========================================================
   FOOTSCOPE
   API-FOOTBALL
   ========================================================= */

/* =========================================================
   🔴 TA CLÉ API
   ========================================================= */

const API_KEY = "25fd0757eec89ba850a53745eab92ab7";

const API_URL =
    "https://v3.football.api-sports.io";

/* =========================================================
   COMPÉTITIONS
   ========================================================= */

const LEAGUES = {
    "Ligue 1": { id: 61, country: "France" },
    "Ligue 2": { id: 62, country: "France" },
    "Premier League": { id: 39, country: "Angleterre" },
    "La Liga": { id: 140, country: "Espagne" },
    "Serie A": { id: 135, country: "Italie" },
    "Bundesliga": { id: 78, country: "Allemagne" },
    "Liga Portugal": { id: 94, country: "Portugal" },
    "MLS": { id: 253, country: "USA" },
    "Ligue des Champions": { id: 2, country: "Europe" },
    "Europa League": { id: 3, country: "Europe" },
    "Conference League": { id: 848, country: "Europe" },
    "Coupe de France": { id: 66, country: "France" },
    "Trophée des Champions": { id: 526, country: "France" },
    "FA Cup": { id: 45, country: "Angleterre" },
    "Copa del Rey": { id: 143, country: "Espagne" },
    "Super Coupe d'Espagne": { id: 556, country: "Espagne" },
    "Coppa Italia": { id: 137, country: "Italie" },
    "Super Coupe d'Italie": { id: 547, country: "Italie" },
    "DFB-Pokal": { id: 81, country: "Allemagne" },
    "Super Coupe d'Allemagne": { id: 529, country: "Allemagne" },
    "Taça de Portugal": { id: 96, country: "Portugal" },
    "Taça da Liga": { id: 95, country: "Portugal" },
    "Supertaça": { id: 97, country: "Portugal" },
    "Super Coupe de l'UEFA": { id: 531, country: "Europe" }
};

/* =========================================================
   DONNÉES
   ========================================================= */

let matches = [];
let allMatches = [];

let watchedMatches = {};
let favoritePlayers = {};
let officialMOTM = {};

let selectedDate = new Date();

selectedDate.setHours(12, 0, 0, 0);

let selectedCompetition = null;

/* =========================================================
   LOCAL STORAGE
   ========================================================= */

try {
    watchedMatches =
        JSON.parse(
            localStorage.getItem("footScopeWatched")
        ) || {};

    favoritePlayers =
        JSON.parse(
            localStorage.getItem("footScopeFavoritePlayers")
        ) || {};

    officialMOTM =
        JSON.parse(
            localStorage.getItem("footScopeOfficialMOTM")
        ) || {};

} catch (error) {

    console.error(
        "Erreur LocalStorage :",
        error
    );

    watchedMatches = {};
    favoritePlayers = {};
    officialMOTM = {};
}

/* =========================================================
   COMPATIBILITÉ ANCIENNES DONNÉES
   ========================================================= */

function migrateOldData() {

    Object.keys(watchedMatches).forEach(function (id) {

        const item = watchedMatches[id];

        if (!item || typeof item !== "object") {
            return;
        }

        /*
         * On NE SUPPRIME RIEN.
         *
         * Si un ancien enregistrement utilise
         * favoritePlayer, on le remet également
         * dans favoritePlayers.
         */

        if (
            item.favoritePlayer &&
            !favoritePlayers[id]
        ) {
            favoritePlayers[id] =
                item.favoritePlayer;
        }

        /*
         * Même chose pour l'homme du match.
         */

        if (
            item.officialMOTM &&
            !officialMOTM[id]
        ) {
            officialMOTM[id] =
                item.officialMOTM;
        }

        /*
         * Les anciennes données restent
         * exactement dans watchedMatches.
         */
    });

    saveData();
}

migrateOldData();

/* =========================================================
   SAUVEGARDE
   ========================================================= */

function saveData() {

    localStorage.setItem(
        "footScopeWatched",
        JSON.stringify(watchedMatches)
    );

    localStorage.setItem(
        "footScopeFavoritePlayers",
        JSON.stringify(favoritePlayers)
    );

    localStorage.setItem(
        "footScopeOfficialMOTM",
        JSON.stringify(officialMOTM)
    );
}

/* =========================================================
   ÉCHAPPEMENT HTML
   ========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   DATE
   ========================================================= */

function getDateString(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return (
        year +
        "-" +
        month +
        "-" +
        day
    );
}

function formatDateFR(dateString) {

    const date =
        new Date(
            dateString + "T12:00:00"
        );

    return date.toLocaleDateString(
        "fr-FR",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );
}

/* =========================================================
   DATE AFFICHÉE
   ========================================================= */

function updateSelectedDateDisplay() {

    const dateElement =
        document.getElementById(
            "selectedDate"
        );

    if (!dateElement) {
        return;
    }

    let dateText =
        formatDateFR(
            getDateString(
                selectedDate
            )
        );

    dateText =
        dateText.charAt(0).toUpperCase() +
        dateText.slice(1);

    dateElement.textContent =
        dateText;
}

/* =========================================================
   HEURE
   ========================================================= */

function formatTime(dateString) {

    return new Date(
        dateString
    ).toLocaleTimeString(
        "fr-FR",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

/* =========================================================
   STATUS
   ========================================================= */

function getStatusText(status) {

    if (!status) {
        return "";
    }

    const statuses = {
        NS: "À venir",
        TBD: "À déterminer",
        "1H": "En direct",
        HT: "Mi-temps",
        "2H": "En direct",
        ET: "Prolongations",
        P: "Tirs au but",
        FT: "Terminé",
        AET: "Terminé",
        PEN: "Terminé",
        PST: "Reporté",
        CANC: "Annulé",
        ABD: "Abandonné"
    };

    return (
        statuses[status.short] ||
        status.long ||
        ""
    );
}

/* =========================================================
   STATUS API
   ========================================================= */

function showApiStatus(message, type) {

    const element =
        document.getElementById(
            "apiStatus"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.className =
        "api-status";

    if (type) {
        element.classList.add(type);
    }
}

/* =========================================================
   REQUÊTE API
   ========================================================= */

async function apiRequest(endpoint) {

    const response =
        await fetch(
            API_URL + endpoint,
            {
                method: "GET",

                headers: {
                    "x-apisports-key":
                        API_KEY,

                    "Accept":
                        "application/json"
                }
            }
        );

    if (!response.ok) {
        throw new Error(
            "HTTP " +
            response.status
        );
    }

    const data =
        await response.json();

    if (
        data.errors &&
        Object.keys(data.errors).length > 0
    ) {

        throw new Error(
            JSON.stringify(
                data.errors
            )
        );
    }

    return data;
}

/* =========================================================
   CHARGER LES MATCHS
   ========================================================= */

async function loadMatches() {

    if (
        !API_KEY ||
        API_KEY === "COLLE_TA_CLÉ_API_ICI"
    ) {

        showApiStatus(
            "⚠️ Mets ta clé API dans script.js.",
            "error"
        );

        return;
    }

    const date =
        getDateString(
            selectedDate
        );

    selectedCompetition = null;

    const competitionMatches =
        document.getElementById(
            "competitionMatches"
        );

    const competitionsContainer =
        document.getElementById(
            "competitionsContainer"
        );

    if (competitionMatches) {
        competitionMatches.classList.add("hidden");
    }

    if (competitionsContainer) {
        competitionsContainer.style.display = "grid";
    }

    showApiStatus(
        "⏳ Chargement des matchs du " +
        formatDateFR(date) +
        "...",
        ""
    );

    if (competitionsContainer) {

        competitionsContainer.innerHTML =
            '<div class="loading">' +
            "⚽ Chargement des matchs..." +
            "</div>";
    }

    try {

        const data =
            await apiRequest(
                "/fixtures?date=" +
                date
            );

        allMatches = [];

        const fixtures =
            data.response || [];

        fixtures.forEach(function (fixture) {

            const normalized =
                normalizeFixture(
                    fixture
                );

            if (normalized) {
                allMatches.push(
                    normalized
                );
            }
        });

        matches =
            allMatches.slice();

        matches.sort(function (a, b) {

            return (
                new Date(a.date) -
                new Date(b.date)
            );
        });

        showApiStatus(
            allMatches.length +
            " match(s) trouvé(s)",
            "success"
        );

        renderCompetitions();

    } catch (error) {

        console.error(
            "FootScope API error:",
            error
        );

        const message =
            "❌ Impossible de charger les matchs.";

        showApiStatus(
            message,
            "error"
        );

        if (competitionsContainer) {

            competitionsContainer.innerHTML =
                '<div class="empty">' +
                escapeHTML(message) +
                "<br><br>" +
                "Date demandée : " +
                escapeHTML(
                    formatDateFR(date)
                ) +
                "</div>";
        }
    }
}

/* =========================================================
   NORMALISATION
   ========================================================= */

function normalizeFixture(fixture) {

    if (
        !fixture ||
        !fixture.fixture ||
        !fixture.league ||
        !fixture.teams
    ) {
        return null;
    }

    const leagueId =
        fixture.league.id;

    const leagueExists =
        Object.values(
            LEAGUES
        ).some(function (league) {

            return league.id === leagueId;

        });

    if (!leagueExists) {
        return null;
    }

    return {

        id:
            fixture.fixture.id,

        date:
            fixture.fixture.date,

        status:
            fixture.fixture.status,

        competition:
            fixture.league.name,

        leagueId:
            fixture.league.id,

        season:
            fixture.league.season,

        country:
            fixture.league.country,

        leagueLogo:
            fixture.league.logo,

        home:
            fixture.teams.home.name,

        away:
            fixture.teams.away.name,

        homeId:
            fixture.teams.home.id,

        awayId:
            fixture.teams.away.id,

        homeLogo:
            fixture.teams.home.logo,

        awayLogo:
            fixture.teams.away.logo,

        homeScore:
            fixture.goals.home,

        awayScore:
            fixture.goals.away,

        stadium:
            fixture.fixture.venue &&
            fixture.fixture.venue.name
                ? fixture.fixture.venue.name
                : "Stade non renseigné"
    };
}

/* =========================================================
   COMPÉTITIONS
   ========================================================= */

function renderCompetitions() {

    const container =
        document.getElementById(
            "competitionsContainer"
        );

    if (!container) {
        return;
    }

    container.style.display = "grid";

    const competitionMatches =
        document.getElementById(
            "competitionMatches"
        );

    if (competitionMatches) {
        competitionMatches.classList.add("hidden");
    }

    if (!allMatches.length) {

        container.innerHTML =
            '<div class="empty">' +
            "Aucun match trouvé pour cette date." +
            "<br><br>" +
            "Utilise les flèches pour changer de jour." +
            "</div>";

        return;
    }

    const groups = {};

    allMatches.forEach(function (match) {

        if (!groups[match.leagueId]) {

            groups[match.leagueId] = {

                name:
                    match.competition,

                country:
                    match.country,

                logo:
                    match.leagueLogo,

                matches: []
            };
        }

        groups[
            match.leagueId
        ].matches.push(match);
    });

    const competitions =
        Object.values(groups);

    container.innerHTML =
        competitions
            .map(function (competition) {

                return createCompetitionCard(
                    competition
                );

            })
            .join("");
}

/* =========================================================
   CARTE COMPÉTITION
   ========================================================= */

function createCompetitionCard(competition) {

    const logo =
        competition.logo
            ? (
                '<img src="' +
                escapeHTML(
                    competition.logo
                ) +
                '" alt="">'
            )
            : "🏆";

    return (

        '<div class="competition-card" ' +

        'onclick="openCompetition(' +
        competition.matches[0].leagueId +
        ')">' +

        '<div class="competition-card-top">' +

        '<div class="competition-logo">' +
        logo +
        "</div>" +

        "<div>" +

        '<div class="competition-name">' +
        escapeHTML(
            competition.name
        ) +
        "</div>" +

        '<div class="competition-country">' +
        escapeHTML(
            competition.country || ""
        ) +
        "</div>" +

        "</div>" +

        "</div>" +

        '<div class="competition-count">' +

        "⚽ " +

        competition.matches.length +

        (
            competition.matches.length > 1
                ? " matchs"
                : " match"
        ) +

        " • Voir les matchs →" +

        "</div>" +

        "</div>"
    );
}

/* =========================================================
   OUVRIR COMPÉTITION
   ========================================================= */

function openCompetition(leagueId) {

    selectedCompetition =
        leagueId;

    const competitionMatches =
        allMatches.filter(
            function (match) {

                return (
                    match.leagueId ===
                    leagueId
                );

            }
        );

    if (!competitionMatches.length) {
        return;
    }

    const competition =
        competitionMatches[0];

    const competitionsContainer =
        document.getElementById(
            "competitionsContainer"
        );

    if (competitionsContainer) {
        competitionsContainer.style.display = "none";
    }

    const competitionPage =
        document.getElementById(
            "competitionMatches"
        );

    if (competitionPage) {
        competitionPage.classList.remove("hidden");
    }

    const title =
        document.getElementById(
            "selectedCompetitionTitle"
        );

    if (title) {

        title.textContent =
            "🏆 " +
            competition.competition;
    }

    const container =
        document.getElementById(
            "matchesContainer"
        );

    if (!container) {
        return;
    }

    container.innerHTML =
        competitionMatches
            .map(function (match) {

                return createMatchCard(
                    match
                );

            })
            .join("");
}

/* =========================================================
   RETOUR AUX COMPÉTITIONS
   ========================================================= */

const backToCompetitions =
    document.getElementById(
        "backToCompetitions"
    );

if (backToCompetitions) {

    backToCompetitions.addEventListener(
        "click",
        function () {

            selectedCompetition = null;

            const competitionMatches =
                document.getElementById(
                    "competitionMatches"
                );

            if (competitionMatches) {
                competitionMatches.classList.add("hidden");
            }

            const competitionsContainer =
                document.getElementById(
                    "competitionsContainer"
                );

            if (competitionsContainer) {
                competitionsContainer.style.display = "grid";
            }
        }
    );
}

/* =========================================================
   TEXTE PROGRESSION
   ========================================================= */

function getWatchProgressLabel(progress) {

    const labels = {

        "22": "22e minute",
        "45": "Mi-temps",
        "72": "72e minute",
        "90": "Match terminé"

    };

    return (
        labels[String(progress)] ||
        "Non renseigné"
    );
}

/* =========================================================
   RÉCUPÉRER UN MATCH SAUVEGARDÉ
   ========================================================= */

function getSavedMatchData(item) {

    if (
        item &&
        item.matchData
    ) {
        return item.matchData;
    }

    return null;
}

/* =========================================================
   TROUVER UN MATCH
   ========================================================= */

function findMatchById(id) {

    const currentMatch =
        allMatches.find(
            function (match) {

                return (
                    Number(match.id) ===
                    Number(id)
                );

            }
        );

    if (currentMatch) {
        return currentMatch;
    }

    const saved =
        watchedMatches[id];

    if (
        saved &&
        saved.matchData
    ) {
        return saved.matchData;
    }

    return null;
}

/* =========================================================
   CARTE MATCH
   ========================================================= */

function createMatchCard(match) {

    const watched =
        watchedMatches[match.id];

    const favorite =
        favoritePlayers[match.id] || "";

    let score = "-";

    if (
        match.homeScore !== null &&
        match.homeScore !== undefined
    ) {

        score =
            match.homeScore +
            " - " +
            match.awayScore;
    }

    let favoriteHTML = "";

    if (favorite) {

        favoriteHTML =

            '<div class="favorite-box">' +

            "⭐ Joueur préféré : " +

            "<strong>" +

            escapeHTML(favorite) +

            "</strong>" +

            "</div>";
    }

    let progressHTML = "";

    if (
        watched &&
        watched.watchProgress
    ) {

        progressHTML =

            '<div class="favorite-box">' +

            "⏱️ Vu jusqu'à : " +

            "<strong>" +

            escapeHTML(
                getWatchProgressLabel(
                    watched.watchProgress
                )
            ) +

            "</strong>" +

            (
                watched.goalsSeen !== undefined
                    ? " • ⚽ " +
                      watched.goalsSeen +
                      " but(s) vu(s)"
                    : ""
            ) +

            "</div>";
    }

    return (

        '<div class="match-card" ' +

        'onclick="openMatch(' +
        match.id +
        ')">' +

        '<div class="match-header">' +

        '<span class="competition">' +
        escapeHTML(match.competition) +
        "</span>" +

        "<span>" +
        formatTime(match.date) +
        "</span>" +

        "</div>" +

        '<div class="match-teams">' +

        '<div class="team">' +

        '<div class="team-logo">' +

        (
            match.homeLogo
                ? '<img src="' +
                  escapeHTML(
                      match.homeLogo
                  ) +
                  '" alt="">'
                : "⚽"
        ) +

        "</div>" +

        escapeHTML(match.home) +

        "</div>" +

        "<div>" +

        '<div class="score">' +
        score +
        "</div>" +

        '<div class="match-status">' +
        getStatusText(match.status) +
        "</div>" +

        "</div>" +

        '<div class="team">' +

        '<div class="team-logo">' +

        (
            match.awayLogo
                ? '<img src="' +
                  escapeHTML(
                      match.awayLogo
                  ) +
                  '" alt="">'
                : "⚽"
        ) +

        "</div>" +

        escapeHTML(match.away) +

        "</div>" +

        "</div>" +

        favoriteHTML +

        progressHTML +

        '<div class="match-footer">' +

        (
            watched
                ? '<span class="watched">✓ Match enregistré</span>'
                : '<span class="match-status">Pas encore enregistré</span>'
        ) +

        '<button class="watch-btn" ' +

        'onclick="event.stopPropagation(); openMatch(' +
        match.id +
        ')">' +

        (
            watched
                ? "Modifier"
                : "J'ai regardé"
        ) +

        "</button>" +

        "</div>" +

        "</div>"
    );
}

/* =========================================================
   OUVRIR MATCH
   ========================================================= */

async function openMatch(id) {

    const match =
        findMatchById(id);

    if (!match) {
        return;
    }

    const watched =
        watchedMatches[id];

    const favorite =
        favoritePlayers[id] ||
        (
            watched &&
            watched.favoritePlayer
        ) ||
        "";

    const motm =
        officialMOTM[id] ||
        (
            watched
                ? watched.officialMOTM || ""
                : ""
        );

    let rating =
        watched
            ? watched.rating
            : "";

    let quality =
        watched
            ? watched.quality
            : "très bon";

    let comment =
        watched
            ? watched.comment
            : "";

    let watchProgress =
        watched &&
        watched.watchProgress
            ? String(
                watched.watchProgress
            )
            : "90";

    let score = "-";

    if (
        match.homeScore !== null &&
        match.homeScore !== undefined
    ) {

        score =
            match.homeScore +
            " - " +
            match.awayScore;
    }

    const content =
        document.getElementById(
            "modalContent"
        );

    if (!content) {
        return;
    }

    content.innerHTML =

        '<div class="competition">' +
        escapeHTML(match.competition) +
        "</div>" +

        '<div class="modal-teams">' +

        '<div class="modal-team">' +

        (
            match.homeLogo
                ? '<img src="' +
                  escapeHTML(
                      match.homeLogo
                  ) +
                  '" alt="">'
                : ""
        ) +

        escapeHTML(match.home) +

        "</div>" +

        "<div>" +

        '<div class="modal-score">' +
        score +
        "</div>" +

        '<p class="match-status">' +
        getStatusText(match.status) +
        " • " +
        formatTime(match.date) +
        "</p>" +

        "</div>" +

        '<div class="modal-team">' +

        (
            match.awayLogo
                ? '<img src="' +
                  escapeHTML(
                      match.awayLogo
                  ) +
                  '" alt="">'
                : ""
        ) +

        escapeHTML(match.away) +

        "</div>" +

        "</div>" +

        '<div class="info-list">' +

        '<div class="info-row">' +

        "<span>Date</span>" +

        "<strong>" +

        formatDateFR(
            match.date.substring(0, 10)
        ) +

        "</strong>" +

        "</div>" +

        '<div class="info-row">' +

        "<span>Stade</span>" +

        "<strong>" +

        escapeHTML(
            match.stadium ||
            "Stade non renseigné"
        ) +

        "</strong>" +

        "</div>" +

        "</div>" +

        '<h3 class="sub-title">' +
        "⏱️ Jusqu'où as-tu regardé ?" +
        "</h3>" +

        '<div class="form-group">' +

        "<label>" +
        "Sélectionne le moment où tu as arrêté de regarder :" +
        "</label>" +

        '<select id="watchProgress" class="form-select">' +

        '<option value="22"' +
        (
            watchProgress === "22"
                ? " selected"
                : ""
        ) +
        ">⏱️ 22e minute</option>" +

        '<option value="45"' +
        (
            watchProgress === "45"
                ? " selected"
                : ""
        ) +
        ">⏱️ Mi-temps (45e)</option>" +

        '<option value="72"' +
        (
            watchProgress === "72"
                ? " selected"
                : ""
        ) +
        ">⏱️ 72e minute</option>" +

        '<option value="90"' +
        (
            watchProgress === "90"
                ? " selected"
                : ""
        ) +
        ">🏁 Match terminé</option>" +

        "</select>" +

        '<div id="goalsPreview" class="favorite-box" style="margin-top:10px;">' +
        "⚽ Les buts vus seront calculés automatiquement." +
        "</div>" +

        "</div>" +

        '<h3 class="sub-title">' +
        "⭐ Mon joueur préféré" +
        "</h3>" +

        '<div class="form-group">' +

        "<label>" +
        "Choisis ton joueur préféré :" +
        "</label>" +

        '<div id="playerChoices" class="player-choice-grid">' +

        '<div class="loading">' +
        "⚽ Chargement des joueurs..." +
        "</div>" +

        "</div>" +

        "</div>" +

        '<h3 class="sub-title">' +
        "🏅 Homme du match officiel" +
        "</h3>" +

        '<div id="officialMOTMBox" class="favorite-box">' +

        (
            motm
                ? "🏅 " + escapeHTML(motm)
                : "⏳ Recherche de l'homme du match officiel..."
        ) +

        "</div>" +

        '<h3 class="sub-title">' +
        "Mon avis" +
        "</h3>" +

        '<div class="form-group">' +

        "<label>Note du match /10</label>" +

        '<input id="rating" ' +
        'class="form-input" ' +
        'type="number" ' +
        'min="0" ' +
        'max="10" ' +
        'step="0.1" ' +
        'value="' +
        escapeHTML(rating) +
        '">' +

        "</div>" +

        '<div class="form-group">' +

        "<label>Qualité du match</label>" +

        '<select id="quality" class="form-select">' +

        '<option value="exceptionnel"' +
        (
            quality === "exceptionnel"
                ? " selected"
                : ""
        ) +
        ">🔥 Exceptionnel</option>" +

        '<option value="très bon"' +
        (
            quality === "très bon"
                ? " selected"
                : ""
        ) +
        ">⭐ Très bon</option>" +

        '<option value="moyen"' +
        (
            quality === "moyen"
                ? " selected"
                : ""
        ) +
        ">😐 Moyen</option>" +

        '<option value="mauvais"' +
        (
            quality === "mauvais"
                ? " selected"
                : ""
        ) +
        ">👎 Mauvais</option>" +

        "</select>" +

        "</div>" +

        '<div class="form-group">' +

        "<label>Commentaire</label>" +

        '<textarea id="comment" ' +
        'class="form-textarea" ' +
        'placeholder="Ton avis sur le match...">' +

        escapeHTML(comment) +

        "</textarea>" +

        "</div>" +

        '<button class="primary-btn" ' +
        'onclick="saveMatch(' +
        match.id +
        ')">' +

        "💾 Enregistrer" +

        "</button>";

    const modal =
        document.getElementById(
            "matchModal"
        );

    if (modal) {
        modal.classList.add("show");
    }

    /*
     * CORRECTION :
     *
     * On tente d'abord de récupérer
     * les joueurs réellement présents
     * dans le match.
     *
     * Si l'API ne les fournit pas,
     * on utilise ensuite l'effectif
     * de l'équipe.
     */

    loadPlayersForMatch(
        match,
        favorite
    );

    loadOfficialMOTM(match);

    updateGoalsPreview(match);

    const progressSelect =
        document.getElementById(
            "watchProgress"
        );

    if (progressSelect) {

        progressSelect.addEventListener(
            "change",
            function () {

                updateGoalsPreview(
                    match
                );
            }
        );
    }
}

/* =========================================================
   CHARGEMENT DES JOUEURS
   VERSION CORRIGÉE
   ========================================================= */

async function loadPlayersForMatch(
    match,
    selectedPlayer
) {

    const container =
        document.getElementById(
            "playerChoices"
        );

    if (!container) {
        return;
    }

    try {

        let players = [];

        /*
         * ÉTAPE 1
         * On récupère directement les joueurs
         * associés au match.
         *
         * C'est beaucoup plus fiable pour
         * un match précis.
         */

        try {

            const fixtureData =
                await apiRequest(
                    "/fixtures/players?fixture=" +
                    match.id
                );

            const teams =
                fixtureData.response || [];

            teams.forEach(function (teamData) {

                const teamPlayers =
                    teamData.players || [];

                teamPlayers.forEach(function (item) {

                    if (
                        item &&
                        item.player
                    ) {

                        players.push({

                            id:
                                item.player.id,

                            name:
                                item.player.name,

                            team:
                                teamData.team &&
                                teamData.team.name
                                    ? teamData.team.name
                                    : "Équipe",

                            photo:
                                item.player.photo

                        });
                    }
                });
            });

        } catch (fixtureError) {

            console.warn(
                "Impossible de récupérer les joueurs du match. Fallback effectifs.",
                fixtureError
            );
        }

        /*
         * ÉTAPE 2
         *
         * Si aucun joueur n'a été récupéré
         * avec /fixtures/players, on utilise
         * /players?team=...
         */

        if (!players.length) {

            const requests = [];

            if (
                match.homeId &&
                match.season
            ) {

                requests.push(
                    apiRequest(
                        "/players?team=" +
                        match.homeId +
                        "&season=" +
                        match.season
                    )
                );

            }

            if (
                match.awayId &&
                match.season
            ) {

                requests.push(
                    apiRequest(
                        "/players?team=" +
                        match.awayId +
                        "&season=" +
                        match.season
                    )
                );
            }

            const results =
                await Promise.allSettled(
                    requests
                );

            results.forEach(function (result, index) {

                if (
                    result.status !==
                    "fulfilled"
                ) {
                    return;
                }

                const data =
                    result.value;

                const response =
                    data.response || [];

                const teamName =
                    index === 0
                        ? match.home
                        : match.away;

                response.forEach(function (item) {

                    if (
                        item &&
                        item.player
                    ) {

                        players.push({

                            id:
                                item.player.id,

                            name:
                                item.player.name,

                            team:
                                teamName,

                            photo:
                                item.player.photo

                        });
                    }
                });
            });
        }

        /*
         * ÉTAPE 3
         * Supprimer uniquement les doublons
         * de joueurs.
         */

        const uniquePlayers = [];

        const ids =
            new Set();

        players.forEach(function (player) {

            const playerId =
                player.id ||
                player.name;

            if (
                !ids.has(playerId)
            ) {

                ids.add(playerId);

                uniquePlayers.push(
                    player
                );
            }
        });

        uniquePlayers.sort(function (a, b) {

            return a.name.localeCompare(
                b.name,
                "fr"
            );
        });

        /*
         * IMPORTANT :
         * Si l'API ne donne aucun joueur,
         * on ne bloque pas l'enregistrement
         * du match.
         */

        if (!uniquePlayers.length) {

            container.innerHTML =

                '<div class="empty">' +

                "⚠️ Les joueurs ne sont pas disponibles pour ce match." +

                "<br><br>" +

                "Le reste du match fonctionne normalement. " +

                "Tu peux quand même enregistrer ton match." +

                "</div>";

            return;
        }

        container.innerHTML =
            uniquePlayers
                .map(function (player) {

                    const selected =
                        selectedPlayer ===
                        player.name;

                    return (

                        '<button type="button" ' +

                        'class="player-choice ' +
                        (
                            selected
                                ? "selected"
                                : ""
                        ) +
                        '" ' +

                        'data-player="' +
                        escapeHTML(
                            player.name
                        ) +
                        '" ' +

                        'onclick="selectPlayer(this)">' +

                        "⚽ " +

                        escapeHTML(
                            player.name
                        ) +

                        '<small style="margin-left:auto;color:#7f899a">' +

                        escapeHTML(
                            player.team
                        ) +

                        "</small>" +

                        "</button>"
                    );

                })
                .join("");

    } catch (error) {

        console.error(
            "Erreur complète chargement joueurs :",
            error
        );

        /*
         * IMPORTANT :
         * On n'empêche plus l'utilisateur
         * d'utiliser le reste de la fiche.
         */

        container.innerHTML =

            '<div class="empty">' +

            "⚠️ Les joueurs ne sont pas disponibles pour ce match." +

            "<br><br>" +

            "Tu peux quand même enregistrer le match et toutes ses données." +

            "</div>";
    }
}

/* =========================================================
   CHOISIR JOUEUR
   ========================================================= */

function selectPlayer(button) {

    document
        .querySelectorAll(
            ".player-choice"
        )
        .forEach(function (item) {

            item.classList.remove(
                "selected"
            );
        });

    button.classList.add(
        "selected"
    );
}

/* =========================================================
   ÉVÉNEMENTS
   ========================================================= */

async function getMatchEvents(fixtureId) {

    const data =
        await apiRequest(
            "/fixtures/events?fixture=" +
            fixtureId
        );

    return data.response || [];
}

/* =========================================================
   VÉRIFIER BUT
   ========================================================= */

function isGoalEvent(event) {

    if (!event) {
        return false;
    }

    if (event.type !== "Goal") {
        return false;
    }

    if (
        event.detail === "Missed Penalty" ||
        event.detail === "Penalty Shootout"
    ) {
        return false;
    }

    return true;
}

/* =========================================================
   MINUTE RÉELLE
   ========================================================= */

function getEventMinute(event) {

    if (
        !event ||
        !event.time
    ) {
        return 0;
    }

    const elapsed =
        Number(
            event.time.elapsed
        ) || 0;

    const extra =
        Number(
            event.time.extra
        ) || 0;

    return (
        elapsed +
        extra
    );
}

/* =========================================================
   CALCUL BUTS VUS
   ========================================================= */

function calculateGoalsSeen(
    events,
    maxMinute
) {

    let goals = 0;

    events.forEach(function (event) {

        if (!isGoalEvent(event)) {
            return;
        }

        const minute =
            getEventMinute(event);

        if (
            minute <=
            Number(maxMinute)
        ) {
            goals++;
        }
    });

    return goals;
}

/* =========================================================
   APERÇU BUTS
   ========================================================= */

async function updateGoalsPreview(match) {

    const preview =
        document.getElementById(
            "goalsPreview"
        );

    const select =
        document.getElementById(
            "watchProgress"
        );

    if (
        !preview ||
        !select
    ) {
        return;
    }

    const progress =
        Number(
            select.value
        );

    preview.innerHTML =
        "⏳ Calcul des buts vus...";

    try {

        const events =
            await getMatchEvents(
                match.id
            );

        const goals =
            calculateGoalsSeen(
                events,
                progress
            );

        preview.innerHTML =

            "⚽ Buts vus jusqu'à " +

            "<strong>" +

            escapeHTML(
                getWatchProgressLabel(
                    progress
                )
            ) +

            "</strong> : " +

            "<strong>" +

            goals +

            "</strong>";

    } catch (error) {

        console.error(
            "Erreur calcul buts :",
            error
        );

        preview.innerHTML =
            "⚠️ Impossible de calculer les buts vus pour le moment.";
    }
}

/* =========================================================
   HOMME DU MATCH OFFICIEL
   ========================================================= */

async function loadOfficialMOTM(match) {

    const box =
        document.getElementById(
            "officialMOTMBox"
        );

    if (!box) {
        return;
    }

    if (officialMOTM[match.id]) {

        box.innerHTML =
            "🏅 Homme du match officiel : <strong>" +
            escapeHTML(
                officialMOTM[match.id]
            ) +
            "</strong>";

        return;
    }

    try {

        const data =
            await apiRequest(
                "/fixtures/players?fixture=" +
                match.id
            );

        const response =
            data.response || [];

        let bestPlayer = null;
        let bestRating = -1;

        response.forEach(function (teamData) {

            const players =
                teamData.players || [];

            players.forEach(function (item) {

                if (
                    !item ||
                    !item.player
                ) {
                    return;
                }

                const rating =
                    item.statistics &&
                    item.statistics[0] &&
                    item.statistics[0].games &&
                    item.statistics[0].games.rating
                        ? Number(
                            item.statistics[0].games.rating
                        )
                        : 0;

                if (
                    rating >
                    bestRating
                ) {

                    bestRating =
                        rating;

                    bestPlayer =
                        item.player.name;
                }
            });
        });

        if (bestPlayer) {

            officialMOTM[match.id] =
                bestPlayer;

            saveData();

            box.innerHTML =
                "🏅 Homme du match officiel : " +
                "<strong>" +
                escapeHTML(bestPlayer) +
                "</strong>";

        } else {

            box.innerHTML =
                "🏅 Homme du match officiel : non disponible.";
        }

    } catch (error) {

        console.error(
            "Erreur homme du match :",
            error
        );

        box.innerHTML =
            "🏅 Homme du match officiel : non disponible pour ce match.";
    }
}

/* =========================================================
   SAUVEGARDER MATCH
   ========================================================= */

async function saveMatch(id) {

    const ratingInput =
        document.getElementById(
            "rating"
        );

    const qualityInput =
        document.getElementById(
            "quality"
        );

    const commentInput =
        document.getElementById(
            "comment"
        );

    const progressInput =
        document.getElementById(
            "watchProgress"
        );

    const selectedPlayer =
        document.querySelector(
            ".player-choice.selected"
        );

    if (
        !ratingInput ||
        !qualityInput ||
        !commentInput ||
        !progressInput
    ) {
        return;
    }

    const rating =
        parseFloat(
            ratingInput.value
        );

    if (
        isNaN(rating) ||
        rating < 0 ||
        rating > 10
    ) {

        alert(
            "Entre une note entre 0 et 10."
        );

        return;
    }

    const favorite =
        selectedPlayer
            ? selectedPlayer.dataset.player
            : (
                favoritePlayers[id] ||
                watchedMatches[id]?.favoritePlayer ||
                ""
            );

    const watchProgress =
        Number(
            progressInput.value
        );

    const match =
        findMatchById(id);

    if (!match) {
        return;
    }

    /*
     * On conserve les buts existants
     * si l'API ne répond pas.
     */

    let goalsSeen = 0;

    try {

        const events =
            await getMatchEvents(id);

        goalsSeen =
            calculateGoalsSeen(
                events,
                watchProgress
            );

    } catch (error) {

        console.error(
            "Impossible de récupérer les buts :",
            error
        );

        goalsSeen =
            watchedMatches[id] &&
            watchedMatches[id].goalsSeen !== undefined
                ? watchedMatches[id].goalsSeen
                : 0;
    }

    if (favorite) {

        favoritePlayers[id] =
            favorite;

    } else if (
        !favoritePlayers[id]
    ) {

        /*
         * On ne supprime PAS un ancien
         * joueur préféré.
         */
    }

    /*
     * =====================================================
     * BARRIÈRE DE PROTECTION DES DONNÉES
     * =====================================================
     *
     * On crée une copie complète du match.
     *
     * Cette copie reste dans LocalStorage.
     *
     * Même si l'API ne renvoie plus le match
     * plusieurs jours plus tard, l'historique
     * possède toujours les informations.
     */

    const matchData = {

        id:
            match.id,

        date:
            match.date,

        status:
            match.status,

        competition:
            match.competition,

        leagueId:
            match.leagueId,

        season:
            match.season,

        country:
            match.country,

        leagueLogo:
            match.leagueLogo,

        home:
            match.home,

        away:
            match.away,

        homeId:
            match.homeId,

        awayId:
            match.awayId,

        homeLogo:
            match.homeLogo,

        awayLogo:
            match.awayLogo,

        homeScore:
            match.homeScore,

        awayScore:
            match.awayScore,

        stadium:
            match.stadium
    };

    /*
     * =====================================================
     * CONSERVATION DES ANCIENNES DONNÉES
     * =====================================================
     */

    const oldData =
        watchedMatches[id] || {};

    watchedMatches[id] = {

        /*
         * On conserve toutes les anciennes
         * propriétés éventuelles.
         */

        ...oldData,

        matchId:
            id,

        /*
         * Nouvelle copie permanente.
         */

        matchData:
            matchData,

        rating:
            rating,

        favoritePlayer:
            favorite,

        officialMOTM:
            officialMOTM[id] ||
            oldData.officialMOTM ||
            "",

        quality:
            qualityInput.value,

        comment:
            commentInput.value,

        watchProgress:
            watchProgress,

        goalsSeen:
            goalsSeen,

        watchedAt:
            oldData.watchedAt ||
            new Date().toISOString()
    };

    /*
     * IMPORTANT :
     *
     * On ne remplace jamais tout le
     * LocalStorage par les matchs API.
     *
     * Les anciens matchs restent.
     */

    saveData();

    closeModal();

    renderCurrentCompetition();
    renderHistory();
    renderStats();
    renderAwards();
}

/* =========================================================
   RENDRE MATCHS ACTUELS
   ========================================================= */

function renderCurrentCompetition() {

    if (
        selectedCompetition ===
        null
    ) {

        renderCompetitions();

        return;
    }

    openCompetition(
        selectedCompetition
    );
}

/* =========================================================
   MODAL
   ========================================================= */

function closeModal() {

    const modal =
        document.getElementById(
            "matchModal"
        );

    if (modal) {
        modal.classList.remove("show");
    }
}

const closeModalButton =
    document.getElementById(
        "closeModal"
    );

if (closeModalButton) {

    closeModalButton.addEventListener(
        "click",
        closeModal
    );
}

const matchModal =
    document.getElementById(
        "matchModal"
    );

if (matchModal) {

    matchModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target.id ===
                "matchModal"
            ) {

                closeModal();
            }
        }
    );
}

/* =========================================================
   NAVIGATION
   ========================================================= */

document
    .querySelectorAll(".nav-btn")
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const page =
                    button.dataset.page;

                document
                    .querySelectorAll(".page")
                    .forEach(
                        function (section) {

                            section.classList.remove(
                                "active"
                            );
                        }
                    );

                const target =
                    document.getElementById(
                        page
                    );

                if (target) {

                    target.classList.add(
                        "active"
                    );
                }

                document
                    .querySelectorAll(".nav-btn")
                    .forEach(
                        function (btn) {

                            btn.classList.remove(
                                "active"
                            );
                        }
                    );

                button.classList.add(
                    "active"
                );

                if (page === "history") {
                    renderHistory();
                }

                if (page === "stats") {
                    renderStats();
                }

                if (page === "awards") {
                    renderAwards();
                }
            }
        );
    });

/* =========================================================
   JOUR PRÉCÉDENT
   ========================================================= */

const previousDay =
    document.getElementById(
        "previousDay"
    );

if (previousDay) {

    previousDay.addEventListener(
        "click",
        function () {

            selectedDate.setDate(
                selectedDate.getDate() - 1
            );

            updateSelectedDateDisplay();
            loadMatches();
        }
    );
}

/* =========================================================
   JOUR SUIVANT
   ========================================================= */

const nextDay =
    document.getElementById(
        "nextDay"
    );

if (nextDay) {

    nextDay.addEventListener(
        "click",
        function () {

            selectedDate.setDate(
                selectedDate.getDate() + 1
            );

            updateSelectedDateDisplay();
            loadMatches();
        }
    );
}

/* =========================================================
   ACTUALISER
   ========================================================= */

const refreshBtn =
    document.getElementById(
        "refreshBtn"
    );

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        function () {

            loadMatches();
        }
    );
}

/* =========================================================
   CONSTRUIRE CARTE HISTORIQUE
   ========================================================= */

function createHistoryCard(item) {

    const match =
        findMatchById(
            item.matchId
        );

    const savedMatch =
        item.matchData || {};

    const home =
        match
            ? match.home
            : savedMatch.home || "Match";

    const away =
        match
            ? match.away
            : savedMatch.away || "";

    const competition =
        match
            ? match.competition
            : savedMatch.competition ||
              "Compétition inconnue";

    const favorite =
        item.favoritePlayer ||
        favoritePlayers[item.matchId] ||
        "Aucun joueur sélectionné";

    const comment =
        item.comment || "";

    return (

        '<div class="history-card">' +

        '<div class="history-main">' +

        "<strong>" +

        escapeHTML(
            home +
            (
                away
                    ? " - " + away
                    : ""
            )
        ) +

        "</strong>" +

        "<span>" +

        escapeHTML(
            competition
        ) +

        "</span>" +

        "<span>" +

        "⭐ " +

        escapeHTML(
            favorite
        ) +

        "</span>" +

        (
            item.officialMOTM

                ? "<span>🏅 Homme du match : " +
                  escapeHTML(
                      item.officialMOTM
                  ) +
                  "</span>"

                : ""
        ) +

        (
            item.watchProgress

                ? "<span>⏱️ Vu jusqu'à " +
                  escapeHTML(
                      getWatchProgressLabel(
                          item.watchProgress
                      )
                  ) +
                  "</span>"

                : ""
        ) +

        (
            item.goalsSeen !== undefined

                ? "<span>⚽ " +
                  item.goalsSeen +
                  " but(s) vu(s)</span>"

                : ""
        ) +

        (
            comment

                ? '<p class="history-comment">' +
                  escapeHTML(comment) +
                  "</p>"

                : ""
        ) +

        "</div>" +

        '<div class="rating">' +

        "⭐ " +

        Number(
            item.rating || 0
        ).toFixed(1) +

        "/10" +

        "</div>" +

        "</div>"
    );
}

/* =========================================================
   HISTORIQUE
   ========================================================= */

function renderHistory() {

    const container =
        document.getElementById(
            "historyContainer"
        );

    if (!container) {
        return;
    }

    const saved =
        Object.values(
            watchedMatches
        );

    if (!saved.length) {

        container.innerHTML =
            '<div class="empty">' +
            "Aucun match enregistré." +
            "</div>";

        return;
    }

    container.innerHTML =
        saved
            .sort(function (a, b) {

                return (
                    new Date(
                        b.watchedAt || 0
                    ) -
                    new Date(
                        a.watchedAt || 0
                    )
                );
            })
            .map(function (item) {

                return createHistoryCard(
                    item
                );

            })
            .join("");
}

/* =========================================================
   STATISTIQUES
   ========================================================= */

function renderStats() {

    const saved =
        Object.values(
            watchedMatches
        );

    const statsContainer =
        document.getElementById(
            "statsContainer"
        );

    if (!statsContainer) {
        return;
    }

    if (!saved.length) {

        statsContainer.innerHTML =
            '<div class="empty">' +
            "Regarde et note des matchs pour voir tes statistiques." +
            "</div>";

        const competitionStats =
            document.getElementById(
                "competitionStats"
            );

        const monthlyStats =
            document.getElementById(
                "monthlyStats"
            );

        const seasonStats =
            document.getElementById(
                "seasonStats"
            );

        if (competitionStats) {
            competitionStats.innerHTML = "";
        }

        if (monthlyStats) {
            monthlyStats.innerHTML = "";
        }

        if (seasonStats) {
            seasonStats.innerHTML = "";
        }

        return;
    }

    const ratings =
        saved.map(function (item) {

            return Number(
                item.rating
            ) || 0;

        });

    const totalRatings =
        ratings.reduce(
            function (a, b) {
                return a + b;
            },
            0
        );

    const average =
        totalRatings /
        ratings.length;

    const best =
        Math.max(...ratings);

    const worst =
        Math.min(...ratings);

    let totalGoals = 0;

    saved.forEach(function (item) {

        if (
            item.goalsSeen !== undefined
        ) {

            totalGoals +=
                Number(
                    item.goalsSeen
                ) || 0;
        }
    });

    statsContainer.innerHTML =

        '<div class="stat-grid">' +

        createStat(
            saved.length,
            "Matchs vus"
        ) +

        createStat(
            average.toFixed(1),
            "Moyenne de mes notes"
        ) +

        createStat(
            best.toFixed(1),
            "⭐ Meilleure note"
        ) +

        createStat(
            worst.toFixed(1),
            "😬 Pire note"
        ) +

        createStat(
            totalGoals,
            "⚽ Buts vus"
        ) +

        "</div>";

    renderCompetitionStats(saved);
    renderMonthlyStats(saved);
    renderSeasonStats(saved);
}

/* =========================================================
   CRÉER STAT
   ========================================================= */

function createStat(number, label) {

    return (

        '<div class="stat-card">' +

        '<div class="number">' +

        escapeHTML(number) +

        "</div>" +

        '<div class="label">' +

        escapeHTML(label) +

        "</div>" +

        "</div>"
    );
}

/* =========================================================
   STATS COMPÉTITIONS
   ========================================================= */

function renderCompetitionStats(saved) {

    const container =
        document.getElementById(
            "competitionStats"
        );

    if (!container) {
        return;
    }

    const groups = {};

    saved.forEach(function (item) {

        const match =
            findMatchById(
                item.matchId
            );

        const savedMatch =
            item.matchData || {};

        const name =
            match
                ? match.competition
                : savedMatch.competition ||
                  "Compétition inconnue";

        if (!groups[name]) {

            groups[name] = {
                count: 0,
                total: 0
            };
        }

        groups[name].count++;

        groups[name].total +=
            Number(
                item.rating
            ) || 0;
    });

    const entries =
        Object.entries(groups);

    if (!entries.length) {

        container.innerHTML =
            '<div class="empty">' +
            "Pas encore de données." +
            "</div>";

        return;
    }

    container.innerHTML =
        entries
            .sort(function (a, b) {

                return (
                    b[1].count -
                    a[1].count
                );
            })
            .map(function ([name, data]) {

                return (

                    '<div class="competition-stat">' +

                    "<strong>" +
                    escapeHTML(name) +
                    "</strong>" +

                    '<div class="stat-line">' +

                    "<span>Matchs vus</span>" +

                    "<strong>" +
                    data.count +
                    "</strong>" +

                    "</div>" +

                    '<div class="stat-line">' +

                    "<span>Moyenne</span>" +

                    "<strong>" +

                    (
                        data.total /
                        data.count
                    ).toFixed(1) +

                    "/10</strong>" +

                    "</div>" +

                    "</div>"
                );
            })
            .join("");
}

/* =========================================================
   STATS MOIS
   ========================================================= */

function renderMonthlyStats(saved) {

    const container =
        document.getElementById(
            "monthlyStats"
        );

    if (!container) {
        return;
    }

    const groups = {};

    saved.forEach(function (item) {

        if (!item.watchedAt) {
            return;
        }

        const date =
            new Date(
                item.watchedAt
            );

        const key =
            date.toLocaleDateString(
                "fr-FR",
                {
                    month: "long",
                    year: "numeric"
                }
            );

        if (!groups[key]) {
            groups[key] = 0;
        }

        groups[key]++;
    });

    container.innerHTML =
        Object.entries(groups)
            .map(function ([month, count]) {

                return (

                    '<div class="month-stat">' +

                    escapeHTML(month) +

                    " : " +

                    "<strong>" +

                    count +

                    " match(s)</strong>" +

                    "</div>"
                );
            })
            .join("");
}

/* =========================================================
   STATS SAISONS
   ========================================================= */

function renderSeasonStats(saved) {

    const container =
        document.getElementById(
            "seasonStats"
        );

    if (!container) {
        return;
    }

    const groups = {};

    saved.forEach(function (item) {

        const match =
            findMatchById(
                item.matchId
            );

        const savedMatch =
            item.matchData || {};

        const season =
            match
                ? match.season
                : savedMatch.season ||
                  "Inconnue";

        if (!groups[season]) {
            groups[season] = 0;
        }

        groups[season]++;
    });

    container.innerHTML =
        Object.entries(groups)
            .map(function ([season, count]) {

                return (

                    '<div class="season-stat">' +

                    "Saison " +

                    escapeHTML(season) +

                    " : " +

                    "<strong>" +

                    count +

                    " match(s)</strong>" +

                    "</div>"
                );
            })
            .join("");
}

/* =========================================================
   PALMARÈS
   ========================================================= */

function renderAwards() {

    const container =
        document.getElementById(
            "awardsContainer"
        );

    if (!container) {
        return;
    }

    const saved =
        Object.values(
            watchedMatches
        );

    if (!saved.length) {

        container.innerHTML =
            '<div class="empty">' +
            "Ton palmarès apparaîtra ici après tes premiers matchs." +
            "</div>";

    } else {

        const ratings =
            saved.map(function (item) {

                return Number(
                    item.rating
                ) || 0;

            });

        const average =
            ratings.reduce(
                function (a, b) {
                    return a + b;
                },
                0
            ) /
            ratings.length;

        const totalGoals =
            saved.reduce(
                function (total, item) {

                    return (
                        total +
                        Number(
                            item.goalsSeen || 0
                        )
                    );

                },
                0
            );

        container.innerHTML =

            '<div class="award-card">' +

            "🏆 Matchs regardés : " +

            "<strong>" +

            saved.length +

            "</strong>" +

            "</div>" +

            '<div class="award-card">' +

            "⭐ Meilleure note : " +

            "<strong>" +

            Math.max(
                ...ratings
            ).toFixed(1) +

            "/10</strong>" +

            "</div>" +

            '<div class="award-card">' +

            "📊 Moyenne générale : " +

            "<strong>" +

            average.toFixed(1) +

            "/10</strong>" +

            "</div>" +

            '<div class="award-card">' +

            "⚽ Buts réellement vus : " +

            "<strong>" +

            totalGoals +

            "</strong>" +

            "</div>";
    }

    renderPlayersRanking();
}

/* =========================================================
   JOUEURS PRÉFÉRÉS
   ========================================================= */

function renderPlayersRanking() {

    const container =
        document.getElementById(
            "playersRanking"
        );

    if (!container) {
        return;
    }

    const counts = {};

    Object.values(
        watchedMatches
    ).forEach(function (item) {

        const player =
            item.favoritePlayer ||
            favoritePlayers[item.matchId];

        if (player) {

            counts[player] =
                (
                    counts[player] || 0
                ) + 1;
        }
    });

    const players =
        Object.entries(counts)
            .sort(function (a, b) {

                return b[1] - a[1];

            });

    if (!players.length) {

        container.innerHTML =
            '<div class="empty">' +
            "Tu n'as pas encore choisi de joueur préféré." +
            "</div>";

        return;
    }

    container.innerHTML =
        players
            .map(function ([player, count], index) {

                return (

                    '<div class="player-card">' +

                    '<div class="player-number">' +
                    (index + 1) +
                    "</div>" +

                    '<div class="player-info">' +

                    "<strong>" +
                    escapeHTML(player) +
                    "</strong>" +

                    "<span>" +

                    count +

                    (
                        count > 1
                            ? " sélections"
                            : " sélection"
                    ) +

                    "</span>" +

                    "</div>" +

                    "</div>"
                );
            })
            .join("");
}

/* =========================================================
   RECHERCHE HISTORIQUE
   ========================================================= */

const searchInput =
    document.getElementById(
        "searchInput"
    );

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            const query =
                searchInput.value
                    .trim()
                    .toLowerCase();

            const container =
                document.getElementById(
                    "historyContainer"
                );

            if (!container) {
                return;
            }

            const saved =
                Object.values(
                    watchedMatches
                );

            const filtered =
                saved.filter(
                    function (item) {

                        const match =
                            findMatchById(
                                item.matchId
                            );

                        const savedMatch =
                            item.matchData ||
                            {};

                        const text = [

                            item.comment,

                            item.favoritePlayer,

                            favoritePlayers[
                                item.matchId
                            ],

                            item.officialMOTM,

                            match
                                ? match.home
                                : savedMatch.home,

                            match
                                ? match.away
                                : savedMatch.away,

                            match
                                ? match.competition
                                : savedMatch.competition

                        ]
                            .join(" ")
                            .toLowerCase();

                        return text.includes(
                            query
                        );
                    }
                );

            if (!filtered.length) {

                container.innerHTML =
                    '<div class="empty">' +
                    "Aucun résultat." +
                    "</div>";

                return;
            }

            container.innerHTML =
                filtered
                    .sort(function (a, b) {

                        return (
                            new Date(
                                b.watchedAt || 0
                            ) -
                            new Date(
                                a.watchedAt || 0
                            )
                        );

                    })
                    .map(function (item) {

                        return createHistoryCard(
                            item
                        );

                    })
                    .join("");
        }
    );
}

/* =========================================================
   INITIALISATION
   ========================================================= */

updateSelectedDateDisplay();

renderHistory();

renderStats();

renderAwards();

loadMatches();
