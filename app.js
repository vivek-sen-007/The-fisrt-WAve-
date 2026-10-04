/* =========================================================
   SAFEROUTE AI
   Complete Frontend JavaScript
   Local Route Engine + External LLM Integration
   ========================================================= */


/* ---------------------------------------------------------
   BASIC HELPERS
   --------------------------------------------------------- */

const $ = id => document.getElementById(id);


/* ---------------------------------------------------------
   LOCAL AHMEDABAD MAP NODES
   --------------------------------------------------------- */

const nodes = {

    station: {
        name: "Ahmedabad Railway Station",
        short: "Railway Station",
        x: 120,
        y: 485
    },

    shahibaug: {
        name: "Shahibaug",
        short: "Shahibaug",
        x: 205,
        y: 405
    },

    ashram: {
        name: "Sabarmati Ashram",
        short: "Ashram",
        x: 265,
        y: 330
    },

    riverfront: {
        name: "Sabarmati Riverfront",
        short: "Riverfront",
        x: 350,
        y: 405
    },

    airport: {
        name: "Sardar Vallabhbhai Patel Airport",
        short: "Airport",
        x: 355,
        y: 180
    },

    naroda: {
        name: "Naroda",
        short: "Naroda",
        x: 540,
        y: 230
    },

    navrangpura: {
        name: "Navrangpura",
        short: "Navrangpura",
        x: 390,
        y: 325
    },

    lawgarden: {
        name: "Law Garden",
        short: "Law Garden",
        x: 445,
        y: 400
    },

    paldi: {
        name: "Paldi",
        short: "Paldi",
        x: 430,
        y: 515
    },

    ghatlodia: {
        name: "Ghatlodia",
        short: "Ghatlodia",
        x: 475,
        y: 155
    },

    thaltej: {
        name: "Thaltej",
        short: "Thaltej",
        x: 570,
        y: 130
    },

    nirma: {
        name: "Nirma University",
        short: "Nirma University",
        x: 660,
        y: 175
    },

    indus: {
        name: "Indus University",
        short: "Indus University",
        x: 620,
        y: 310
    },

    sghighway: {
        name: "SG Highway",
        short: "SG Highway",
        x: 550,
        y: 390
    }
};


/* ---------------------------------------------------------
   LOCAL ROAD NETWORK

   [from, to, distance, baseRisk, roadQuality, lighting]
   --------------------------------------------------------- */

const edges = [

    ["station", "shahibaug", 2.2, 0.18, "Good", "Good"],
    ["station", "riverfront", 3.0, 0.24, "Good", "Good"],

    ["shahibaug", "ashram", 2.4, 0.20, "Good", "Good"],
    ["shahibaug", "riverfront", 2.1, 0.30, "Fair", "Fair"],

    ["ashram", "airport", 4.1, 0.26, "Good", "Good"],
    ["ashram", "navrangpura", 3.2, 0.18, "Good", "Good"],
    ["ashram", "riverfront", 2.5, 0.22, "Good", "Good"],

    ["riverfront", "navrangpura", 3.0, 0.17, "Good", "Good"],
    ["riverfront", "lawgarden", 2.8, 0.27, "Fair", "Fair"],
    ["riverfront", "paldi", 3.4, 0.24, "Good", "Fair"],

    ["airport", "naroda", 4.0, 0.34, "Fair", "Poor"],
    ["airport", "ghatlodia", 4.5, 0.28, "Good", "Fair"],

    ["naroda", "thaltej", 6.0, 0.38, "Fair", "Poor"],
    ["naroda", "ghatlodia", 5.0, 0.31, "Fair", "Fair"],

    ["ghatlodia", "thaltej", 3.4, 0.20, "Good", "Good"],
    ["ghatlodia", "navrangpura", 4.0, 0.23, "Good", "Good"],

    ["thaltej", "nirma", 4.2, 0.18, "Good", "Good"],
    ["thaltej", "indus", 4.5, 0.22, "Good", "Good"],

    ["navrangpura", "lawgarden", 2.2, 0.18, "Good", "Good"],
    ["navrangpura", "indus", 4.4, 0.21, "Good", "Good"],

    ["lawgarden", "paldi", 2.7, 0.26, "Fair", "Fair"],
    ["lawgarden", "sghighway", 4.2, 0.20, "Good", "Good"],

    ["paldi", "sghighway", 4.8, 0.24, "Good", "Fair"],

    ["sghighway", "indus", 3.6, 0.17, "Good", "Good"],
    ["sghighway", "nirma", 5.5, 0.19, "Good", "Good"],

    ["indus", "nirma", 4.0, 0.16, "Good", "Good"]
];


