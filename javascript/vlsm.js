const SUBNET_COLORS = [
    { bg: 'rgba(0,229,255,0.18)', border: '#00e5ff', text: '#00e5ff' },
    { bg: 'rgba(192,132,252,0.18)', border: '#c084fc', text: '#c084fc' },
    { bg: 'rgba(57,255,20,0.15)', border: '#39ff14', text: '#39ff14' },
    { bg: 'rgba(255,107,53,0.18)', border: '#ff6b35', text: '#ff6b35' },
    { bg: 'rgba(251,191,36,0.18)', border: '#fbbf24', text: '#fbbf24' },
    { bg: 'rgba(244,114,182,0.18)', border: '#f472b6', text: '#f472b6' },
    { bg: 'rgba(52,211,153,0.18)', border: '#34d399', text: '#34d399' },
    { bg: 'rgba(99,102,241,0.22)', border: '#6366f1', text: '#a5b4fc' },
];

let reqCount = 0;
let vlsmData = null;

function ipToNum(ip) {
    return ip.split('.').reduce((acc, o) => (acc << 8) + parseInt(o), 0) >>> 0;
}

function numToIp(n) {
    return [
        (n >>> 24) & 255,
        (n >>> 16) & 255,
        (n >>> 8) & 255,
        n & 255,
    ].join('.');
}

function isValidIp(ip) {
    const p = ip.split('.');

    if (p.length !== 4) return false;

    return p.every(x => {
        const n = parseInt(x);
        return !isNaN(n) && n >= 0 && n <= 255 && String(n) === x;
    });
}

function maskFromCidr(cidr) {
    return cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
}

function formatNum(n) {
    return n.toLocaleString('es-MX');
}

function addRequirement(name = '', hosts = '') {
    reqCount++;

    const list = document.getElementById('reqList');
    const row = document.createElement('div');

    row.className = 'req-row';
    row.dataset.id = reqCount;

    row.innerHTML = `
    <div class="req-num">#${reqCount}</div>
    <input type="text" placeholder="Nombre (ej. LAN-A)" value="${name}" class="req-name">
    <input type="number" placeholder="Hosts requeridos" value="${hosts}" class="req-hosts" min="1" max="16777214">
    <button class="remove-btn" onclick="removeRow(this)" title="Eliminar">×</button>
  `;

    list.appendChild(row);
}

function removeRow(btn) {
    btn.closest('.req-row').remove();
    renumberRows();
}

function renumberRows() {
    document.querySelectorAll('.req-row').forEach((row, i) => {
        row.querySelector('.req-num').textContent = `#${i + 1}`;
    });
}

function clearAll() {
    document.getElementById('reqList').innerHTML = '';
    document.getElementById('vlsmResults').style.display = 'none';
    document.getElementById('vlsmError').style.display = 'none';

    reqCount = 0;
    vlsmData = null;
}

function calculateVLSM() {
    const errEl = document.getElementById('vlsmError');
    const baseIp = document.getElementById('baseIp').value.trim();
    const baseCidr = parseInt(document.getElementById('baseCidr').value);

    if (!isValidIp(baseIp)) {
        showError('⚠ Dirección de red base inválida. Usa formato: 192.168.1.0');
        return;
    }

    const rows = [...document.querySelectorAll('.req-row')];

    if (rows.length === 0) {
        showError('⚠ Agrega al menos una subred con sus hosts requeridos.');
        return;
    }

    const reqs = [];

    for (const row of rows) {
        const name = row.querySelector('.req-name').value.trim() || `Subred-${reqs.length + 1}`;
        const hosts = parseInt(row.querySelector('.req-hosts').value);

        if (isNaN(hosts) || hosts < 1) {
            showError(`⚠ "${name}": el número de hosts debe ser un entero positivo.`);
            return;
        }

        reqs.push({ name, hosts });
    }

    reqs.forEach(r => {
        let bits = 0;

        while (Math.pow(2, bits) < r.hosts + 2) bits++;

        r.cidr = 32 - bits;
        r.blockSize = Math.pow(2, bits);
        r.available = r.blockSize - 2;
    });

    reqs.sort((a, b) => b.blockSize - a.blockSize);

    const baseNetwork = (ipToNum(baseIp) & maskFromCidr(baseCidr)) >>> 0;
    const totalBaseHosts = Math.pow(2, 32 - baseCidr);
    const totalNeeded = reqs.reduce((s, r) => s + r.blockSize, 0);

    if (totalNeeded > totalBaseHosts) {
        showError(`⚠ No hay suficiente espacio. Se necesitan ${formatNum(totalNeeded)} IPs pero la red base solo tiene ${formatNum(totalBaseHosts)}.`);
        return;
    }

    let cursor = baseNetwork;

    reqs.forEach((r, i) => {
        const align = r.blockSize;

        if (cursor % align !== 0) {
            cursor = Math.ceil(cursor / align) * align;
        }

        r.network = cursor >>> 0;
        r.mask = maskFromCidr(r.cidr);
        r.wildcard = (~r.mask) >>> 0;
        r.broadcast = (r.network + r.blockSize - 1) >>> 0;
        r.firstHost = r.network + 1;
        r.lastHost = r.broadcast - 1;
        r.efficiency = ((r.hosts / r.available) * 100).toFixed(1);
        r.color = SUBNET_COLORS[i % SUBNET_COLORS.length];

        cursor += r.blockSize;
    });

    const usedIPs = cursor - baseNetwork;
    const freeIPs = totalBaseHosts - usedIPs;
    const freeStart = cursor >>> 0;

    vlsmData = {
        reqs,
        baseNetwork,
        baseCidr,
        totalBaseHosts,
        usedIPs,
        freeIPs,
        freeStart,
    };

    errEl.style.display = 'none';
    renderResults(vlsmData);
}

