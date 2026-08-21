/* =========================================================
   FOOTSCOPE
   VERSION CORRIGÉE
   - Historique persistant
   - Score sauvegardé
   - Buts vus corrigés
   - Matchs notés accessibles depuis les statistiques
   - Compatibilité avec les anciennes données
========================================================= */

/* =========================================================
   🔴 TA CLÉ API
========================================================= */

const API_KEY = "25fd0757eec89ba850a53745eab92ab7";

/* =========================================================
   API
========================================================= */

const API_URL = "https://v3.football.api-sports.io";

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
    "Conference League": { id: 848, country: "Europe" }
};

/* =========================================================
   DONNÉES
========================================================= */

let matches = [];
let allMatches = [];
let watchedMatches = {};
let favoritePlayers = {};
let officialManOfTheMatch = {};

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

    officialManOfTheMatch =
        JSON.parse(
            localStorage.getItem("footScopeOfficialManOfTheMatch")
        ) || {};

} catch (error) {
    watchedMatches = {};
    favoritePlayers = {};
    officialManOfTheMatch = {};
}

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
        "footScopeOfficialManOfTheMatch",
        JSON.stringify(officialManOfTheMatch)
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
    const year = date.getFullYear();

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(date.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
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
            getDateString(selectedDate)
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
                    "x-apisports-key": API_KEY,
                    "Accept": "application/json"
                }
            }
        );

    if (!response.ok) {
        throw new Error(
            "HTTP " + response.status
        );
    }

    const data =
        await response.json();

    if (
        data.errors &&
        Object.keys(data.errors).length > 0
    ) {
        throw new Error(
            JSON.stringify(data.errors)
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
        API_KEY ===
        "COLLE_TA_NOUVELLE_CLE_API_ICI"
    ) {
        showApiStatus(
            "⚠️ Mets ta clé API dans script.js.",
            "error"
        );
        return;
    }

    const date =
        getDateString(selectedDate);

    selectedCompetition = null;

    const competitionMatches =
        document.getElementById(
            "competitionMatches"
        );

    if (competitionMatches) {
        competitionMatches.classList.add(
            "hidden"
        );
    }

    const competitionsContainer =
        document.getElementById(
            "competitionsContainer"
        );

    if (competitionsContainer) {
        competitionsContainer.style.display =
            "grid";
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
                "/fixtures?date=" + date
            );

        allMatches = [];

        const fixtures =
            data.response || [];

        fixtures.forEach(
            function (fixture) {

                const normalized =
                    normalizeFixture(
                        fixture
                    );

                if (normalized) {
                    allMatches.push(
                        normalized
                    );
                }
            }
        );

        matches =
            allMatches.slice();

        matches.sort(
            function (a, b) {
                return (
                    new Date(a.date) -
                    new Date(b.date)
                );
            }
        );

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

        let message =
            "❌ Impossible de charger les matchs.";

        if (
            error.message &&
            error.message.includes(
                "Free plans"
            )
        ) {
            message =
                "⚠️ Cette date n'est pas accessible avec ton plan API-Football Free.";
        }

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
        Object.values(LEAGUES).some(
            function (league) {
                return league.id === leagueId;
            }
        );

    if (!leagueExists) {
        return null;
    }

    return {
        id: fixture.fixture.id,

        date: fixture.fixture.date,

        status: fixture.fixture.status,

        competition: fixture.league.name,

        leagueId: fixture.league.id,

        season: fixture.league.season,

        country: fixture.league.country,

        leagueLogo: fixture.league.logo,

        home: fixture.teams.home.name,

        away: fixture.teams.away.name,

        homeId: fixture.teams.home.id,

        awayId: fixture.teams.away.id,

        homeLogo: fixture.teams.home.logo,

        awayLogo: fixture.teams.away.logo,

        homeScore: fixture.goals.home,

        awayScore: fixture.goals.away,

        stadium:
            fixture.fixture.venue &&
            fixture.fixture.venue.name
                ? fixture.fixture.venue.name
                : "Stade non renseigné"
    };
}

/* =========================================================
   CRÉER UN SNAPSHOT DU MATCH
   IMPORTANT POUR L'HISTORIQUE
========================================================= */