/* ---------------------------------------------------------
   DEFAULT HAZARDS
   --------------------------------------------------------- */

const hazards = [

    {
        type: "accident",
        location: "shahibaug",
        note: "Recent accident-prone section"
    },

    {
        type: "pothole",
        location: "paldi",
        note: "Reported potholes"
    },

    {
        type: "blocked",
        location: "naroda",
        note: "Road blockage reported"
    },

    {
        type: "lighting",
        location: "airport",
        note: "Low lighting section"
    },

    {
        type: "accident",
        location: "thaltej",
        note: "Higher incident exposure"
    }

];


/* ---------------------------------------------------------
   COMMUNITY HAZARDS
   Stored in browser localStorage
   --------------------------------------------------------- */

let communityHazards =
    JSON.parse(
        localStorage.getItem("saferoute-hazards") || "[]"
    );


/* ---------------------------------------------------------
   APPLICATION STATE
   --------------------------------------------------------- */

let currentRoutes = [];

let selectedRoute = 1;

let riskVisible = true;

let zoom = 1;


/* ---------------------------------------------------------
   INITIALIZE APPLICATION
   --------------------------------------------------------- */

function init() {

    fillSelects();

    bindEvents();

    drawMap();

    $("from").value = "station";
    $("to").value = "nirma";

    calculate();
}


/* ---------------------------------------------------------
   POPULATE SELECT BOXES
   --------------------------------------------------------- */

function fillSelects() {

    const from = $("from");
    const to = $("to");
    const hazardLocation = $("hazardLocation");

    Object.entries(nodes).forEach(([key, node]) => {

        const option1 = document.createElement("option");

        option1.value = key;
        option1.textContent = node.name;

        from.appendChild(option1);


        const option2 = document.createElement("option");

        option2.value = key;
        option2.textContent = node.name;

        to.appendChild(option2);


        const option3 = document.createElement("option");

        option3.value = key;
        option3.textContent = node.name;

        hazardLocation.appendChild(option3);

    });
}


/* ---------------------------------------------------------
   EVENT LISTENERS
   --------------------------------------------------------- */

function bindEvents() {

    $("findRoutes")?.addEventListener(
        "click",
        calculate
    );


    $("swapRoute")?.addEventListener(
        "click",
        () => {

            const temp = $("from").value;

            $("from").value = $("to").value;

            $("to").value = temp;

            calculate();

        }
    );


    document.querySelectorAll("[data-demo]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const values =
                        button.dataset.demo.split("-");

                    if (values.length >= 2) {

                        $("from").value = values[0];

                        $("to").value =
                            values.slice(1).join("-");

                        calculate();
                    }

                }
            );

        });


    $("addHazard")?.addEventListener(
        "click",
        addHazard
    );


    $("toggleRisk")?.addEventListener(
        "click",
        () => {

            riskVisible = !riskVisible;

            drawMap();

            toast(
                riskVisible
                    ? "Risk layer enabled"
                    : "Risk layer hidden"
            );

        }
    );


    $("clearReports")?.addEventListener(
        "click",
        () => {

            communityHazards = [];

            localStorage.removeItem(
                "saferoute-hazards"
            );

            drawMap();

            calculate();

            toast("Community reports cleared");

        }
    );


    $("zoomIn")?.addEventListener(
        "click",
        () => {

            zoom = Math.min(
                zoom + 0.1,
                1.8
            );

            applyZoom();

        }
    );


    $("zoomOut")?.addEventListener(
        "click",
        () => {

            zoom = Math.max(
                zoom - 0.1,
                0.7
            );

            applyZoom();

        }
    );


    $("resetZoom")?.addEventListener(
        "click",
        () => {

            zoom = 1;

            applyZoom();

        }
    );


    $("emergencyButton")?.addEventListener(
        "click",
        () => {

            $("emergencyModal")?.classList.add(
                "show"
            );

        }
    );


    $("closeEmergency")?.addEventListener(
        "click",
        () => {

            $("emergencyModal")?.classList.remove(
                "show"
            );

        }
    );


    $("locateUser")?.addEventListener(
        "click",
        locateUser
    );

}


