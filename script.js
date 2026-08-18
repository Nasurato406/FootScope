/* =========================================================
   FOOTSCOPE
   API-FOOTBALL
========================================================= */


/* =========================================================
   🔴🔴🔴 TA CLÉ API 🔴🔴🔴
   REMPLACE UNIQUEMENT LE TEXTE ENTRE LES GUILLEMETS
========================================================= */

const API_KEY = "25fd0757eec89ba850a53745eab92ab7";


/* =========================================================
   API
========================================================= */

const API_URL =
    "https://v3.football.api-sports.io";


/* =========================================================
   COMPÉTITIONS
========================================================= */

const LEAGUES = {

    "Ligue 1": {
        id: 61,
        country: "France"
    },

    "Ligue 2": {
        id: 62,
        country: "France"
    },

    "Premier League": {
        id: 39,
        country: "Angleterre"
    },

    "La Liga": {
        id: 140,
        country: "Espagne"
    },

    "Serie A": {
        id: 135,
        country: "Italie"
    },

    "Bundesliga": {
        id: 78,
        country: "Allemagne"
    },

    "Liga Portugal": {
        id: 94,
        country: "Portugal"
    },

    "MLS": {
        id: 253,
        country: "USA"
    },

    "Ligue des Champions": {
        id: 2,
        country: "Europe"
    },

    "Europa League": {
        id: 3,
        country: "Europe"
    },

    "Conference League": {
        id: 848,
        country: "Europe"
    }

};


/* =========================================================
   DONNÉES
========================================================= */

let matches = [];

let allMatches = [];

let watchedMatches = {};

let favoritePlayers = {};

let selectedDate = new Date();

selectedDate.setHours(12, 0, 0, 0);

let selectedCompetition = null;


/* =========================================================
   LOCAL STORAGE
========================================================= */

try {

    watchedMatches =
        JSON.parse(
            localStorage.getItem(
                "footScopeWatched"
            )
        ) || {};

    favoritePlayers =
        JSON.parse(
            localStorage.getItem(
                "footScopeFavoritePlayers"
            )
        ) || {};

} catch (error) {

    watchedMatches = {};

    favoritePlayers = {};

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

}


/* =========================================================
   ECHAPPEMENT HTML
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
            dateString +
            "T12:00:00"
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
   🟢 NOUVEAU : METTRE À JOUR LA DATE AFFICHÉE
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

    /*
       Première lettre en majuscule :
       mardi 18 août 2026
       devient
       Mardi 18 août 2026
    */

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
   API STATUS
========================================================= */

function showApiStatus(
    message,
    type
) {

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
        Object.keys(
            data.errors
        ).length > 0
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
        getDateString(
            selectedDate
        );


    selectedCompetition = null;


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
        .style.display = "grid";


    showApiStatus(
        "⏳ Chargement des matchs du " +
        formatDateFR(date) +
        "...",
        ""
    );


    const competitionsContainer =
        document.getElementById(
            "competitionsContainer"
        );


    competitionsContainer.innerHTML =
        '<div class="loading">' +
        "⚽ Chargement des matchs..." +
        "</div>";


    try {

        const data =
            await apiRequest(
                "/fixtures?date=" +
                date
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


        competitionsContainer.innerHTML =
            '<div class="empty">' +
            escapeHTML(
                message
            ) +
            "<br><br>" +
            "Date demandée : " +
            escapeHTML(
                formatDateFR(date)
            ) +
            "</div>";

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
        ).some(
            function (league) {

                return league.id === leagueId;

            }
        );


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


    container.style.display =
        "grid";


    document
        .getElementById(
            "competitionMatches"
        )
        .classList.add(
            "hidden"
        );


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
            ].matches.push(
                match
            );

        }
    );


    const competitions =
        Object.values(
            groups
        );


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
            competition.country ||
            ""
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
   OUVRIR UNE COMPÉTITION
========================================================= */