function createMatchSnapshot(match) {

    if (!match) {
        return null;
    }

    return {
        id: match.id,
        date: match.date,
        status: match.status
            ? {
                short: match.status.short || "",
                long: match.status.long || ""
            }
            : {},
        competition: match.competition || "",
        leagueId: match.leagueId || null,
        season: match.season || null,
        country: match.country || "",
        leagueLogo: match.leagueLogo || "",

        home: match.home || "",
        away: match.away || "",

        homeId: match.homeId || null,
        awayId: match.awayId || null,

        homeLogo: match.homeLogo || "",
        awayLogo: match.awayLogo || "",

        homeScore:
            match.homeScore !== undefined
                ? match.homeScore
                : null,

        awayScore:
            match.awayScore !== undefined
                ? match.awayScore
                : null,

        stadium:
            match.stadium ||
            "Stade non renseigné"
    };
}

/* =========================================================
   RÉCUPÉRER UN MATCH DEPUIS L'HISTORIQUE
========================================================= */

function getSavedMatch(item) {

    if (!item) {
        return null;
    }

    /*
       Si le nouveau système a sauvegardé
       toutes les informations du match.
    */

    if (item.matchData) {
        return item.matchData;
    }

    /*
       Compatibilité avec les anciennes données :
       si le match est encore dans allMatches,
       on peut récupérer ses informations.
    */

    const current =
        allMatches.find(
            function (match) {
                return (
                    match.id ===
                    item.matchId
                );
            }
        );

    if (current) {
        return current;
    }

    return null;
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

    container.style.display =
        "grid";

    const competitionMatches =
        document.getElementById(
            "competitionMatches"
        );

    if (competitionMatches) {
        competitionMatches.classList.add(
            "hidden"
        );
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

    allMatches.forEach(
        function (match) {

            if (!groups[match.leagueId]) {

                groups[match.leagueId] = {
                    name: match.competition,
                    country: match.country,
                    logo: match.leagueLogo,
                    matches: []
                };
            }

            groups[
                match.leagueId
            ].matches.push(
                match
            );
        }
    );

    const competitions =
        Object.values(groups);

    container.innerHTML =
        competitions
            .map(
                function (competition) {
                    return createCompetitionCard(
                        competition
                    );
                }
            )
            .join("");
}

/* =========================================================
   CARTE COMPÉTITION
========================================================= */

function createCompetitionCard(
    competition
) {

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

    document
        .getElementById(
            "competitionsContainer"
        )
        .style.display =
        "none";

    document
        .getElementById(
            "competitionMatches"
        )
        .classList.remove(
            "hidden"
        );

    document
        .getElementById(
            "selectedCompetitionTitle"
        )
        .textContent =
        "🏆 " +
        competition.competition;

    const container =
        document.getElementById(
            "matchesContainer"
        );

    container.innerHTML =
        competitionMatches
            .map(
                function (match) {
                    return createMatchCard(
                        match
                    );
                }
            )
            .join("");
}

/* =========================================================
   RETOUR AUX COMPÉTITIONS
========================================================= */

document
    .getElementById(
        "backToCompetitions"
    )
    .addEventListener(
        "click",
        function () {

            selectedCompetition =
                null;

            document
                .getElementById(
                    "competitionMatches"
                )
                .classList.add(
                    "hidden"
                );

            document
                .getElementById(
                    "competitionsContainer"
                )
                .style.display =
                "grid";
        }
    );

/* =========================================================
   CARTE MATCH
========================================================= */

function createMatchCard(match) {

    const watched =
        watchedMatches[
            match.id
        ];

    const favorite =
        favoritePlayers[
            match.id
        ] || "";

    const official =
        officialManOfTheMatch[
            match.id
        ] || "";

    let score = "-";

    if (
        match.homeScore !== null &&
        match.homeScore !== undefined &&
        match.awayScore !== null &&
        match.awayScore !== undefined
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
            escapeHTML(
                favorite
            ) +
            "</strong>" +
            "</div>";
    }

    let officialHTML = "";

    if (official) {

        officialHTML =
            '<div class="favorite-box">' +
            "🏆 Homme du match officiel : " +
            "<strong>" +
            escapeHTML(
                official
            ) +
            "</strong>" +
            "</div>";
    }

    return (

        '<div class="match-card" ' +
        'onclick="openMatch(' +
        match.id +
        ')">' +

        '<div class="match-header">' +

        '<span class="competition">' +
        escapeHTML(
            match.competition
        ) +
        "</span>" +

        "<span>" +
        formatTime(match.date) +
        "</span>" +

        "</div>" +

        '<div class="match-teams">' +

        '<div class="team">' +

        '<div class="team-logo">' +
        '<img src="' +
        escapeHTML(
            match.homeLogo
        ) +
        '" alt="">' +
        "</div>" +

        escapeHTML(
            match.home
        ) +

        "</div>" +

        "<div>" +

        '<div class="score">' +
        score +
        "</div>" +

        '<div class="match-status">' +
        getStatusText(
            match.status
        ) +
        "</div>" +

        "</div>" +

        '<div class="team">' +

        '<div class="team-logo">' +
        '<img src="' +
        escapeHTML(
            match.awayLogo
        ) +
        '" alt="">' +
        "</div>" +

        escapeHTML(
            match.away
        ) +

        "</div>" +

        "</div>" +

        favoriteHTML +
        officialHTML +

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

    let match =
        allMatches.find(
            function (item) {
                return item.id === id;
            }
        );

    /*
       Si le match n'est plus dans allMatches,
       on le récupère depuis l'historique.
    */

    if (!match && watchedMatches[id]) {
        match =
            getSavedMatch(
                watchedMatches[id]
            );
    }

    if (!match) {
        return;
    }

    const watched =
        watchedMatches[id];

    const favorite =
        favoritePlayers[id] ||
        (
            watched
                ? watched.favoritePlayer
                : ""
        ) ||
        "";

    const official =
        officialManOfTheMatch[id] ||
        (
            watched
                ? watched.officialManOfTheMatch
                : ""
        ) ||
        "";

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

    let score = "-";

    if (
        match.homeScore !== null &&
        match.homeScore !== undefined &&
        match.awayScore !== null &&
        match.awayScore !== undefined
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

    content.innerHTML =

        '<div class="competition">' +
        escapeHTML(
            match.competition
        ) +
        "</div>" +

        '<div class="modal-teams">' +

        '<div class="modal-team">' +

        '<img src="' +
        escapeHTML(
            match.homeLogo
        ) +
        '" alt="">' +

        escapeHTML(
            match.home
        ) +

        "</div>" +

        "<div>" +

        '<div class="modal-score">' +
        score +
        "</div>" +

        '<p class="match-status">' +
        getStatusText(
            match.status
        ) +
        " • " +
        formatTime(match.date) +
        "</p>" +

        "</div>" +

        '<div class="modal-team">' +

        '<img src="' +
        escapeHTML(
            match.awayLogo
        ) +
        '" alt="">' +

        escapeHTML(
            match.away
        ) +

        "</div>" +

        "</div>" +

        '<div class="info-list">' +

        '<div class="info-row">' +

        "<span>Date</span>" +

        "<strong>" +

        formatDateFR(
            match.date.substring(
                0,
                10
            )
        ) +

        "</strong>" +

        "</div>" +

        '<div class="info-row">' +

        "<span>Stade</span>" +

        "<strong>" +

        escapeHTML(
            match.stadium
        ) +

        "</strong>" +

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
        "🏆 Homme du match officiel" +
        "</h3>" +

        '<div id="officialManOfTheMatch" class="official-motm-modal">' +

        '<div class="loading">' +
        "🔎 Recherche de l'homme du match officiel..." +
        "</div>" +

        "</div>" +

        '<h3 class="sub-title">' +
        "Mon avis" +
        "</h3>" +

        '<div class="form-group">' +

        "<label>" +
        "Note du match /10" +
        "</label>" +

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

        "<label>" +
        "Qualité du match" +
        "</label>" +

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

        "<label>" +
        "Commentaire" +
        "</label>" +

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

    document
        .getElementById(
            "matchModal"
        )
        .classList.add(
            "show"
        );

    loadPlayersForMatch(
        match,
        favorite
    );

    loadOfficialManOfTheMatch(
        match,
        official
    );
}

/* =========================================================
   JOUEURS
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

        const data =
            await apiRequest(
                "/fixtures/players?fixture=" +
                match.id
            );

        const players = [];

        const teams =
            data.response || [];

        teams.forEach(
            function (teamData) {

                if (
                    !teamData ||
                    !teamData.players
                ) {
                    return;
                }

                teamData.players.forEach(
                    function (item) {

                        if (
                            !item ||
                            !item.player
                        ) {
                            return;
                        }

                        players.push({

                            id:
                                item.player.id,

                            name:
                                item.player.name,

                            photo:
                                item.player.photo,

                            team:
                                teamData.team
                                    ? teamData.team.name
                                    : "",

                            rating:
                                item.statistics &&
                                item.statistics[0]
                                    ? item.statistics[0].games &&
                                      item.statistics[0].games.rating
                                    : null
                        });
                    }
                );
            }
        );

        const uniquePlayers = [];

        const ids = new Set();

        players.forEach(
            function (player) {

                if (
                    !ids.has(
                        player.id
                    )
                ) {

                    ids.add(
                        player.id
                    );

                    uniquePlayers.push(
                        player
                    );
                }
            }
        );

        uniquePlayers.sort(
            function (a, b) {
                return a.name.localeCompare(
                    b.name,
                    "fr"
                );
            }
        );

        if (!uniquePlayers.length) {

            container.innerHTML =
                '<div class="empty">' +
                "Aucun joueur disponible pour ce match." +
                "</div>";

            return;
        }

        container.innerHTML =
            uniquePlayers
                .map(
                    function (player) {

                        const selected =
                            selectedPlayer ===
                            player.name;

                        let ratingHTML = "";

                        if (
                            player.rating !== null &&
                            player.rating !== undefined
                        ) {

                            ratingHTML =
                                '<small style="margin-left:8px;color:#ffd54a">' +
                                "⭐ " +
                                escapeHTML(
                                    player.rating
                                ) +
                                "</small>";
                        }

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

                            ratingHTML +

                            "</button>"
                        );
                    }
                )
                .join("");

    } catch (error) {

        console.error(
            "Erreur chargement joueurs :",
            error
        );

        container.innerHTML =
            '<div class="empty">' +
            "Impossible de charger la liste des joueurs." +
            "</div>";
    }
}

/* =========================================================
   HOMME DU MATCH OFFICIEL
========================================================= */

async function loadOfficialManOfTheMatch(
    match,
    savedOfficial
) {

    const container =
        document.getElementById(
            "officialManOfTheMatch"
        );

    if (!container) {
        return;
    }

    try {

        const data =
            await apiRequest(
                "/fixtures/players?fixture=" +
                match.id
            );

        let officialPlayer = null;

        const teams =
            data.response || [];

        teams.forEach(
            function (teamData) {

                if (
                    officialPlayer ||
                    !teamData ||
                    !teamData.players
                ) {
                    return;
                }

                teamData.players.forEach(
                    function (item) {

                        if (
                            officialPlayer ||
                            !item ||
                            !item.player
                        ) {
                            return;
                        }

                        if (
                            item.player.mom === true ||
                            item.player.man_of_the_match === true ||
                            item.player.manOfTheMatch === true
                        ) {

                            officialPlayer = {

                                id:
                                    item.player.id,

                                name:
                                    item.player.name,

                                photo:
                                    item.player.photo,

                                team:
                                    teamData.team
                                        ? teamData.team.name
                                        : ""
                            };
                        }
                    }
                );
            }
        );

        if (officialPlayer) {

            officialManOfTheMatch[
                match.id
            ] =
                officialPlayer.name;

            saveData();

            container.innerHTML =

                '<div class="official-player">' +

                (
                    officialPlayer.photo
                        ? '<img src="' +
                          escapeHTML(
                              officialPlayer.photo
                          ) +
                          '" alt="">'
                        : ""
                ) +

                "<div>" +

                "<strong>" +
                "🏆 " +
                escapeHTML(
                    officialPlayer.name
                ) +
                "</strong>" +

                "<small>" +
                escapeHTML(
                    officialPlayer.team
                ) +
                "</small>" +

                "</div>" +

                "</div>";

            return;
        }

        container.innerHTML =
            '<div class="empty">' +
            "🏆 Homme du match officiel : " +
            "<strong>information non disponible</strong>" +
            "</div>";

    } catch (error) {

        console.error(
            "Erreur homme du match :",
            error
        );

        container.innerHTML =
            '<div class="empty">' +
            "🏆 Homme du match officiel : " +
            "<strong>information non disponible</strong>" +
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
        .forEach(
            function (item) {
                item.classList.remove(
                    "selected"
                );
            }
        );

    button.classList.add(
        "selected"
    );
}

/* =========================================================
   SAUVEGARDER MATCH
   IMPORTANT : sauvegarde aussi le match complet
========================================================= */

function saveMatch(id) {

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

    const selectedPlayer =
        document.querySelector(
            ".player-choice.selected"
        );

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

    /*
       On récupère le match actuel.
    */

    let match =
        allMatches.find(
            function (item) {
                return item.id === id;
            }
        );

    /*
       Si besoin, on récupère l'ancien
       snapshot déjà enregistré.
    */

    if (!match && watchedMatches[id]) {
        match =
            getSavedMatch(
                watchedMatches[id]
            );
    }

    if (!match) {
        alert(
            "Impossible de retrouver ce match."
        );
        return;
    }

    const matchSnapshot =
        createMatchSnapshot(
            match
        );

    const favorite =
        selectedPlayer
            ? selectedPlayer.dataset.player
            : "";

    if (favorite) {

        favoritePlayers[id] =
            favorite;

    } else {

        delete favoritePlayers[id];
    }

    const officialElement =
        document.querySelector(
            "#officialManOfTheMatch strong"
        );

    let official = "";

    if (officialElement) {

        official =
            officialElement.textContent
                .replace("🏆", "")
                .trim();
    }

    if (official) {

        officialManOfTheMatch[id] =
            official;
    }

    /*
       SAUVEGARDE COMPLÈTE
    */

    watchedMatches[id] = {

        matchId: id,

        /*
           NOUVEAU :
           Toutes les infos du match
           restent disponibles même
           plusieurs jours après.
        */

        matchData:
            matchSnapshot,

        rating: rating,

        favoritePlayer: favorite,

        officialManOfTheMatch:
            official,

        quality:
            qualityInput.value,

        comment:
            commentInput.value,

        watchedAt:
            watchedMatches[id] &&
            watchedMatches[id].watchedAt
                ? watchedMatches[id].watchedAt
                : new Date().toISOString()
    };

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

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "show"
    );
}

document
    .getElementById(
        "closeModal"
    )
    .addEventListener(
        "click",
        closeModal
    );

document
    .getElementById(
        "matchModal"
    )
    .addEventListener(
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

/* =========================================================
   NAVIGATION
========================================================= */

document
    .querySelectorAll(
        ".nav-btn"
    )
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const page =
                        button.dataset.page;

                    document
                        .querySelectorAll(
                            ".page"
                        )
                        .forEach(
                            function (section) {

                                section.classList.remove(
                                    "active"
                                );
                            }
                        );

                    const targetPage =
                        document.getElementById(
                            page
                        );

                    if (targetPage) {

                        targetPage.classList.add(
                            "active"
                        );
                    }

                    document
                        .querySelectorAll(
                            ".nav-btn"
                        )
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

                    if (
                        page ===
                        "history"
                    ) {
                        renderHistory();
                    }

                    if (
                        page ===
                        "stats"
                    ) {
                        renderStats();
                    }

                    if (
                        page ===
                        "awards"
                    ) {
                        renderAwards();
                    }
                }
            );
        }
    );

