"use strict";


const CONFIG = {

    API_BASE_URL:
        "https://medicalocr.onrender.com",

    EXTRACT_ENDPOINT:
        "/extract",

    MAX_FILE_SIZE:
        20 * 1024 * 1024,

    REQUEST_TIMEOUT:
        600000

};


const fileInput =
    document.getElementById("fileInput");

const uploadArea =
    document.getElementById("uploadArea");

const extractButton =
    document.getElementById("extractButton");

const buttonText =
    document.getElementById("buttonText");

const buttonLoader =
    document.getElementById("buttonLoader");

const selectedFile =
    document.getElementById("selectedFile");

const fileName =
    document.getElementById("fileName");

const fileSize =
    document.getElementById("fileSize");

const removeFile =
    document.getElementById("removeFile");

const loading =
    document.getElementById("loading");

const errorMessage =
    document.getElementById("errorMessage");

const errorText =
    document.getElementById("errorText");

const results =
    document.getElementById("results");

const observationsContainer =
    document.getElementById(
        "observationsContainer"
    );

const jsonOutput =
    document.getElementById("jsonOutput");

const totalObservations =
    document.getElementById(
        "totalObservations"
    );

const normalObservations =
    document.getElementById(
        "normalObservations"
    );

const abnormalObservations =
    document.getElementById(
        "abnormalObservations"
    );

const copyJsonButton =
    document.getElementById(
        "copyJsonButton"
    );

const downloadJsonButton =
    document.getElementById(
        "downloadJsonButton"
    );

const toggleJsonButton =
    document.getElementById(
        "toggleJsonButton"
    );

const jsonContainer =
    document.getElementById(
        "jsonContainer"
    );


let selectedPdf = null;

let latestFhirResponse = null;


document.addEventListener(
    "DOMContentLoaded",
    initialize
);


function initialize() {

    fileInput.addEventListener(
        "change",
        handleFileSelection
    );


    extractButton.addEventListener(
        "click",
        handleExtraction
    );


    removeFile.addEventListener(
        "click",
        clearSelectedFile
    );


    uploadArea.addEventListener(
        "dragover",
        handleDragOver
    );


    uploadArea.addEventListener(
        "dragleave",
        handleDragLeave
    );


    uploadArea.addEventListener(
        "drop",
        handleDrop
    );


    copyJsonButton.addEventListener(
        "click",
        copyJson
    );


    downloadJsonButton.addEventListener(
        "click",
        downloadJson
    );


    toggleJsonButton.addEventListener(
        "click",
        toggleJson
    );

}


function handleFileSelection(event) {

    const files = event.target.files;

    if (!files || files.length === 0) {

        return;

    }


    processSelectedFile(files[0]);

}



function handleDragOver(event) {

    event.preventDefault();

    uploadArea.classList.add(
        "dragover"
    );

}



function handleDragLeave(event) {

    event.preventDefault();

    uploadArea.classList.remove(
        "dragover"
    );

}


function handleDrop(event) {

    event.preventDefault();

    uploadArea.classList.remove(
        "dragover"
    );


    const files =
        event.dataTransfer.files;


    if (!files || files.length === 0) {

        return;

    }


    processSelectedFile(files[0]);

}



function processSelectedFile(file) {

    clearError();


    if (!isPdf(file)) {

        showError(
            "Please select a valid PDF medical report."
        );

        return;

    }


    if (
        file.size >
        CONFIG.MAX_FILE_SIZE
    ) {

        showError(
            "File size must be less than 20 MB."
        );

        return;

    }


    if (file.size === 0) {

        showError(
            "The selected PDF is empty."
        );

        return;

    }


    selectedPdf = file;


    displaySelectedFile(file);


    extractButton.disabled = false;

}



function isPdf(file) {

    const name =
        file.name.toLowerCase();


    return (
        file.type === "application/pdf" ||
        name.endsWith(".pdf")
    );

}



function displaySelectedFile(file) {

    fileName.textContent =
        file.name;

    fileSize.textContent =
        formatFileSize(file.size);


    selectedFile.classList.remove(
        "hidden"
    );

}