/* =========================================================
   MAP
   ========================================================= */

function drawMap() {

    const svg = $("mapSvg");

    if (!svg) return;

    svg.innerHTML = "";


    /* -----------------------------------------------------
       DRAW ROADS
       ----------------------------------------------------- */

    edges.forEach(
        (edge, index) => {

            const from =
                nodes[edge[0]];

            const to =
                nodes[edge[1]];


            const path =
                createSVG(
                    "path",
                    {
                        d:
                            `M ${from.x} ${from.y}
                             L ${to.x} ${to.y}`,

                        class:
                            `graph-road ${
                                riskClass(edge[3])
                            }`,

                        "data-edge":
                            index
                    }
                );


            path.addEventListener(
                "click",
                () => {

                    $("from").value =
                        edge[0];

                    $("to").value =
                        edge[1];

                    calculate();

                }
            );


            svg.appendChild(path);

        }
    );


    /* -----------------------------------------------------
       DRAW NODES
       ----------------------------------------------------- */

    Object.entries(nodes)
        .forEach(
            ([key, node]) => {

                const circle =
                    createSVG(
                        "circle",
                        {
                            cx: node.x,
                            cy: node.y,
                            r: 7,
                            class: "node"
                        }
                    );


                circle.addEventListener(
                    "click",
                    () => {

                        $("to").value =
                            key;

                        calculate();

                    }
                );


                svg.appendChild(circle);


                const label =
                    createSVG(
                        "text",
                        {
                            x: node.x + 10,
                            y: node.y - 10,
                            class: "node-label"
                        }
                    );


                label.textContent =
                    node.short;


                svg.appendChild(label);

            }
        );


    /* -----------------------------------------------------
       DRAW HAZARDS
       ----------------------------------------------------- */

    if (riskVisible) {

        const allHazards = [
            ...hazards,
            ...communityHazards
        ];


        allHazards.forEach(
            hazard => {

                const node =
                    nodes[hazard.location];

                if (!node) return;


                const dot =
                    createSVG(
                        "circle",
                        {
                            cx: node.x,
                            cy: node.y + 18,
                            r: 6,
                            class: "hazard-dot"
                        }
                    );


                dot.style.fill =
                    hazardColor(hazard.type);


                dot.addEventListener(
                    "click",
                    () => {

                        toast(
                            `${pretty(hazard.type)}: ${hazard.note || "Reported hazard"}`
                        );

                    }
                );


                svg.appendChild(dot);

            }
        );

    }


    applyZoom();
}


/* =========================================================
   ROUTE CALCULATION
   ========================================================= */

async function calculate() {

    const from =
        $("from").value;

    const to =
        $("to").value;

    const mode =
        $("mode")?.value || "car";

    const time =
        $("travelTime")?.value || "day";


    if (!from || !to) return;


    if (from === to) {

        toast(
            "Please select different locations"
        );

        return;

    }


    /* -----------------------------------------------------
       FASTEST ROUTE
       ----------------------------------------------------- */

    const fastest =
        shortestPath(
            from,
            to,
            "distance"
        );


    if (!fastest) {

        toast(
            "No route found between these locations"
        );

        return;

    }


    /* -----------------------------------------------------
       FIND HIGHEST-RISK ROAD
       ----------------------------------------------------- */

    let highestRiskEdge = null;

    let highestRisk = -1;


    fastest.edges.forEach(
        index => {

            const edge =
                edges[index];

            const risk =
                edgeRisk(
                    edge,
                    mode,
                    time
                );


            if (risk > highestRisk) {

                highestRisk =
                    risk;

                highestRiskEdge =
                    index;

            }

        }
    );


    /* -----------------------------------------------------
       BLOCK HIGHEST RISK ROAD TEMPORARILY

       This forces the safer route engine to look
       for another option.
       ----------------------------------------------------- */

    let safer;

    if (highestRiskEdge !== null) {

        safer =
            shortestPath(
                from,
                to,
                "safeStrong",
                highestRiskEdge
            );

    }


    if (!safer) {

        safer =
            shortestPath(
                from,
                to,
                "safeStrong"
            );

    }


    /* -----------------------------------------------------
       CREATE ROUTES
       ----------------------------------------------------- */

    const routeA =
        createRoute(
            "Route A",
            "Fastest",
            fastest,
            mode,
            time
        );


    const routeB =
        createRoute(
            "Route B",
            "AI Safer Choice",
            safer || fastest,
            mode,
            time
        );


    currentRoutes = [
        routeA,
        routeB
    ];


    /* -----------------------------------------------------
       SELECT SAFER ROUTE
       ----------------------------------------------------- */

    selectedRoute = 1;


    renderRoutes();

    paintRoutes();

    updateExplanation();


    /* -----------------------------------------------------
       EXTERNAL LLM
       ----------------------------------------------------- */

    await getAIRecommendation();
}


