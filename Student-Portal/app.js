const API_URL =
    "https://script.google.com/macros/s/AKfycbwpxHUSvGKKJiY_teIjnUZRMSsiOdVaBH1uBA1EuML8BNZxwFjGniOLM0NUNDZReIp_/exec";

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

    message.innerHTML = "Loading...";

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

    currentStudent = data;

    document.getElementById("studentInfo").innerHTML = `

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

    allMarks = [];

    Object.entries(data.marks).forEach(
        ([subject, tests]) => {

            Object.entries(tests).forEach(
                ([test, mark]) => {

                    allMarks.push({
                        subject,
                        test,
                        mark
                    });

                }
            );
        }
    );

    renderMarks(allMarks);
}

function renderMarks(records) {

    const tbody =
        document.getElementById(
            "marksTableBody"
        );

    tbody.innerHTML = "";

    records.forEach(record => {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>
                <span class="subject-badge">
                    ${record.subject}
                </span>
            </td>
            <td>${record.test}</td>
            <td>${record.mark}</td>
        `;

        tbody.appendChild(row);
    });
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
                    item =>
                        item.test
                            .toLowerCase()
                            .includes(query) ||
                        item.subject
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

    // ----------------------------------------------------
    // 1. BRANDING & HEADER SECTION
    // ----------------------------------------------------
    // Top colored banner
    doc.setFillColor(41, 128, 185); // Professional Blue
    doc.rect(0, 0, 210, 30, 'F'); 

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Smart Learn Educare", 14, 20);

    // Document Title
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(16);
    doc.text("STUDENT REPORT CARD", 105, 42, { align: "center" });
    
    // Decorative underline
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(0.5);
    doc.line(14, 46, 196, 46);

    // ----------------------------------------------------
    // 2. STUDENT DETAILS (Two-Column Layout)
    // ----------------------------------------------------
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    
    let y = 55;
    const leftCol = 14;
    const rightCol = 110;

    // Helper to print bold label and normal text
    const printDetail = (label, value, x, yPos) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, x, yPos);
        doc.setFont("helvetica", "normal");
        // Offset the value dynamically based on label length, or use a fixed offset
        doc.text(`${value}`, x + 32, yPos); 
    };

    // Row 1
    printDetail("Name", currentStudent.name, leftCol, y);
    printDetail("Batch", currentStudent.batch, rightCol, y);
    y += 10;

    // Row 2
    printDetail("OMR ID", currentStudent.omr_id, leftCol, y);
    printDetail("Mentor", currentStudent.mentor, rightCol, y);
    y += 10;

    // Row 3
    printDetail("Reg ID", currentStudent.registration_id, leftCol, y);
    printDetail("Email", currentStudent.email, rightCol, y);

    // ----------------------------------------------------
    // 3. MARKS & TABLES
    // ----------------------------------------------------
    let startY = y + 20;

    Object.entries(currentStudent.marks).forEach(([subject, tests]) => {
        const rows = Object.entries(tests);

        if (rows.length === 0) return;

        // Calculate Average
        let totalMarks = 0;
        rows.forEach(row => {
            // Ensure we are adding numbers, safely parsing string values if necessary
            totalMarks += parseFloat(row[1]) || 0; 
        });
        const average = (totalMarks / rows.length).toFixed(2);

        // Page break protection for subjects
        if (startY > 250) { 
            doc.addPage();
            startY = 20;
        }

        // Subject Header
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(41, 128, 185); // Match branding color
        doc.text(subject.toUpperCase(), 14, startY);

        // Table Generation
        doc.autoTable({
            startY: startY + 4,
            theme: 'striped', // Cleaner, alternating row colors
            headStyles: { 
                fillColor: [41, 128, 185], 
                textColor: 255, 
                fontStyle: 'bold',
                halign: 'center' // Center align headers
            },
            columnStyles: {
                0: { halign: 'left' },
                1: { halign: 'center' } // Center align marks
            },
            // REQUIREMENT 1: Added (%) to Marks
            head: [["Test Name", "Marks (%)"]], 
            body: rows,
            // REQUIREMENT 2: Added Average footer
            foot: [["AVERAGE", `${average}%`]], 
            footStyles: { 
                fillColor: [230, 230, 230], 
                textColor: [50, 50, 50], 
                fontStyle: 'bold',
                halign: 'center'
            },
            margin: { left: 14, right: 14 }
        });

        // Update Y position for the next table (15px padding)
        startY = doc.lastAutoTable.finalY + 15; 
    });

    // Save the PDF
    doc.save(`${currentStudent.omr_id}_ReportCard.pdf`);
}