function formatFileSize(bytes) {

    if (bytes < 1024) {

        return `${bytes} B`;

    }


    if (bytes < 1024 * 1024) {

        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;

    }


    return `${(
        bytes /
        (1024 * 1024)
    ).toFixed(2)} MB`;

}



function clearSelectedFile() {

    selectedPdf = null;

    fileInput.value = "";

    fileName.textContent = "";

    fileSize.textContent = "";

    selectedFile.classList.add(
        "hidden"
    );

    extractButton.disabled = true;

    results.classList.add(
        "hidden"
    );

    clearError();

}



async function handleExtraction() {

    if (!selectedPdf) {

        showError(
            "Please select a PDF file first."
        );

        return;

    }


    setLoading(true);

    clearError();

    results.classList.add(
        "hidden"
    );


    try {

        const formData =
            new FormData();


        formData.append(
            "file",
            selectedPdf
        );


        const response =
            await fetchWithTimeout(
                CONFIG.API_BASE_URL +
                CONFIG.EXTRACT_ENDPOINT,

                {
                    method: "POST",

                    body: formData,

                    headers: buildHeaders()

                },

                CONFIG.REQUEST_TIMEOUT
            );


        const responseText =
            await response.text();


        let responseData;


        try {

            responseData =
                responseText
                    ? JSON.parse(
                        responseText
                    )
                    : null;

        } catch (parseError) {

            throw new Error(
                "The server returned an invalid JSON response."
            );

        }


        if (!response.ok) {

            throw new Error(
                getApiErrorMessage(
                    response.status,
                    responseData
                )
            );

        }


        if (!responseData) {

            throw new Error(
                "The API returned an empty response."
            );

        }


        latestFhirResponse =
            responseData;


        renderResults(
            responseData
        );


    } catch (error) {

        console.error(
            "Medical OCR request failed:",
            error
        );


        showError(
            getFriendlyErrorMessage(
                error
            )
        );


    } finally {

        setLoading(false);

    }

}




function buildHeaders() {


    return {};

}




async function fetchWithTimeout(
    url,
    options,
    timeout
) {

    const controller =
        new AbortController();


    const timeoutId =
        setTimeout(
            () => controller.abort(),
            timeout
        );


    try {

        return await fetch(
            url,
            {
                ...options,
                signal:
                    controller.signal
            }
        );

    } finally {

        clearTimeout(
            timeoutId
        );

    }

}



function getApiErrorMessage(
    status,
    data
) {

    if (
        data &&
        typeof data.message === "string"
    ) {

        return data.message;

    }


    switch (status) {

        case 400:

            return "Invalid medical report or request.";

        case 401:

            return "Authentication is required by the API.";

        case 403:

            return "Access to this API endpoint is forbidden.";

        case 404:

            return "The OCR endpoint was not found.";

        case 413:

            return "The uploaded PDF is too large.";

        case 500:

            return "The OCR service encountered a server error.";

        case 502:

            return "The OCR service is temporarily unavailable.";

        case 503:

            return "The OCR service is currently unavailable.";

        default:

            return `API request failed with status ${status}.`;

    }

}



function getFriendlyErrorMessage(
    error
) {

    if (
        error &&
        error.name === "AbortError"
    ) {

        return (
            "The OCR request took too long. " +
            "Please try again. The deployed service may " +
            "need some time to start processing the PDF."
        );

    }


    if (
        error &&
        error instanceof TypeError
    ) {

        return (
            "Unable to connect to the deployed OCR API. " +
            "Please check the API status and browser network connection."
        );

    }


    return error?.message ||
        "Something went wrong while processing the report.";

}



function setLoading(isLoading) {

    extractButton.disabled =
        isLoading ||
        !selectedPdf;


    if (isLoading) {

        loading.classList.remove(
            "hidden"
        );

        buttonText.textContent =
            "Processing...";

        buttonLoader.classList.remove(
            "hidden"
        );

    } else {

        loading.classList.add(
            "hidden"
        );

        buttonText.textContent =
            "Extract Medical Data";

        buttonLoader.classList.add(
            "hidden"
        );

    }

}



