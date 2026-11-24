const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[character]));

const api = async (url, options = {}) => {
  const response = await fetch(url, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Request failed");
  return result;
};

const displayDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${String(value).replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? escapeHTML(value) : date.toLocaleString();
};

const showUploadResult = (message, type, errors = []) => {
  const output = document.getElementById("uploadResult");
  output.className = `notice ${type}`;
  output.replaceChildren(document.createTextNode(message));
  if (errors.length) {
    const list = document.createElement("ul");
    list.className = "error-list";
    errors.forEach((item) => {
      const reason = Array.isArray(item.errors) ? item.errors.join(", ") : "Invalid row";
      const line = document.createElement("li");
      line.textContent = `Row ${item.row}${item.transaction_id ? ` (${item.transaction_id})` : ""}: ${reason}`;
      list.append(line);
    });
    output.append(list);
  }
};

async function loadBatches() {
  const result = await api("/batches");
  const batches = result.data || [];
  document.getElementById("batchCount").textContent = batches.length;
  document.getElementById("transactionCount").textContent = batches.reduce((sum, batch) => sum + Number(batch.valid_records || 0), 0);
  document.getElementById("pendingCount").textContent = batches.reduce((sum, batch) => sum + Number(batch.pending_count || 0), 0);
  document.getElementById("authorizedCount").textContent = batches.reduce((sum, batch) => sum + Number(batch.authorized_count || 0), 0);

  const body = document.getElementById("batchRows");
  if (!batches.length) {
    body.innerHTML = '<tr><td colspan="9" class="empty">No batches uploaded yet.</td></tr>';
    return;
  }
  body.innerHTML = batches.map((batch) => {
    const id = Number(batch.id);
    const pending = Number(batch.pending_count || 0);
    return `<tr>
      <td>#${id}</td><td>${escapeHTML(batch.file_name)}</td>
      <td>${Number(batch.total_records || 0)}</td><td>${Number(batch.valid_records || 0)}</td>
      <td>${Number(batch.invalid_records || 0)}</td><td>${pending}</td>
      <td>${Number(batch.authorized_count || 0)}</td><td>${displayDate(batch.created_at)}</td>
      <td><button class="button secondary small" data-action="details" data-id="${id}">View</button>
      ${pending ? ` <button class="button small" data-action="approve" data-id="${id}">Approve</button>` : ""}</td>
    </tr>`;
  }).join("");
}

async function loadAuditLogs() {
  const result = await api("/audit-logs");
  const logs = result.data || [];
  const body = document.getElementById("auditRows");
  body.innerHTML = logs.length ? logs.map((log) => `<tr>
    <td>${displayDate(log.created_at)}</td><td>${log.batch_id ? `#${Number(log.batch_id)}` : "—"}</td>
    <td>${escapeHTML(log.action)}</td><td>${escapeHTML(log.performed_by)}</td><td>${escapeHTML(log.details || "—")}</td>
  </tr>`).join("") : '<tr><td colspan="5" class="empty">No audit entries yet.</td></tr>';
}

async function refresh() {
  const error = document.getElementById("pageError");
  error.textContent = "";
  try {
    await Promise.all([loadBatches(), loadAuditLogs()]);
  } catch (caught) {
    error.textContent = caught.message;
  }
}

document.getElementById("uploadForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = document.getElementById("csvFile");
  const button = document.getElementById("uploadButton");
  if (!input.files[0]) return;

  const form = new FormData();
  form.append("file", input.files[0]);
  form.append("performed_by", "MAKER");
  button.disabled = true;
  button.textContent = "Uploading…";

  try {
    const result = await api("/upload", { method: "POST", body: form });
    const data = result.data;
    showUploadResult(`Batch #${data.batchId} created: ${data.validRecords} valid, ${data.invalidRecords} invalid row(s).`, data.invalidRecords ? "error" : "success", data.errors || []);
    input.value = "";
    await refresh();
  } catch (error) {
    showUploadResult(error.message, "error");
  } finally {
    button.disabled = false;
    button.textContent = "Upload and validate";
  }
});

document.getElementById("batchRows").addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  const details = document.getElementById("batchDetails");
  document.getElementById("pageError").textContent = "";

  try {
    if (button.dataset.action === "approve") {
      button.disabled = true;
      const result = await api(`/batches/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ performed_by: "CHECKER" })
      });
      showUploadResult(`Batch #${id} approved. ${result.data.approvedCount} transaction(s) authorized.`, "success");
      await refresh();
      return;
    }

    const result = await api(`/batches/${id}`);
    const { batch, transactions } = result.data;
    details.hidden = false;
    details.innerHTML = `<h3>Batch #${Number(batch.id)} — ${escapeHTML(batch.file_name)}</h3>
      <div class="table-scroll"><table><thead><tr><th>Transaction ID</th><th>Customer</th><th>Account</th><th>Amount</th><th>Status</th></tr></thead>
      <tbody>${transactions.length ? transactions.map((transaction) => `<tr>
        <td>${escapeHTML(transaction.transaction_id)}</td><td>${escapeHTML(transaction.customer_name)}</td>
        <td>${escapeHTML(transaction.account_number)}</td><td>${Number(transaction.amount).toLocaleString()}</td>
        <td><span class="status ${transaction.status === "AUTHORIZED" ? "authorized" : ""}">${escapeHTML(transaction.status)}</span></td>
      </tr>`).join("") : '<tr><td colspan="5" class="empty">No valid transactions in this batch.</td></tr>'}</tbody></table></div>`;
  } catch (error) {
    document.getElementById("pageError").textContent = error.message;
    button.disabled = false;
  }
});

document.getElementById("refreshButton").addEventListener("click", refresh);
refresh();