/* =========================================================
   DATE PRÉCÉDENTE
========================================================= */

document
    .getElementById(
        "previousDay"
    )
    .addEventListener(
        "click",
        function () {

            selectedDate.setDate(
                selectedDate.getDate() - 1
            );

            updateSelectedDateDisplay();

            loadMatches();
        }
    );

/* =========================================================
   DATE SUIVANTE
========================================================= */

document
    .getElementById(
        "nextDay"
    )
    .addEventListener(
        "click",
        function () {

            selectedDate.setDate(
                selectedDate.getDate() + 1
            );

            updateSelectedDateDisplay();

            loadMatches();
        }
    );

/* =========================================================
   ACTUALISER
========================================================= */

document
    .getElementById(
        "refreshBtn"
    )
    .addEventListener(
        "click",
        function () {
            loadMatches();
        }
    );

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

    const search =
        document.getElementById(
            "searchInput"
        );

    const searchValue =
        search
            ? search.value
                .trim()
                .toLowerCase()
            : "";

    const saved =
        Object.values(
            watchedMatches
        )
        .sort(
            function (a, b) {

                return new Date(
                    b.watchedAt || 0
                ) -
                new Date(
                    a.watchedAt || 0
                );
            }
        );

    let filtered =
        saved.filter(
            function (item) {

                const match =
                    getSavedMatch(
                        item
                    );

                if (!searchValue) {
                    return true;
                }

                if (!match) {
                    return false;
                }

                const text =
                    (
                        match.home +
                        " " +
                        match.away +
                        " " +
                        match.competition
                    )
                    .toLowerCase();

                return text.includes(
                    searchValue
                );
            }
        );

    if (!filtered.length) {

        container.innerHTML =
            '<div class="empty">' +
            (
                saved.length
                    ? "Aucun match ne correspond à ta recherche."
                    : "Aucun match enregistré."
            ) +
            "</div>";

        return;
    }

    container.innerHTML =
        filtered
            .map(
                function (item) {

                    const match =
                        getSavedMatch(
                            item
                        );

                    if (!match) {

                        return (
                            '<div class="history-card">' +
                            '<div class="history-main">' +
                            "<strong>Match enregistré</strong>" +
                            "<span>Les détails du match ne sont plus disponibles.</span>" +
                            "</div>" +
                            '<div class="rating">' +
                            "⭐ " +
                            Number(item.rating).toFixed(1) +
                            "/10" +
                            "</div>" +
                            "</div>"
                        );
                    }

                    let score = "-";

                    if (
                        match.homeScore !== null &&
                        match.homeScore !== undefined &&
                        match.awayScore !== null &&
                        match.awayScore !== undefined
                    ) {

                        score =
                            match.homeScore +
                            " - " +
                            match.awayScore;
                    }

                    return (

                        '<div class="history-card" ' +
                        'onclick="openSavedMatch(' +
                        item.matchId +
                        ')">' +

                        '<div class="history-main">' +

                        "<strong>" +

                        escapeHTML(
                            match.home
                        ) +

                        " " +

                        score +

                        " " +

                        escapeHTML(
                            match.away
                        ) +

                        "</strong>" +

                        "<span>" +

                        escapeHTML(
                            match.competition
                        ) +

                        " • " +

                        escapeHTML(
                            formatDateFR(
                                match.date.substring(
                                    0,
                                    10
                                )
                            )
                        ) +

                        "</span>" +

                        (
                            item.favoritePlayer
                                ? "<span>⭐ " +
                                  escapeHTML(
                                      item.favoritePlayer
                                  ) +
                                  "</span>"
                                : ""
                        ) +

                        (
                            item.comment
                                ? "<span>📝 " +
                                  escapeHTML(
                                      item.comment
                                  ).substring(
                                      0,
                                      80
                                  ) +
                                  (
                                      item.comment.length > 80
                                          ? "..."
                                          : ""
                                  ) +
                                  "</span>"
                                : ""
                        ) +

                        "</div>" +

                        '<div class="rating">' +

                        "⭐ " +

                        Number(
                            item.rating
                        ).toFixed(1) +

                        "/10" +

                        "</div>" +

                        "</div>"
                    );
                }
            )
            .join("");
}

