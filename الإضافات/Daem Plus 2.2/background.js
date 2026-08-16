// الخدمة الخلفية لتجاوز مشاكل CORS v1
const DASHBOARD_API = "https://tickets-daem.vercel.app/api/tickets-json";

// وظيفة جلب البيانات من الموقع (تتجاوز CORS لأنها تعمل في الخلفية)
async function fetchTickets() {
    try {
        const response = await fetch(DASHBOARD_API);
        if (response.ok) {
            const data = await response.json();
            return data;
        }
    } catch (error) {
        console.error("Error fetching tickets in background:", error);
    }
    return null;
}

// وظيفة إنشاء بلاغ جديد مباشرة في قاعدة بيانات الموقع
async function createTicket(ticketData) {
    try {
        const response = await fetch("https://tickets-daem.vercel.app/api/create-ticket", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(ticketData)
        });
        if (response.ok) {
            return { success: true };
        } else {
            const errText = await response.text();
            return { success: false, error: errText };
        }
    } catch (error) {
        console.error("Error creating ticket in background:", error);
        return { success: false, error: error.message };
    }
}

// الاستماع لطلبات المحتوى (content script)
async function updateTicketDate(ticketNumber, date) {
    try {
        const response = await fetch("https://tickets-daem.vercel.app/api/update-ticket", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                number: ticketNumber,
                date: date
            })
        });
        if (response.ok) {
            return { success: true };
        } else {
            const errText = await response.text();
            return { success: false, error: errText };
        }
    } catch (error) {
        console.error("Error updating ticket date in background:", error);
        return { success: false, error: error.message };
    }
}

async function correctSpelling(text) {
    try {
        const response = await fetch("https://tickets-daem.vercel.app/api/correct-spelling", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text })
        });
        if (response.ok) {
            const data = await response.json();
            return { success: true, correctedText: data.correctedText, errorCount: data.errorCount || 0 };
        } else {
            const errText = await response.text();
            return { success: false, error: errText };
        }

    } catch (error) {
        console.error("Error correcting spelling in background:", error);
        return { success: false, error: error.message };
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "FETCH_TICKETS") {
        fetchTickets().then(data => sendResponse({ tickets: data }));
        return true; // إخبار المتصفح بأن الاستجابة غير متزامنة
    }
    if (request.action === "CREATE_TICKET") {
        createTicket(request.data).then(res => sendResponse(res));
        return true;
    }
    if (request.action === "UPDATE_TICKET_DATE") {
        updateTicketDate(request.data.ticketNumber, request.data.date).then(res => sendResponse(res));
        return true;
    }
    if (request.action === "CORRECT_SPELLING") {
        correctSpelling(request.data.text).then(res => sendResponse(res));
        return true;
    }
    if (request.action === "UPDATE_SOLUTION") {
        updateSolution(request.data.number, request.data.solution).then(res => sendResponse(res));
        return true;
    }
});

async function updateSolution(ticketNumber, solution) {
    try {
        const response = await fetch("https://tickets-daem.vercel.app/api/update-ticket", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ number: ticketNumber, solution: solution })
        });
        if (response.ok) return { success: true };
        const errText = await response.text();
        return { success: false, error: errText };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
