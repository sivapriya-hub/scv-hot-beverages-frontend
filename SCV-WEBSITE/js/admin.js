/* ==========================================================================
   SCV ADMIN DASHBOARD SCRIPT
   ========================================================================== */

const API_BASE_URL = "http://localhost:8080/api/inquiries";

// Dashboard State
let currentPage = 0;
let pageSize = 10;
let searchQuery = "";
let statusFilter = "ALL";
let inquiryToDeleteId = null;

// DOM Elements
const inquiryTableBody = document.getElementById("inquiryTableBody");
const tableLoader = document.getElementById("table-loader");
const tableEmpty = document.getElementById("table-empty");
const paginationInfo = document.getElementById("pagination-info");
const paginationControls = document.getElementById("pagination-controls");
const searchInput = document.getElementById("search-input");
const statusFilterSelect = document.getElementById("status-filter");
const pageSizeSelect = document.getElementById("page-size");
const btnSearch = document.getElementById("btn-search");
const btnConfirmDelete = document.getElementById("btn-confirm-delete");

// Initialize on DOM Load
document.addEventListener("DOMContentLoaded", () => {
    // Initial fetches
    fetchStatistics();
    fetchInquiries();

    // Event Listeners
    btnSearch.addEventListener("click", handleSearch);
    
    searchInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            handleSearch();
        }
    });

    statusFilterSelect.addEventListener("change", () => {
        statusFilter = statusFilterSelect.value;
        currentPage = 0; // Reset to first page
        fetchInquiries();
    });

    pageSizeSelect.addEventListener("change", () => {
        pageSize = parseInt(pageSizeSelect.value, 10);
        currentPage = 0; // Reset to first page
        fetchInquiries();
    });

    btnConfirmDelete.addEventListener("click", executeDelete);
});

// Fetch Count Statistics
async function fetchStatistics() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (!response.ok) throw new Error("Failed to fetch statistics");
        
        const stats = await response.json();
        
        // Update stats widgets
        document.getElementById("stat-total").innerText = stats.total || 0;
        document.getElementById("stat-new").innerText = stats.NEW || 0;
        document.getElementById("stat-contacted").innerText = stats.CONTACTED || 0;
        document.getElementById("stat-inprogress").innerText = stats.IN_PROGRESS || 0;
        document.getElementById("stat-completed").innerText = stats.COMPLETED || 0;
    } catch (error) {
        console.error("Error fetching statistics:", error);
        showToast("Error updating dashboard statistics.", "error");
    }
}

// Fetch Paginated Inquiries
async function fetchInquiries() {
    showLoader(true);
    
    // Construct URL with query parameters
    const params = new URLSearchParams({
        page: currentPage,
        size: pageSize,
        sortBy: "id",
        direction: "desc"
    });
    
    if (statusFilter && statusFilter !== "ALL") {
        params.append("status", statusFilter);
    }
    
    if (searchQuery.trim() !== "") {
        params.append("search", searchQuery.trim());
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to load inquiries list");
        
        const pageData = await response.json();
        renderTable(pageData.content || []);
        renderPagination(pageData);
    } catch (error) {
        console.error("Error loading inquiries:", error);
        showToast("Failed to load inquiries. Make sure backend is running.", "error");
        renderTable([]);
    } finally {
        showLoader(false);
    }
}

// Handle Search Click
function handleSearch() {
    searchQuery = searchInput.value;
    currentPage = 0; // Reset to first page
    fetchInquiries();
}

// Show/Hide Table Loader
function showLoader(visible) {
    if (visible) {
        tableLoader.style.display = "block";
        inquiryTableBody.style.display = "none";
        tableEmpty.style.display = "none";
    } else {
        tableLoader.style.display = "none";
        inquiryTableBody.style.display = "table-row-group";
    }
}

