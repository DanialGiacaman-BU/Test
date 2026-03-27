const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwllBqWQNSSRgQmEdCu5RCK0vEclnxZhC7uwiuBuewQin76yMqmix-Mx9ISqLMPOWK_/exec';
let scheduleData = [];

// 1. Authenticate with Google Identity
function handleCredentialResponse(response) {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    console.log("Welcome:", payload.name);
    if (!payload.email.endsWith('@bethlehem.edu')) {
        alert("Access Denied: Please use a Bethlehem University account.");
        location.reload();
    }
}

// 2. Fetch data via GET
async function fetchSchedule() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '<tr><td colspan="4" class="py-12 text-center text-bu-navy font-bold animate-pulse uppercase text-xs">Synchronizing Database...</td></tr>';

    try {
        const response = await fetch(WEB_APP_URL);
        scheduleData = await response.json();
        
        tbody.innerHTML = '';
        scheduleData.forEach(row => {
            const statusClass = row.Status.toLowerCase() === 'approved' ? 'status-approved' : 'status-pending';
            tbody.innerHTML += `
                <tr class="border-b border-gray-50">
                    <td class="py-5 font-bold text-bu-navy">${row.Reservation_Date}</td>
                    <td class="py-5 text-gray-500 font-medium">${row.Select_a_Room}</td>
                    <td class="py-5 font-mono text-xs">${row.Reservation_Start_Time} - ${row.Reservation_End_Time}</td>
                    <td class="py-5"><span class="status-pill ${statusClass}">${row.Status}</span></td>
                </tr>`;
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="4" class="py-12 text-center text-red-500">API Connection Failed</td></tr>';
    }
}

// 3. Post data via Form
document.getElementById('reservationForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.innerText = 'TRANSMITTING...';
    btn.disabled = true;

    const payload = Object.fromEntries(new FormData(this));

    try {
        // We use mode: 'no-cors' for Google Apps Script redirects
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(payload)
        });
        alert('Booking Request Received!');
        this.reset();
        fetchSchedule();
    } catch (err) {
        alert('Transmission Error');
    } finally {
        btn.innerText = 'Confirm Reservation';
        btn.disabled = false;
    }
});

// 4. Excel Export
function exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(scheduleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reservations");
    XLSX.writeFile(wb, "BU_Lab_Schedule.xlsx");
}

// Init
window.onload = fetchSchedule;