/* =========================================================
   OUVRIR UN MATCH DEPUIS L'HISTORIQUE
========================================================= */

function openSavedMatch(id) {

    const saved =
        watchedMatches[id];

    if (!saved) {
        return;
    }

    const match =
        getSavedMatch(
            saved
        );

    if (!match) {
        return;
    }

    /*
       On place temporairement le match
       dans allMatches pour que openMatch()
       puisse l'utiliser.
    */

    const alreadyExists =
        allMatches.some(
            function (item) {
                return item.id === id;
            }
        );

    if (!alreadyExists) {

        allMatches.push(
            match
        );
    }

    openMatch(id);
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

        clearStatsSections();

        return;
    }

    const ratings =
        saved
            .map(
                function (item) {
                    return Number(
                        item.rating
                    );
                }
            )
            .filter(
                function (rating) {
                    return !isNaN(rating);
                }
            );

    const totalRatings =
        ratings.reduce(
            function (a, b) {
                return a + b;
            },
            0
        );

    const average =
        ratings.length
            ? totalRatings / ratings.length
            : 0;

    const best =
        ratings.length
            ? Math.max(...ratings)
            : 0;

    const worst =
        ratings.length
            ? Math.min(...ratings)
            : 0;

    /*
       ⚽ BUTS VUS
       On utilise maintenant les données
       sauvegardées avec chaque match.
    */

    let totalGoals = 0;

    saved.forEach(
        function (item) {

            const match =
                getSavedMatch(
                    item
                );

            if (!match) {
                return;
            }

            const homeGoals =
                Number(
                    match.homeScore
                );

            const awayGoals =
                Number(
                    match.awayScore
                );

            if (
                !isNaN(homeGoals) &&
                !isNaN(awayGoals)
            ) {

                totalGoals +=
                    homeGoals +
                    awayGoals;
            }
        }
    );

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

    renderCompetitionStats(
        saved
    );

    renderMonthlyStats(
        saved
    );

    renderSeasonStats(
        saved
    );

    renderRatedMatches(
        saved
    );
}