// Render Table Rows
function renderTable(inquiries) {
    inquiryTableBody.innerHTML = "";
    
    if (inquiries.length === 0) {
        tableEmpty.style.display = "block";
        return;
    }
    
    tableEmpty.style.display = "none";
    
    inquiries.forEach(inquiry => {
        const row = document.createElement("tr");
        row.className = "table-row";
        
        // Truncate requirements for visual neatness
        const reqs = inquiry.requirements || "N/A";
        const truncatedReqs = reqs.length > 50 ? reqs.substring(0, 50) + "..." : reqs;
        
        // Format Date
        let formattedDate = "N/A";
        if (inquiry.createdAt) {
            const date = new Date(inquiry.createdAt);
            formattedDate = date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        row.innerHTML = `
            <td>#${inquiry.id}</td>
            <td>${formattedDate}</td>
            <td style="font-weight: 600;">${escapeHtml(inquiry.name)}</td>
            <td>${escapeHtml(inquiry.companyName || "N/A")}</td>
            <td>${escapeHtml(inquiry.phone)}</td>
            <td>${escapeHtml(inquiry.email || "N/A")}</td>
            <td>
                <select class="status-select badge badge-${(inquiry.status || "NEW").toLowerCase()}" onchange="changeInquiryStatus(${inquiry.id}, this.value, event)">
                    <option value="NEW" ${inquiry.status === "NEW" ? "selected" : ""}>New</option>
                    <option value="CONTACTED" ${inquiry.status === "CONTACTED" ? "selected" : ""}>Contacted</option>
                    <option value="IN_PROGRESS" ${inquiry.status === "IN_PROGRESS" ? "selected" : ""}>In Progress</option>
                    <option value="COMPLETED" ${inquiry.status === "COMPLETED" ? "selected" : ""}>Completed</option>
                </select>
            </td>
            <td class="actions-cell">
                <button class="btn-icon view" title="View Details" onclick="viewInquiryDetails(${inquiry.id}, event)">
                    <!-- Eye Icon -->
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
                <button class="btn-icon delete" title="Delete Inquiry" onclick="confirmDeleteInquiry(${inquiry.id}, '${escapeQuote(inquiry.name)}', event)">
                    <!-- Trash Icon -->
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </td>
        `;
        
        // Clicking row opens details modal, but clicking select dropdown or action buttons should not trigger row action.
        row.addEventListener("click", (e) => {
            if (!e.target.closest("select") && !e.target.closest("button")) {
                viewInquiryDetails(inquiry.id);
            }
        });
        
        inquiryTableBody.appendChild(row);
    });
}

// Render Pagination Footer Controls
function renderPagination(pageData) {
    const totalElements = pageData.totalElements || 0;
    const totalPages = pageData.totalPages || 0;
    const firstElement = totalElements === 0 ? 0 : (currentPage * pageSize) + 1;
    const lastElement = Math.min((currentPage + 1) * pageSize, totalElements);
    
    // Update pagination info text
    paginationInfo.innerText = `Showing ${firstElement} to ${lastElement} of ${totalElements} inquiries`;
    
    paginationControls.innerHTML = "";
    
    if (totalPages <= 1) return; // No pagination controls needed
    
    // Previous Page Button
    const prevBtn = document.createElement("button");
    prevBtn.className = "btn-pagination";
    prevBtn.innerHTML = "&laquo; Prev";
    prevBtn.disabled = currentPage === 0;
    prevBtn.onclick = () => {
        if (currentPage > 0) {
            currentPage--;
            fetchInquiries();
        }
    };
    paginationControls.appendChild(prevBtn);
    
    // Page Numbers
    const startPage = Math.max(0, currentPage - 2);
    const endPage = Math.min(totalPages - 1, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement("button");
        pageBtn.className = `btn-pagination ${currentPage === i ? "active" : ""}`;
        pageBtn.innerText = i + 1;
        pageBtn.onclick = () => {
            currentPage = i;
            fetchInquiries();
        };
        paginationControls.appendChild(pageBtn);
    }
    
    // Next Page Button
    const nextBtn = document.createElement("button");
    nextBtn.className = "btn-pagination";
    nextBtn.innerHTML = "Next &raquo;";
    nextBtn.disabled = currentPage === totalPages - 1;
    nextBtn.onclick = () => {
        if (currentPage < totalPages - 1) {
            currentPage++;
            fetchInquiries();
        }
    };
    paginationControls.appendChild(nextBtn);
}

// Change Status PUT Request
async function changeInquiryStatus(id, newStatus, event) {
    if (event) event.stopPropagation(); // Avoid triggering row click details view
    
    try {
        // Fetch current object first to avoid overwriting details
        const getResponse = await fetch(`${API_BASE_URL}/${id}`);
        if (!getResponse.ok) throw new Error("Failed to get current details");
        
        const inquiry = await getResponse.json();
        inquiry.status = newStatus;
        
        const putResponse = await fetch(`${API_BASE_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(inquiry)
        });
        
        if (!putResponse.ok) throw new Error("Failed to save updated status");
        
        showToast(`Status updated successfully to ${newStatus}.`);
        fetchStatistics(); // Update widget counts
        
        // Re-render select class so badge colors match
        const selectEl = document.querySelector(`select[onchange*="${id}"]`);
        if (selectEl) {
            selectEl.className = `status-select badge badge-${newStatus.toLowerCase()}`;
        }
    } catch (error) {
        console.error("Error updating status:", error);
        showToast("Failed to update inquiry status.", "error");
        fetchInquiries(); // Reload on error to restore correct status
    }
}

// Open Details Modal
async function viewInquiryDetails(id, event) {
    if (event) event.stopPropagation();
    
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        if (!response.ok) throw new Error("Inquiry details could not be found");
        
        const inquiry = await response.json();
        
        // Populate fields
        document.getElementById("detail-id").innerText = `#${inquiry.id}`;
        
        // Format Date
        let formattedDate = "N/A";
        if (inquiry.createdAt) {
            formattedDate = new Date(inquiry.createdAt).toLocaleString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
        
        document.getElementById("detail-date").innerText = formattedDate;
        document.getElementById("detail-name").innerText = inquiry.name;
        document.getElementById("detail-company").innerText = inquiry.companyName || "N/A";
        document.getElementById("detail-phone").innerText = inquiry.phone;
        document.getElementById("detail-email").innerText = inquiry.email || "N/A";
        document.getElementById("detail-status").innerHTML = `<span class="badge badge-${(inquiry.status || "NEW").toLowerCase()}">${inquiry.status || "NEW"}</span>`;
        document.getElementById("detail-requirements").innerText = inquiry.requirements || "No requirements provided.";
        
        openModal("details-modal");
    } catch (error) {
        console.error("Error loading details modal:", error);
        showToast("Error retrieving inquiry details.", "error");
    }
}

// Confirm Delete Modal Trigger
function confirmDeleteInquiry(id, name, event) {
    if (event) event.stopPropagation();
    
    inquiryToDeleteId = id;
    document.getElementById("delete-confirm-name").innerText = name;
    openModal("delete-modal");
}

// Execute Delete Request
async function executeDelete() {
    if (!inquiryToDeleteId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/${inquiryToDeleteId}`, {
            method: "DELETE"
        });
        
        if (!response.ok) throw new Error("Delete operation failed");
        
        showToast("Inquiry deleted successfully.");
        closeModal("delete-modal");
        
        fetchStatistics();
        fetchInquiries();
    } catch (error) {
        console.error("Error deleting inquiry:", error);
        showToast("Failed to delete inquiry.", "error");
    } finally {
        inquiryToDeleteId = null;
    }
}

// Modal Helpers
function openModal(modalId) {
    document.getElementById(modalId).classList.add("active");
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove("active");
}

// Close modals clicking outside container
window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
        e.target.classList.remove("active");
    }
});

// Toast Utilities
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    // Check type icon
    const icon = type === "success" 
        ? `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg>`
        : `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
        
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    
    // Remove toast after animation finishes (3 seconds)
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Utility Escaping Helpers
function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}

function escapeQuote(str) {
    if (!str) return "";
    return str.replace(/'/g, "\\'");
}
function logout() {

    localStorage.removeItem("loggedIn");

    window.location.href = "admin-login.html";

}