function showError(msg) {
    const el = document.getElementById('vlsmError');

    el.textContent = msg;
    el.style.display = 'block';
}

function renderResults(d) {
    const wrap = document.getElementById('vlsmResults');

    wrap.style.display = 'flex';

    renderSummary(d);
    renderTable(d);
    renderBlockDiagram(d);

    setTimeout(() => {
        wrap.querySelectorAll('.summary-panel, .vlsm-table-panel, .block-diagram-panel')
            .forEach((el, i) => {
                el.style.transitionDelay = `${i * 0.1}s`;
                el.classList.add('visible');
            });
    }, 30);
}

function renderSummary(d) {
    const pct = ((d.usedIPs / d.totalBaseHosts) * 100).toFixed(1);

    document.getElementById('summaryGrid').innerHTML = `
    <div class="summary-card">
      <div class="s-label">Subredes</div>
      <div class="s-value" style="color:var(--wildcard)">${d.reqs.length}</div>
    </div>
    <div class="summary-card">
      <div class="s-label">IPs usadas</div>
      <div class="s-value" style="color:var(--network)">${formatNum(d.usedIPs)}</div>
    </div>
    <div class="summary-card">
      <div class="s-label">IPs libres</div>
      <div class="s-value" style="color:var(--host)">${formatNum(d.freeIPs)}</div>
    </div>
    <div class="summary-card">
      <div class="s-label">Utilización</div>
      <div class="s-value" style="color:${pct > 90 ? 'var(--accent2)' : 'var(--accent)'}">${pct}%</div>
    </div>
  `;

    const barEl = document.getElementById('usageBar');
    const labelsEl = document.getElementById('usageLabels');

    let barHTML = '';
    let labelsHTML = '';

    d.reqs.forEach(r => {
        const w = ((r.blockSize / d.totalBaseHosts) * 100).toFixed(2);

        barHTML += `
      <div class="usage-seg" style="width:${w}%;background:${r.color.border};opacity:0.8" title="${r.name}: ${w}%"></div>
    `;

        labelsHTML += `
      <div class="usage-label-item">
        <div class="usage-dot" style="background:${r.color.border}"></div>
        <span>${r.name} (${w}%)</span>
      </div>
    `;
    });

    if (d.freeIPs > 0) {
        const fw = ((d.freeIPs / d.totalBaseHosts) * 100).toFixed(2);

        barHTML += `
      <div class="usage-seg" style="width:${fw}%;background:var(--border)"></div>
    `;

        labelsHTML += `
      <div class="usage-label-item">
        <div class="usage-dot" style="background:var(--border)"></div>
        <span>Libre (${fw}%)</span>
      </div>
    `;
    }

    barEl.innerHTML = barHTML;
    labelsEl.innerHTML = labelsHTML;
}