/* =========================================================
   VIDER LES STATS
========================================================= */

function clearStatsSections() {

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
}

/* =========================================================
   MATCHS NOTÉS
========================================================= */

function renderRatedMatches(saved) {

    /*
       On utilise le titre existant dans index.html
       et on ajoute automatiquement une section
       juste après les statistiques principales.
    */

    const statsContainer =
        document.getElementById(
            "statsContainer"
        );

    if (!statsContainer) {
        return;
    }

    let section =
        document.getElementById(
            "ratedMatchesSection"
        );

    if (!section) {

        section =
            document.createElement(
                "div"
            );

        section.id =
            "ratedMatchesSection";

        statsContainer
            .parentNode
            .insertBefore(
                section,
                statsContainer
                    .nextSibling
            );
    }

    const sorted =
        saved
            .slice()
            .sort(
                function (a, b) {

                    return (
                        Number(b.rating) -
                        Number(a.rating)
                    );
                }
            );

    section.innerHTML =

        '<h3 class="block-title">' +
        "⭐ Mes matchs notés" +
        "</h3>" +

        '<div class="history-container">' +

        sorted
            .map(
                function (item) {

                    const match =
                        getSavedMatch(
                            item
                        );

                    if (!match) {
                        return "";
                    }

                    let score = "-";

                    if (
                        match.homeScore !== null &&
                        match.homeScore !== undefined &&
                        match.awayScore !== null &&
                        match.awayScore !== undefined
                    ) {

                        score =
                            match.homeScore +
                            " - " +
                            match.awayScore;
                    }

                    return (

                        '<div class="history-card" ' +
                        'onclick="openSavedMatch(' +
                        item.matchId +
                        ')">' +

                        '<div class="history-main">' +

                        "<strong>" +

                        escapeHTML(
                            match.home
                        ) +

                        " " +

                        score +

                        " " +

                        escapeHTML(
                            match.away
                        ) +

                        "</strong>" +

                        "<span>" +

                        escapeHTML(
                            match.competition
                        ) +

                        " • " +

                        escapeHTML(
                            formatDateFR(
                                match.date.substring(
                                    0,
                                    10
                                )
                            )
                        ) +

                        "</span>" +

                        (
                            item.comment
                                ? "<span>📝 " +
                                  escapeHTML(
                                      item.comment
                                  ).substring(
                                      0,
                                      70
                                  ) +
                                  (
                                      item.comment.length > 70
                                          ? "..."
                                          : ""
                                  ) +
                                  "</span>"
                                : ""
                        ) +

                        "</div>" +

                        '<div class="rating">' +

                        "⭐ " +

                        Number(
                            item.rating
                        ).toFixed(1) +

                        "/10" +

                        "</div>" +

                        "</div>"
                    );
                }
            )
            .join("") +

        "</div>";
}