/* =========================================================
   DIJKSTRA ROUTE FINDER
   ========================================================= */

function shortestPath(
    start,
    target,
    objective = "distance",
    blockedEdge = null
) {

    const distances = {};

    const previous = {};

    const visited = new Set();


    Object.keys(nodes)
        .forEach(
            key => {

                distances[key] =
                    Infinity;

                previous[key] =
                    null;

            }
        );


    distances[start] = 0;


    while (true) {

        let current = null;

        let currentDistance =
            Infinity;


        Object.keys(nodes)
            .forEach(
                key => {

                    if (
                        !visited.has(key) &&
                        distances[key] <
                        currentDistance
                    ) {

                        current =
                            key;

                        currentDistance =
                            distances[key];

                    }

                }
            );


        if (current === null) break;


        if (current === target) break;


        visited.add(current);


        edges.forEach(
            (edge, index) => {

                if (
                    blockedEdge !== null &&
                    index === blockedEdge
                ) {
                    return;
                }


                let neighbor = null;


                if (edge[0] === current) {

                    neighbor =
                        edge[1];

                }
                else if (edge[1] === current) {

                    neighbor =
                        edge[0];

                }


                if (!neighbor) return;


                const cost =
                    edgeCost(
                        edge,
                        objective
                    );


                const newDistance =
                    currentDistance +
                    cost;


                if (
                    newDistance <
                    distances[neighbor]
                ) {

                    distances[neighbor] =
                        newDistance;

                    previous[neighbor] = {
                        node: current,
                        edge: index
                    };

                }

            }
        );

    }


    if (
        distances[target] === Infinity
    ) {

        return null;

    }


    const path = [];

    const pathEdges = [];

    let current = target;


    while (current !== start) {

        const previousNode =
            previous[current];


        if (!previousNode) {
            return null;
        }


        path.unshift(current);

        pathEdges.unshift(
            previousNode.edge
        );


        current =
            previousNode.node;

    }


    path.unshift(start);


    return {
        nodes: path,
        edges: pathEdges,
        cost: distances[target]
    };
}


/* =========================================================
   EDGE COST
   ========================================================= */

function edgeCost(
    edge,
    objective
) {

    const distance =
        edge[2];

    const risk =
        edge[3];


    if (objective === "distance") {

        return distance;

    }


    if (objective === "safeStrong") {

        return (
            distance *
            (1 + risk * 7)
        );

    }


    return (
        distance *
        (1 + risk * 3)
    );
}


/* =========================================================
   EDGE RISK
   ========================================================= */