function renderTable(d) {
    let rows = '';

    d.reqs.forEach((r, i) => {
        const effColor = r.efficiency >= 80
            ? 'var(--host)'
            : r.efficiency >= 50
                ? 'var(--accent)'
                : 'var(--accent2)';

        rows += `
      <tr>
        <td class="subnet-num">#${i + 1}</td>
        <td style="color:${r.color.text};font-weight:600">${r.name}</td>
        <td>${formatNum(r.hosts)}</td>
        <td style="color:var(--host)">${formatNum(r.available)}</td>
        <td class="td-network">${numToIp(r.network)}/${r.cidr}</td>
        <td style="color:var(--muted)">${numToIp(r.mask)}</td>
        <td style="color:var(--wildcard)">${numToIp(r.wildcard)}</td>
        <td class="td-first">${numToIp(r.firstHost)}</td>
        <td class="td-last">${numToIp(r.lastHost)}</td>
        <td class="td-broadcast">${numToIp(r.broadcast)}</td>
        <td>
          <div class="eff-bar-wrap">
            <div class="eff-bar-bg">
              <div class="eff-bar-fill" style="width:${r.efficiency}%;background:${effColor}"></div>
            </div>
            <span class="eff-pct" style="color:${effColor}">${r.efficiency}%</span>
          </div>
        </td>
      </tr>
    `;
    });

    if (d.freeIPs > 0) {
        rows += `
      <tr style="opacity:0.5">
        <td class="subnet-num">—</td>
        <td style="color:var(--muted);font-style:italic">Espacio libre</td>
        <td>—</td>
        <td style="color:var(--host)">${formatNum(d.freeIPs)}</td>
        <td class="td-network">${numToIp(d.freeStart)}/${d.baseCidr}</td>
        <td colspan="6" style="color:var(--muted);font-size:11px">No asignado</td>
      </tr>
    `;
    }

    document.getElementById('vlsmTbody').innerHTML = rows;
}

function renderBlockDiagram(d) {
    const container = document.getElementById('blockDiagram');
    let html = '';

    d.reqs.forEach(r => {
        const pct = Math.max(2, (r.blockSize / d.totalBaseHosts) * 100);

        html += `
      <div class="block-row">
        <div class="block-row-label" title="${r.name}">${r.name}</div>

        <div class="block-track">
          <div class="block-fill" style="
            left:0;
            width:${pct}%;
            background:${r.color.bg};
            border:1px solid ${r.color.border};
            color:${r.color.text};
          ">
            ${pct > 8 ? `/${r.cidr} · ${formatNum(r.available)} hosts` : ''}
          </div>

          ${pct < 100 ? `
            <div class="free-block" style="position:absolute;left:${pct}%;right:0;top:0;bottom:0;border-radius:0 4px 4px 0">
              libre
            </div>
          ` : ''}
        </div>

        <div class="block-info">${numToIp(r.network)}</div>
      </div>
    `;
    });

    container.innerHTML = html;
}

function exportCSV() {
    if (!vlsmData) return;

    const headers = [
        '#',
        'Nombre',
        'Hosts req.',
        'Hosts disp.',
        'CIDR',
        'Mascara',
        'Wildcard',
        'Primer Host',
        'Ultimo Host',
        'Broadcast',
        'Eficiencia %',
    ];

    const rows = vlsmData.reqs.map((r, i) => [
        i + 1,
        r.name,
        r.hosts,
        r.available,
        `${numToIp(r.network)}/${r.cidr}`,
        numToIp(r.mask),
        numToIp(r.wildcard),
        numToIp(r.firstHost),
        numToIp(r.lastHost),
        numToIp(r.broadcast),
        r.efficiency,
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'vlsm-subnetting.csv';
    a.click();

    URL.revokeObjectURL(url);
}

function exportPDF() {
    if (!vlsmData) {
        alert('Primero realiza el cálculo');
        return;
    }

    const original = document.getElementById('vlsmResults');
    const clone = original.cloneNode(true);

    clone.style.display = 'block';
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.background = '#ffffff';
    clone.style.color = '#000000';
    clone.style.padding = '20px';
    clone.style.width = '1200px';

    document.body.appendChild(clone);

    const opt = {
        margin: 0.5,
        filename: 'vlsm-subnetting.pdf',
        image: { type: 'jpeg', quality: 1 },
        html2canvas: {
            scale: 2,
            useCORS: true,
        },
        jsPDF: {
            unit: 'in',
            format: 'letter',
            orientation: 'landscape',
        },
    };

    html2pdf()
        .set(opt)
        .from(clone)
        .save()
        .then(() => {
            document.body.removeChild(clone);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    const baseIp = document.getElementById('baseIp');

    if (baseIp) {
        baseIp.value = '192.168.1.0';

        addRequirement('LAN-Ventas', '50');
        addRequirement('LAN-TI', '25');
        addRequirement('LAN-Gerencia', '10');
        addRequirement('Enlace WAN', '2');
    }
});