/* =========================================================
   CRÉER STAT
========================================================= */

function createStat(
    number,
    label
) {

    return (

        '<div class="stat-card">' +

        '<div class="number">' +

        escapeHTML(
            number
        ) +

        "</div>" +

        '<div class="label">' +

        escapeHTML(
            label
        ) +

        "</div>" +

        "</div>"
    );
}

/* =========================================================
   STATS COMPÉTITIONS
========================================================= */

function renderCompetitionStats(
    saved
) {

    const container =
        document.getElementById(
            "competitionStats"
        );

    if (!container) {
        return;
    }

    const groups = {};

    saved.forEach(
        function (item) {

            const match =
                getSavedMatch(
                    item
                );

            if (!match) {
                return;
            }

            const name =
                match.competition ||
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
        }
    );

    const entries =
        Object.entries(
            groups
        );

    if (!entries.length) {

        container.innerHTML =
            '<div class="empty">' +
            "Pas encore de données." +
            "</div>";

        return;
    }

    container.innerHTML =
        entries
            .map(
                function ([name, data]) {

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
                }
            )
            .join("");
}

/* =========================================================
   STATS MOIS
========================================================= */

function renderMonthlyStats(
    saved
) {

    const container =
        document.getElementById(
            "monthlyStats"
        );

    if (!container) {
        return;
    }

    const groups = {};

    saved.forEach(
        function (item) {

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
        }
    );

    container.innerHTML =
        Object.entries(groups)
            .map(
                function ([month, count]) {

                    return (

                        '<div class="month-stat">' +

                        escapeHTML(
                            month
                        ) +

                        " : " +

                        "<strong>" +

                        count +

                        " match(s)</strong>" +

                        "</div>"
                    );
                }
            )
            .join("");
}