function edgeRisk(
    edge,
    mode,
    time
) {

    let risk =
        edge[3];


    const lighting =
        edge[5];


    const roadQuality =
        edge[4];


    /* -----------------------------------------------------
       POOR LIGHTING
       ----------------------------------------------------- */

    if (
        lighting === "Poor"
    ) {

        if (
            time === "evening" ||
            time === "night"
        ) {

            risk += 0.18;

        }
        else {

            risk += 0.06;

        }

    }


    /* -----------------------------------------------------
       FAIR LIGHTING
       ----------------------------------------------------- */

    if (
        lighting === "Fair"
    ) {

        if (
            time === "night"
        ) {

            risk += 0.10;

        }

    }


    /* -----------------------------------------------------
       WALKING
       ----------------------------------------------------- */

    if (
        mode === "walk"
    ) {

        risk += 0.05;

    }


    /* -----------------------------------------------------
       BIKE
       ----------------------------------------------------- */

    if (
        mode === "bike"
    ) {

        risk += 0.03;

    }


    /* -----------------------------------------------------
       ROAD QUALITY
       ----------------------------------------------------- */

    if (
        roadQuality === "Poor"
    ) {

        risk += 0.15;

    }


    if (
        roadQuality === "Fair"
    ) {

        risk += 0.05;

    }


    /* -----------------------------------------------------
       HAZARDS
       ----------------------------------------------------- */

    risk +=
        hazardPenalty(
            edge
        );


    return Math.min(
        risk,
        0.95
    );
}


/* =========================================================
   HAZARD PENALTY
   ========================================================= */

function hazardPenalty(edge) {

    let penalty = 0;


    const allHazards = [
        ...hazards,
        ...communityHazards
    ];


    allHazards.forEach(
        hazard => {

            if (
                edge.includes(
                    hazard.location
                )
            ) {

                switch (
                    hazard.type
                ) {

                    case "accident":

                        penalty +=
                            0.18;

                        break;


                    case "blocked":

                        penalty +=
                            0.20;

                        break;


                    case "pothole":

                        penalty +=
                            0.10;

                        break;


                    case "lighting":

                        penalty +=
                            0.12;

                        break;


                    default:

                        penalty +=
                            0.08;

                }

            }

        }
    );


    return Math.min(
        penalty,
        0.40
    );
}


/* =========================================================
   CREATE ROUTE OBJECT
   ========================================================= */

function createRoute(
    name,
    type,
    path,
    mode,
    time
) {

    const distance =
        path.edges.reduce(
            (sum, edgeIndex) =>
                sum +
                edges[edgeIndex][2],
            0
        );


    const risks =
        path.edges.map(
            edgeIndex =>
                edgeRisk(
                    edges[edgeIndex],
                    mode,
                    time
                )
        );


    const avgRisk =
        average(risks);


    const safetyScore =
        Math.round(
            Math.max(
                0,
                Math.min(
                    100,
                    (1 - avgRisk) * 100
                )
            )
        );


    /* -----------------------------------------------------
       SPEED BY MODE
       ----------------------------------------------------- */

    let speed = 35;


    if (mode === "car") {

        speed = 32;

    }
    else if (mode === "bike") {

        speed = 25;

    }
    else if (mode === "walk") {

        speed = 5;

    }


    const etaMinutes =
        Math.max(
            1,
            Math.round(
                (distance / speed) *
                60
            )
        );


    /* -----------------------------------------------------
       ROAD QUALITY
       ----------------------------------------------------- */

    const qualities =
        path.edges.map(
            edgeIndex =>
                edges[edgeIndex][4]
        );


    const lighting =
        path.edges.map(
            edgeIndex =>
                edges[edgeIndex][5]
        );


    const roadQuality =
        qualitySummary(
            qualities
        );


    const lightingSummary =
        qualitySummary(
            lighting
        );


    /* -----------------------------------------------------
       INCIDENTS
       ----------------------------------------------------- */

    const incidents =
        countIncidents(
            path
        );


    return {

        name,

        type,

        nodes: path.nodes,

        edges: path.edges,

        distance:

            Math.round(
                distance * 10
            ) / 10,

        eta: etaMinutes,

        safetyScore,

        roadQuality,

        lighting:
            lightingSummary,

        incidents

    };
}


/* =========================================================
   COUNT INCIDENTS
   ========================================================= */

function countIncidents(path) {

    let count = 0;


    const allHazards = [
        ...hazards,
        ...communityHazards
    ];


    allHazards.forEach(
        hazard => {

            if (
                path.nodes.includes(
                    hazard.location
                )
            ) {

                count++;

            }

        }
    );


    return count;
}


/* =========================================================
   QUALITY SUMMARY
   ========================================================= */