function renderResults(
    fhirBundle
) {

    const observations =
        extractObservations(
            fhirBundle
        );


    if (observations.length === 0) {

        throw new Error(
            "No medical observations were found in the API response."
        );

    }


    renderSummary(
        observations
    );


    renderObservationCards(
        observations
    );


    renderJson(
        fhirBundle
    );


    results.classList.remove(
        "hidden"
    );


    results.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


function extractObservations(
    bundle
) {

    if (
        !bundle ||
        bundle.resourceType !== "Bundle"
    ) {

        throw new Error(
            "Invalid FHIR response. Expected a Bundle."
        );

    }


    if (
        !Array.isArray(bundle.entry)
    ) {

        return [];

    }


    return bundle.entry

        .map(
            entry => entry?.resource
        )

        .filter(
            resource =>
                resource?.resourceType ===
                "Observation"
        )

        .map(
            observation =>
                normalizeObservation(
                    observation
                )
        );

}



function normalizeObservation(
    observation
) {

    const coding =
        observation.code?.coding?.[0];


    const quantity =
        observation.valueQuantity;


    const interpretation =
        observation
            .interpretation?.[0]
            ?.coding?.[0];


    const referenceRange =
        observation
            .referenceRange?.[0];


    return {

        name:
            observation.code?.text ||
            coding?.display ||
            "Unknown Observation",


        loinc:
            coding?.code ||
            "N/A",


        value:
            quantity?.value ??
            null,


        unit:
            quantity?.unit ||
            quantity?.code ||
            "",


        interpretation:
            interpretation?.display ||
            "Unknown",


        interpretationCode:
            interpretation?.code ||
            "",


        referenceLow:
            referenceRange?.low?.value ??
            null,


        referenceHigh:
            referenceRange?.high?.value ??
            null,


        referenceUnit:
            referenceRange?.low?.unit ||
            referenceRange?.high?.unit ||
            quantity?.unit ||
            ""

    };

}



function renderSummary(
    observations
) {

    const total =
        observations.length;


    const normal =
        observations.filter(
            observation =>
                getStatus(
                    observation
                ) === "normal"
        ).length;


    const abnormal =
        total - normal;


    totalObservations.textContent =
        total;


    normalObservations.textContent =
        normal;


    abnormalObservations.textContent =
        abnormal;

}




function getStatus(
    observation
) {

    const code =
        observation
            .interpretationCode
            ?.toUpperCase();


    const display =
        observation
            .interpretation
            ?.toLowerCase();


    if (code === "N") {

        return "normal";

    }


    if (
        code === "H" ||
        display.includes("high")
    ) {

        return "high";

    }


    if (
        code === "L" ||
        display.includes("low")
    ) {

        return "low";

    }


    return "normal";

}




function renderObservationCards(
    observations
) {

    observationsContainer.innerHTML =
        "";


    observations.forEach(
        observation => {

            const card =
                createObservationCard(
                    observation
                );


            observationsContainer.appendChild(
                card
            );

        }
    );

}



function createObservationCard(
    observation
) {

    const status =
        getStatus(
            observation
        );


    const card =
        document.createElement(
            "article"
        );


    card.className =
        `observation-card ${status}`;


    const rangeText =
        formatReferenceRange(
            observation
        );


    const markerPosition =
        calculateMarkerPosition(
            observation
        );


    const displayValue =
        formatValue(
            observation.value
        );


    card.innerHTML = `

        <div class="observation-top">

            <span class="observation-name">

                ${escapeHtml(
                    observation.name
                )}

            </span>

            <span class="loinc">

                LOINC:
                ${escapeHtml(
                    observation.loinc
                )}

            </span>

        </div>


        <div class="observation-value">

            <span class="value">

                ${escapeHtml(
                    displayValue
                )}

            </span>

            <span class="unit">

                ${escapeHtml(
                    observation.unit
                )}

            </span>

        </div>


        <div class="status ${status}">

            <span class="status-dot-small"></span>

            ${escapeHtml(
                getStatusLabel(status)
            )}

        </div>


        <div class="range-section">

            <div class="range-header">

                <span>
                    Reference range
                </span>

                <span>
                    ${escapeHtml(
                        rangeText
                    )}
                </span>

            </div>


            <div class="range-bar">

                <div class="range-normal"></div>

                <div
                    class="range-marker"
                    style="left:${markerPosition}%"
                ></div>

            </div>

        </div>


        <div class="reference-range">

            Reference:
            <strong>
                ${escapeHtml(
                    rangeText
                )}
            </strong>

        </div>

    `;


    return card;

}



function getStatusLabel(
    status
) {

    switch (status) {

        case "high":

            return "High";

        case "low":

            return "Low";

        default:

            return "Normal";

    }

}



function formatValue(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "N/A";

    }


    return Number.isInteger(value)
        ? String(value)
        : String(value);

}