/* =========================================================
   STATS SAISONS
========================================================= */

function renderSeasonStats(
    saved
) {

    const container =
        document.getElementById(
            "seasonStats"
        );

    if (!container) {
        return;
    }

    const groups = {};

    saved.forEach(
        function (item) {

            const match =
                getSavedMatch(
                    item
                );

            if (!match) {
                return;
            }

            const season =
                match.season ||
                "Inconnue";

            if (!groups[season]) {
                groups[season] = 0;
            }

            groups[season]++;
        }
    );

    container.innerHTML =
        Object.entries(groups)
            .map(
                function ([season, count]) {

                    return (

                        '<div class="season-stat">' +

                        "Saison " +

                        escapeHTML(
                            season
                        ) +

                        " : " +

                        "<strong>" +

                        count +

                        " match(s)</strong>" +

                        "</div>"
                    );
                }
            )
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
            saved.map(
                function (item) {
                    return Number(
                        item.rating
                    );
                }
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
    )
    .forEach(
        function (item) {

            if (
                item.favoritePlayer
            ) {

                counts[
                    item.favoritePlayer
                ] =
                    (
                        counts[
                            item.favoritePlayer
                        ] ||
                        0
                    ) + 1;
            }
        }
    );

    const players =
        Object.entries(
            counts
        )
        .sort(
            function (a, b) {
                return b[1] - a[1];
            }
        );

    if (!players.length) {

        container.innerHTML =
            '<div class="empty">' +
            "Tu n'as pas encore choisi de joueur préféré." +
            "</div>";

        return;
    }

    container.innerHTML =
        players
            .map(
                function (
                    [player, count],
                    index
                ) {

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
                        " sélection(s)</span>" +

                        "</div>" +

                        "</div>"
                    );
                }
            )
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

            renderHistory();
        }
    );
}

/* =========================================================
   FILTRE NOTE
========================================================= */

const ratingFilter =
    document.getElementById(
        "ratingFilter"
    );

if (ratingFilter) {

    ratingFilter.addEventListener(
        "change",
        function () {

            renderHistory();
        }
    );
}

/* =========================================================
   FILTRE COMPÉTITION
========================================================= */

const leagueFilter =
    document.getElementById(
        "leagueFilter"
    );

if (leagueFilter) {

    leagueFilter.addEventListener(
        "change",
        function () {

            renderHistory();
        }
    );
}

/* =========================================================
   FILTRE SAISON
========================================================= */

const seasonFilter =
    document.getElementById(
        "seasonFilter"
    );

if (seasonFilter) {

    seasonFilter.addEventListener(
        "change",
        function () {

            renderHistory();
        }
    );
}

/* =========================================================
   INITIALISATION
========================================================= */

updateSelectedDateDisplay();

loadMatches();

renderHistory();

renderStats();

renderAwards();