function qualitySummary(values) {

    if (!values.length) {

        return "Unknown";

    }


    const good =
        values.filter(
            value =>
                value === "Good"
        ).length;


    const fair =
        values.filter(
            value =>
                value === "Fair"
        ).length;


    const poor =
        values.filter(
            value =>
                value === "Poor"
        ).length;


    if (
        poor > values.length / 2
    ) {

        return "Poor";

    }


    if (
        fair > values.length / 2
    ) {

        return "Fair";

    }


    if (
        good >= fair &&
        good >= poor
    ) {

        return "Good";

    }


    return "Fair";
}


/* =========================================================
   RENDER ROUTE CARDS
   ========================================================= */

function renderRoutes() {

    const container =
        $("routeCards");


    if (!container) return;


    container.innerHTML = "";


    currentRoutes.forEach(
        (route, index) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                `route-card ${
                    index === selectedRoute
                        ? "recommended"
                        : ""
                }`;


            card.innerHTML = `

                <div class="route-card-top">

                    <div>

                        <span class="route-name">
                            ${route.name}
                        </span>

                        <span class="route-type">
                            ${route.type}
                        </span>

                    </div>

                    <div class="route-score">
                        ${route.safetyScore}/100
                    </div>

                </div>


                <div class="route-details">

                    <div>
                        <small>Distance</small>
                        <strong>
                            ${route.distance} km
                        </strong>
                    </div>

                    <div>
                        <small>ETA</small>
                        <strong>
                            ${route.eta} min
                        </strong>
                    </div>

                    <div>
                        <small>Incidents</small>
                        <strong>
                            ${route.incidents}
                        </strong>
                    </div>

                </div>


                <div class="score-track">

                    <div
                        class="score-fill"
                        style="width:${route.safetyScore}%"
                    ></div>

                </div>


                <div class="route-actions">

                    <button
                        class="route-use"
                        data-route="${index}"
                    >
                        Use this route
                    </button>

                    <button
                        class="route-why"
                        data-route="${index}"
                    >
                        Why?
                    </button>

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );


    container
        .querySelectorAll(
            "[data-route]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        selectRoute(
                            Number(
                                button.dataset.route
                            )
                        );

                    }
                );

            }
        );
}


/* =========================================================
   SELECT ROUTE
   ========================================================= */

function selectRoute(index) {

    selectedRoute =
        index;


    renderRoutes();

    paintRoutes();

    updateExplanation();

}


/* =========================================================
   PAINT ROUTES ON MAP
   ========================================================= */

function paintRoutes() {

    const selected =
        currentRoutes[
            selectedRoute
        ];


    document
        .querySelectorAll(
            ".graph-road"
        )
        .forEach(
            path => {

                path.classList.remove(
                    "route-a",
                    "route-b",
                    "dim"
                );


                const index =
                    Number(
                        path.dataset.edge
                    );


                if (
                    selected &&
                    selected.edges.includes(
                        index
                    )
                ) {

                    path.classList.add(
                        selectedRoute === 0
                            ? "route-a"
                            : "route-b"
                    );

                }
                else {

                    path.classList.add(
                        "dim"
                    );

                }

            }
        );
}


/* =========================================================
   EXPLANATION PANEL
   ========================================================= */

function updateExplanation() {

    const route =
        currentRoutes[
            selectedRoute
        ];


    if (!route) return;


    const title =
        $("whyRouteTitle");


    const text =
        $("whyRouteText");


    const roadQuality =
        $("roadQuality");


    const incidents =
        $("incidentCount");


    const lighting =
        $("lightingStatus");


    const timeRisk =
        $("timeRisk");


    if (title) {

        title.textContent =
            `${route.name} is recommended`;

    }


    if (text) {

        text.textContent =
            route.type ===
            "AI Safer Choice"

                ? "This route reduces exposure to higher-risk road sections while maintaining a practical travel time."

                : "This route provides the shortest estimated travel time.";

    }


    if (roadQuality) {

        roadQuality.textContent =
            route.roadQuality;

    }


    if (incidents) {

        incidents.textContent =
            route.incidents;

    }


    if (lighting) {

        lighting.textContent =
            route.lighting;

    }


    if (timeRisk) {

        const time =
            $("travelTime")?.value ||
            "day";


        timeRisk.textContent =
            pretty(time);

    }
}


/* =========================================================
   EXTERNAL LLM CONNECTION
   ========================================================= */

/*
   IMPORTANT:

   The API key is NOT stored here.

   app.js sends data to:

   http://localhost:5000/api/ai-analyze

   server.js then securely connects to the
   external LLM using the API key stored in .env.
*/

async function askExternalLLM(
    routeData
) {

    const response =
        await fetch(
            "http://localhost:5000/api/ai-analyze",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        routeData
                    )
            }
        );


    if (!response.ok) {

        throw new Error(
            "AI server unavailable"
        );

    }


    return await response.json();
}


/* =========================================================
   SEND ROUTE DATA TO EXTERNAL LLM
   ========================================================= */

async function getAIRecommendation() {

    const from =
        $("from").value;

    const to =
        $("to").value;

    const mode =
        $("mode")?.value ||
        "car";

    const time =
        $("travelTime")?.value ||
        "day";


    /* -----------------------------------------------------
       Prepare data for the external LLM
       ----------------------------------------------------- */

    const routeData = {

        from:
            nodes[from]?.name ||
            from,

        to:
            nodes[to]?.name ||
            to,

        travelMode:
            mode,

        travelTime:
            time,


        routes:

            currentRoutes.map(
                route => ({

                    name:
                        route.name,

                    type:
                        route.type,

                    distance:
                        route.distance,

                    eta:
                        route.eta,

                    safetyScore:
                        route.safetyScore,

                    roadQuality:
                        route.roadQuality,

                    lighting:
                        route.lighting,

                    incidents:
                        route.incidents,

                    path:
                        route.nodes.map(
                            node =>
                                nodes[node]?.name
                        )

                })
            ),


        hazards:

            [
                ...hazards,
                ...communityHazards
            ].map(
                hazard => ({

                    type:
                        hazard.type,

                    location:
                        nodes[
                            hazard.location
                        ]?.name ||
                        hazard.location,

                    note:
                        hazard.note ||
                        ""

                })
            )

    };


    /* -----------------------------------------------------
       Show loading state
       ----------------------------------------------------- */

    showAILoading();


    try {

        const ai =
            await askExternalLLM(
                routeData
            );


        console.log(
            "🤖 External LLM Response:",
            ai
        );


        renderAIResult(
            ai
        );


    }
    catch (error) {

        console.error(
            "AI Error:",
            error
        );


        renderAIError();

    }
}


/* =========================================================
   AI LOADING STATE
   ========================================================= */

function showAILoading() {

    const box =
        $("aiRecommendation");


    if (!box) return;


    box.innerHTML = `

        <div class="ai-result">

            <div class="ai-title">
                🤖 AI Safety Analyst
            </div>

            <p>
                Analyzing route safety...
            </p>

            <small>
                External LLM is evaluating
                road conditions, incidents,
                lighting and travel time.
            </small>

        </div>

    `;
}


/* =========================================================
   RENDER AI RESULT
   ========================================================= */

function renderAIResult(ai) {

    const box =
        $("aiRecommendation");


    if (!box) return;


    const factors =
        Array.isArray(
            ai.keyFactors
        )
            ? ai.keyFactors
            : [];


    box.innerHTML = `

        <div class="ai-result">

            <div class="ai-title">
                🤖 AI Safety Analyst
            </div>


            <div class="ai-recommendation">

                ${escapeHTML(
                    ai.recommendation ||
                    "AI recommends the safer route based on the available data."
                )}

            </div>


            <div class="ai-risk">

                Risk Level:

                <strong>
                    ${escapeHTML(
                        ai.riskLevel ||
                        "Moderate"
                    )}
                </strong>

            </div>


            <div class="ai-reason">

                <strong>
                    Why this route?
                </strong>

                <p>

                    ${escapeHTML(
                        ai.reason ||
                        "The route was selected using the available safety information."
                    )}

                </p>

            </div>


            ${
                factors.length
                    ? `

                    <div class="ai-factors">

                        ${factors
                            .map(
                                factor => `

                                    <span>
                                        ✓
                                        ${escapeHTML(
                                            factor
                                        )}
                                    </span>

                                `
                            )
                            .join("")
                        }

                    </div>

                    `
                    : ""
            }

        </div>

    `;
}


/* =========================================================
   AI ERROR
   ========================================================= */

function renderAIError() {

    const box =
        $("aiRecommendation");


    if (!box) return;


    box.innerHTML = `

        <div class="ai-result">

            <div class="ai-title">
                🤖 AI Safety Analyst
            </div>

            <p>
                External AI analysis is currently unavailable.
            </p>

            <small>
                The local SafeRoute safety engine
                is still active.
            </small>

        </div>

    `;
}


/* =========================================================
   ADD COMMUNITY HAZARD
   ========================================================= */

function addHazard() {

    const type =
        $("hazardType")?.value;

    const location =
        $("hazardLocation")?.value;

    const note =
        $("hazardNote")?.value.trim();


    if (!type || !location) {

        toast(
            "Please select a hazard and location"
        );

        return;

    }


    const newHazard = {

        type,

        location,

        note:
            note ||
            "Community reported hazard",

        createdAt:
            new Date().toISOString()

    };


    communityHazards.push(
        newHazard
    );


    localStorage.setItem(
        "saferoute-hazards",
        JSON.stringify(
            communityHazards
        )
    );


    if ($("hazardNote")) {

        $("hazardNote").value =
            "";

    }


    drawMap();

    calculate();


    toast(
        "Community hazard added"
    );
}


/* =========================================================
   USER LOCATION
   ========================================================= */

function locateUser() {

    if (
        !navigator.geolocation
    ) {

        toast(
            "Geolocation is not supported by this browser"
        );

        return;

    }


    toast(
        "Getting your location..."
    );


    navigator.geolocation.getCurrentPosition(

        position => {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            console.log(
                "User location:",
                latitude,
                longitude
            );


            toast(
                "Your location was detected"
            );

        },

        error => {

            console.error(
                error
            );


            toast(
                "Unable to get your location"
            );

        }

    );
}


/* =========================================================
   MAP ZOOM
   ========================================================= */

function applyZoom() {

    const map =
        $("mapSvg");


    if (!map) return;


    map.style.transform =
        `scale(${zoom})`;

    map.style.transformOrigin =
        "center center";
}


/* =========================================================
   RISK CLASS
   ========================================================= */

function riskClass(risk) {

    if (risk < 0.20) {

        return "safe";

    }


    if (risk < 0.32) {

        return "caution";

    }


    return "risk";
}


/* =========================================================
   HAZARD COLOR
   ========================================================= */

function hazardColor(type) {

    switch (type) {

        case "accident":

            return "#ef4444";


        case "blocked":

            return "#f97316";


        case "pothole":

            return "#eab308";


        case "lighting":

            return "#a855f7";


        default:

            return "#ef4444";

    }
}


/* =========================================================
   PRETTY TEXT
   ========================================================= */

function pretty(value) {

    if (!value) return "";

    return String(value)
        .replace(
            /[-_]/g,
            " "
        )
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );
}


/* =========================================================
   AVERAGE
   ========================================================= */

function average(values) {

    if (!values.length) {

        return 0;

    }


    return (
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        ) / values.length
    );
}


/* =========================================================
   CREATE SVG ELEMENT
   ========================================================= */

function createSVG(
    tag,
    attributes
) {

    const element =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            tag
        );


    Object.entries(
        attributes
    ).forEach(
        ([key, value]) => {

            element.setAttribute(
                key,
                value
            );

        }
    );


    return element;
}


/* =========================================================
   HTML ESCAPE
   Prevents AI text from injecting HTML.
   ========================================================= */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value);


    return div.innerHTML;
}


/* =========================================================
   TOAST MESSAGE
   ========================================================= */

function toast(message) {

    let toastElement =
        $("toast");


    if (!toastElement) {

        toastElement =
            document.createElement(
                "div"
            );

        toastElement.id =
            "toast";

        toastElement.className =
            "toast";

        document.body.appendChild(
            toastElement
        );

    }


    toastElement.textContent =
        message;


    toastElement.classList.add(
        "show"
    );


    clearTimeout(
        toastElement._timer
    );


    toastElement._timer =
        setTimeout(
            () => {

                toastElement.classList.remove(
                    "show"
                );

            },
            2500
        );
}


/* =========================================================
   START APPLICATION
   ========================================================= */

init();