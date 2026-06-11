const API_URL = "https://script.google.com/macros/s/AKfycby6iUXvkkGaKWaOOpOboaNkUsIGRa_YcpaozRLljHv_bokGslCOgBzVPsvNDTYoeBwm/exec";

let allMarks = [];
let currentStudent = null;

const loginBtn =
    document.getElementById("loginBtn");

const dashboard =
    document.getElementById("dashboard");

const loginContainer =
    document.getElementById("loginContainer");

const message =
    document.getElementById("message");

loginBtn.addEventListener(
    "click",
    login
);

async function login() {

    const username =
        document
            .getElementById("username")
            .value
            .trim();

    const password =
        document
            .getElementById("password")
            .value
            .trim();

    if (!username || !password) {

        message.innerHTML =
            '<span class="text-danger">Please enter both fields.</span>';

        return;
    }

    loginBtn.disabled = true;

    message.innerHTML =
        "Loading...";

    try {

        const url =
            `${API_URL}?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

        const response =
            await fetch(url);

        const data =
            await response.json();

        if (!data.success) {

            message.innerHTML =
                `<span class="text-danger">${data.message}</span>`;

            return;
        }

        renderDashboard(data);

    }
    catch (error) {

        console.error(error);

        message.innerHTML =
            '<span class="text-danger">Unable to connect to server.</span>';

    }
    finally {

        loginBtn.disabled = false;

    }

}

function renderDashboard(data) {

    loginContainer.classList.add("d-none");

    dashboard.classList.remove("d-none");

    const info =
        document.getElementById("studentInfo");

    currentStudent = data;

    info.innerHTML = `

<div class="student-profile">

    <div class="student-profile-header">
        <h4>${data.name}</h4>
        <span class="badge bg-primary">
            ${data.batch}
        </span>
    </div>

    <div class="student-grid">

        <div class="info-item">
            <div class="info-label">OMR ID</div>
            <div class="info-value">${data.omr_id}</div>
        </div>

        <div class="info-item">
            <div class="info-label">Registration ID</div>
            <div class="info-value">${data.registration_id}</div>
        </div>

        <div class="info-item">
            <div class="info-label">Roll Number</div>
            <div class="info-value">${data.roll_no}</div>
        </div>

        <div class="info-item">
            <div class="info-label">Batch</div>
            <div class="info-value">${data.batch}</div>
        </div>

        <div class="info-item">
            <div class="info-label">Mentor</div>
            <div class="info-value">${data.mentor}</div>
        </div>

        <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">${data.email}</div>
        </div>

    </div>

</div>

`;

    allMarks =
        Object.entries(
            data.marks
        );

    renderMarks(allMarks);

}

function renderMarks(records) {

    const tbody =
        document.getElementById(
            "marksTableBody"
        );

    tbody.innerHTML = "";

    for (const [test, mark] of records) {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>${test}</td>
            <td>${mark}</td>
        `;

        tbody.appendChild(row);
    }
}

document
    .getElementById("searchBox")
    .addEventListener(
        "input",
        function () {

            const query =
                this.value
                    .toLowerCase()
                    .trim();

            const filtered =
                allMarks.filter(
                    ([test]) =>
                        test
                            .toLowerCase()
                            .includes(query)
                );

            renderMarks(filtered);

        }
    );

document
    .getElementById("downloadPdfBtn")
    .addEventListener(
        "click",
        downloadPdf
    );

function downloadPdf() {

    if (!currentStudent) {
        return;
    }

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    doc.setFontSize(18);

    doc.text(
        "ABC Academy",
        14,
        20
    );

    doc.setFontSize(14);

    doc.text(
        "Student Report Card",
        14,
        30
    );

    doc.setFontSize(11);

    let y = 45;

    doc.text(
        `Name : ${currentStudent.name}`,
        14,
        y
    );

    y += 8;

    doc.text(
        `OMR ID : ${currentStudent.omr_id}`,
        14,
        y
    );

    y += 8;

    doc.text(
        `Registration ID : ${currentStudent.registration_id}`,
        14,
        y
    );

    y += 8;

    doc.text(
        `Batch : ${currentStudent.batch}`,
        14,
        y
    );

    y += 8;

    doc.text(
        `Mentor : ${currentStudent.mentor}`,
        14,
        y
    );

    y += 8;

    doc.text(
        `Email : ${currentStudent.email}`,
        14,
        y
    );

    const rows =
        Object.entries(
            currentStudent.marks
        );

    doc.autoTable({

        startY: 95,

        head: [
            ["Test Name", "Marks"]
        ],

        body: rows

    });

    doc.save(
        `${currentStudent.omr_id}_ReportCard.pdf`
    );

}