function openCompetition(
    leagueId
) {

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
            escapeHTML(
                favorite
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
        formatTime(
            match.date
        ) +
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

function openMatch(id) {

    const match =
        allMatches.find(
            function (item) {

                return item.id === id;

            }
        );


    if (!match) {

        return;

    }


    const watched =
        watchedMatches[id];


    const favorite =
        favoritePlayers[id] ||
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
        formatTime(
            match.date
        ) +
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
        escapeHTML(
            rating
        ) +
        '">' +

        "</div>" +


        '<div class="form-group">' +

        "<label>" +
        "Qualité du match" +
        "</label>" +

        '<select id="quality" class="form-select">' +

        '<option value="exceptionnel"' +
        (
            quality ===
            "exceptionnel"
                ? " selected"
                : ""
        ) +
        ">🔥 Exceptionnel</option>" +

        '<option value="très bon"' +
        (
            quality ===
            "très bon"
                ? " selected"
                : ""
        ) +
        ">⭐ Très bon</option>" +

        '<option value="moyen"' +
        (
            quality ===
            "moyen"
                ? " selected"
                : ""
        ) +
        ">😐 Moyen</option>" +

        '<option value="mauvais"' +
        (
            quality ===
            "mauvais"
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

        escapeHTML(
            comment
        ) +

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

}


/* =========================================================
   CHARGER LES JOUEURS DES DEUX ÉQUIPES
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

        const [
            homeData,
            awayData
        ] = await Promise.all([

            apiRequest(
                "/players?team=" +
                match.homeId +
                "&season=" +
                match.season
            ),

            apiRequest(
                "/players?team=" +
                match.awayId +
                "&season=" +
                match.season
            )

        ]);


        const players = [];


        function addPlayers(data, teamName) {

            const response =
                data.response || [];


            response.forEach(
                function (item) {

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

                }
            );

        }


        addPlayers(
            homeData,
            match.home
        );


        addPlayers(
            awayData,
            match.away
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

                    }
                )
                .join("");


    } catch (error) {

        console.error(
            "Erreur joueurs :",
            error
        );


        container.innerHTML =
            '<div class="empty">' +

            "Impossible de charger la liste des joueurs." +

            "<br><br>" +

            "Tu peux réessayer en ouvrant le match." +

            "</div>";

    }

}


/* =========================================================
   CHOISIR UN JOUEUR
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


    watchedMatches[id] = {

        matchId:
            id,

        rating:
            rating,

        favoritePlayer:
            favorite,

        quality:
            qualityInput.value,

        comment:
            commentInput.value,

        watchedAt:
            new Date().toISOString()

    };


    saveData();


    closeModal();


    renderCurrentCompetition();


    renderHistory();

    renderStats();

    renderAwards();

}


/* =========================================================
   RENDRE LES MATCHS ACTUELS
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

    document
        .getElementById(
            "matchModal"
        )
        .classList.remove(
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


                    document
                        .getElementById(
                            page
                        )
                        .classList.add(
                            "active"
                        );


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

            // 🟢 NOUVEAU :
            // on met immédiatement à jour
            // la date affichée
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

            // 🟢 NOUVEAU :
            // on met immédiatement à jour
            // la date affichée
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
            .map(
                function (item) {

                    const match =
                        allMatches.find(
                            function (m) {

                                return (
                                    m.id ===
                                    item.matchId
                                );

                            }
                        );


                    return (

                        '<div class="history-card">' +

                        '<div class="history-main">' +

                        "<strong>" +

                        (
                            match
                                ? escapeHTML(
                                    match.home +
                                    " - " +
                                    match.away
                                )
                                : "Match enregistré"
                        ) +

                        "</strong>" +

                        "<span>" +

                        escapeHTML(
                            item.favoritePlayer ||
                            "Aucun joueur sélectionné"
                        ) +

                        "</span>" +

                        "</div>" +

                        '<div class="rating">' +

                        "⭐ " +

                        item.rating +

                        "/10" +

                        "</div>" +

                        "</div>"

                    );

                }
            )
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


    if (!saved.length) {

        statsContainer.innerHTML =
            '<div class="empty">' +
            "Regarde et note des matchs pour voir tes statistiques." +
            "</div>";

        document.getElementById(
            "competitionStats"
        ).innerHTML = "";

        document.getElementById(
            "monthlyStats"
        ).innerHTML = "";

        document.getElementById(
            "seasonStats"
        ).innerHTML = "";

        return;

    }


    const ratings =
        saved.map(
            function (item) {

                return Number(
                    item.rating
                );

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
        totalRatings /
        ratings.length;


    const best =
        Math.max(
            ...ratings
        );


    const worst =
        Math.min(
            ...ratings
        );


    let totalGoals = 0;


    saved.forEach(
        function (item) {

            const match =
                allMatches.find(
                    function (m) {

                        return (
                            m.id ===
                            item.matchId
                        );

                    }
                );


            if (
                match &&
                match.homeScore !== null &&
                match.awayScore !== null
            ) {

                totalGoals +=
                    Number(
                        match.homeScore
                    ) +
                    Number(
                        match.awayScore
                    );

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

}


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


    const groups = {};


    saved.forEach(
        function (item) {

            const match =
                allMatches.find(
                    function (m) {

                        return (
                            m.id ===
                            item.matchId
                        );

                    }
                );


            if (!match) {
                return;
            }


            const name =
                match.competition;


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
                );

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

                        escapeHTML(
                            name
                        ) +

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
        Object.entries(
            groups
        )
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


    const groups = {};


    saved.forEach(
        function (item) {

            const match =
                allMatches.find(
                    function (m) {

                        return (
                            m.id ===
                            item.matchId
                        );

                    }
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
        Object.entries(
            groups
        )
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

                        (
                            index + 1
                        ) +

                        "</div>" +

                        '<div class="player-info">' +

                        "<strong>" +

                        escapeHTML(
                            player
                        ) +

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

document
    .getElementById(
        "searchInput"
    )
    .addEventListener(
        "input",
        function () {

            renderHistory();

        }
    );


/* =========================================================
   INITIALISATION
========================================================= */

// 🟢 Affichage initial de la vraie date
updateSelectedDateDisplay();


loadMatches();

renderHistory();

renderStats();

renderAwards();
