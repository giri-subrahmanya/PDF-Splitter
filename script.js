const pdfFileInput = document.getElementById("pdfFile");
const pageCountSpan = document.getElementById("pageCount");
const pdfNameSpan = document.getElementById("pdfName");

const textarea = document.getElementById("sheetData");
const previewBody = document.getElementById("previewBody");

const validationStatus = document.getElementById("validationStatus");

const generateBtn = document.getElementById("generateBtn");

const downloadBtn = document.getElementById("downloadBtn");

const summaryCard = document.getElementById("summaryCard");
const summaryText = document.getElementById("summaryText");

const zipNameInput = document.getElementById("zipName");

let pdfBytes = null;
let pageCount = 0;
let parsedData = [];
let generatedZipBlob = null;

function showModal(title, message) {

    document.getElementById("modalTitle").innerText = title;
    document.getElementById("modalBody").innerText = message;

    new bootstrap.Modal(
        document.getElementById("messageModal")
    ).show();
}

async function getPdfPageCount(file) {

    const buffer = await file.arrayBuffer();

    const pdf = await PDFLib.PDFDocument.load(buffer);

    return pdf.getPageCount();
}

pdfFileInput.addEventListener("change", async () => {

    try {

        const file = pdfFileInput.files[0];

        if (!file) return;

        pdfBytes = await file.arrayBuffer();

        pageCount = await getPdfPageCount(file);

        pdfNameSpan.textContent = file.name;
        pageCountSpan.textContent = pageCount;

        validateAll();

    } catch (err) {

        showModal(
            "PDF Error",
            err.message
        );
    }
});

textarea.addEventListener("input", () => {

    parseData();
    validateAll();
});

zipNameInput.addEventListener("input", validateAll);

function parseData() {

    parsedData = [];

    previewBody.innerHTML = "";

    const rows = textarea.value
        .trim()
        .split("\n")
        .filter(x => x.trim());

    rows.forEach(row => {

        let parts;

        if (row.includes("\t")) {
            parts = row.split("\t");
        } else {
            parts = row.split(",");
        }

        if (parts.length >= 2) {

            const page = Number(parts[0].trim());

            const name = parts
                .slice(1)
                .join(" ")
                .trim();

            parsedData.push({
                page,
                name
            });

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${page}</td>
                <td>${name}</td>
            `;

            previewBody.appendChild(tr);
        }
    });
}

function validateAll() {

    try {

        if (!pdfBytes || !zipNameInput.value.trim()) {

            generateBtn.disabled = true;
            return;
        }

        if (parsedData.length === 0) {

            generateBtn.disabled = true;
            return;
        }

        if (parsedData[0].page !== 1) {
            throw new Error("First start page must be 1.");
        }

        const names = new Set();

        for (let i = 0; i < parsedData.length; i++) {

            const row = parsedData[i];

            if (!Number.isInteger(row.page) || row.page < 1) {
                throw new Error(`Invalid page number at row ${i + 1}`);
            }

            if (!row.name) {
                throw new Error(`Missing name at row ${i + 1}`);
            }

            if (names.has(row.name)) {
                throw new Error(`Duplicate name: ${row.name}`);
            }

            names.add(row.name);

            if (row.page > pageCount) {
                throw new Error(
                    `Page ${row.page} exceeds PDF length (${pageCount})`
                );
            }

            if (i > 0) {

                if (
                    row.page <= parsedData[i - 1].page
                ) {
                    throw new Error(
                        `Pages must be strictly increasing`
                    );
                }
            }
        }

        validationStatus.innerHTML =
            `<span class="status-valid">✓ Data Valid</span>`;

        generateBtn.disabled = false;

    } catch (err) {

        validationStatus.innerHTML =
            `<span class="status-invalid">✗ ${err.message}</span>`;

        generateBtn.disabled = true;
    }
}

function sanitizeFileName(name) {

    return name.replace(/[<>:"/\\|?*]/g, "_");
}

generateBtn.addEventListener("click", async () => {

    try {

        generateBtn.disabled = true;
        generateBtn.innerHTML =
            `<span class="spinner-border spinner-border-sm"></span> Generating...`;

        const sourcePdf =
            await PDFLib.PDFDocument.load(pdfBytes);

        const zip = new JSZip();

        for (let i = 0; i < parsedData.length; i++) {

            const current = parsedData[i];

            const start =
                current.page - 1;

            const end =
                i < parsedData.length - 1
                ? parsedData[i + 1].page - 2
                : pageCount - 1;

            const newPdf =
                await PDFLib.PDFDocument.create();

            const copiedPages =
                await newPdf.copyPages(
                    sourcePdf,
                    Array.from(
                        { length: end - start + 1 },
                        (_, k) => start + k
                    )
                );

            copiedPages.forEach(p =>
                newPdf.addPage(p)
            );

            const bytes =
                await newPdf.save();

            zip.file(
                `${sanitizeFileName(current.name)}.pdf`,
                bytes
            );
        }

        generatedZipBlob =
            await zip.generateAsync({
                type: "blob"
            });

        summaryCard.classList.remove("d-none");

        summaryText.innerHTML = `
            PDF Pages: ${pageCount}<br>
            Entries: ${parsedData.length}<br>
            Generated PDFs: ${parsedData.length}
        `;

        showModal(
            "Success",
            "PDFs generated successfully."
        );

    } catch (err) {

        showModal(
            "Generation Error",
            err.message
        );

    } finally {

        generateBtn.disabled = false;
        generateBtn.innerHTML =
            "Generate PDFs";
    }
});

downloadBtn.addEventListener("click", () => {

    const name =
        zipNameInput.value.trim();

    const link =
        document.createElement("a");

    link.href =
        URL.createObjectURL(
            generatedZipBlob
        );

    link.download =
        `${name}.zip`;

    link.click();
});