function formatReferenceRange(
    observation
) {

    const low =
        observation.referenceLow;


    const high =
        observation.referenceHigh;


    if (
        low === null &&
        high === null
    ) {

        return "Not specified";

    }


    if (low === null) {

        return `≤ ${high}`;

    }


    if (high === null) {

        return `≥ ${low}`;

    }


    return `${low} – ${high} ${
        observation.referenceUnit || ""
    }`.trim();

}



function calculateMarkerPosition(
    observation
) {

    const value =
        Number(
            observation.value
        );


    const low =
        Number(
            observation.referenceLow
        );


    const high =
        Number(
            observation.referenceHigh
        );


    if (
        !Number.isFinite(value) ||
        !Number.isFinite(low) ||
        !Number.isFinite(high) ||
        high <= low
    ) {

        return 50;

    }


   

    const range =
        high - low;


    const visualMin =
        low - range;


    const visualMax =
        high + range;


    let position =
        (
            (value - visualMin) /
            (visualMax - visualMin)
        ) * 100;


    position =
        Math.max(
            2,
            Math.min(
                98,
                position
            )
        );


    return position;

}




function renderJson(
    data
) {

    jsonOutput.textContent =
        JSON.stringify(
            data,
            null,
            2
        );

}


// =========================================================
// TOGGLE JSON
// =========================================================

function toggleJson() {

    const hidden =
        jsonContainer.classList.contains(
            "hidden"
        );


    if (hidden) {

        jsonContainer.classList.remove(
            "hidden"
        );

        toggleJsonButton.textContent =
            "Hide JSON";

    } else {

        jsonContainer.classList.add(
            "hidden"
        );

        toggleJsonButton.textContent =
            "View JSON";

    }

}



async function copyJson() {

    if (!latestFhirResponse) {

        return;

    }


    try {

        await navigator.clipboard.writeText(
            JSON.stringify(
                latestFhirResponse,
                null,
                2
            )
        );


        const originalText =
            copyJsonButton.textContent;


        copyJsonButton.textContent =
            "Copied ✓";


        setTimeout(
            () => {

                copyJsonButton.textContent =
                    originalText;

            },
            1500
        );


    } catch (error) {

        console.error(
            "Unable to copy JSON:",
            error
        );

        showError(
            "Unable to copy JSON. Please copy it manually."
        );

    }

}




function downloadJson() {

    if (!latestFhirResponse) {

        return;

    }


    const json =
        JSON.stringify(
            latestFhirResponse,
            null,
            2
        );


    const blob =
        new Blob(
            [json],
            {
                type:
                    "application/fhir+json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        "medical-report-fhir.json";


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );

}


// =========================================================
// ERROR
// =========================================================

function showError(
    message
) {

    errorText.textContent =
        message;


    errorMessage.classList.remove(
        "hidden"
    );


    errorMessage.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });

}


// =========================================================
// CLEAR ERROR
// =========================================================

function clearError() {

    errorText.textContent =
        "";

    errorMessage.classList.add(
        "hidden"
    );

}


function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}