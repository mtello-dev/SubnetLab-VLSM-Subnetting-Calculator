let currentResult = null;

const CIDR_TABLE = [
    [8, '255.0.0.0', 16777214],
    [9, '255.128.0.0', 8388606],
    [10, '255.192.0.0', 4194302],
    [11, '255.224.0.0', 2097150],
    [12, '255.240.0.0', 1048574],
    [13, '255.248.0.0', 524286],
    [14, '255.252.0.0', 262142],
    [15, '255.254.0.0', 131070],
    [16, '255.255.0.0', 65534],
    [17, '255.255.128.0', 32766],
    [18, '255.255.192.0', 16382],
    [19, '255.255.224.0', 8190],
    [20, '255.255.240.0', 4094],
    [21, '255.255.248.0', 2046],
    [22, '255.255.252.0', 1022],
    [23, '255.255.254.0', 510],
    [24, '255.255.255.0', 254],
    [25, '255.255.255.128', 126],
    [26, '255.255.255.192', 62],
    [27, '255.255.255.224', 30],
    [28, '255.255.255.240', 14],
    [29, '255.255.255.248', 6],
    [30, '255.255.255.252', 2],
    [31, '255.255.255.254', 0],
    [32, '255.255.255.255', 1],
];

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
    const parts = ip.split('.');

    if (parts.length !== 4) return false;

    return parts.every(p => {
        const n = parseInt(p);
        return !isNaN(n) && n >= 0 && n <= 255 && String(n) === p;
    });
}

function numToBits(n) {
    return n.toString(2).padStart(32, '0');
}

function maskFromCidr(cidr) {
    return cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
}

function formatNum(n) {
    return n.toLocaleString('es-MX');
}

function buildCheatsheet() {
    const grid = document.getElementById('cheatGrid');
    if (!grid) return;

    grid.innerHTML = CIDR_TABLE.map(([cidr, mask, hosts]) => `
    <div class="cheat-item" onclick="applyCheat(${cidr})">
      <div class="cheat-cidr">/${cidr}</div>
      <div class="cheat-right">
        <div class="cheat-mask">${mask}</div>
        <div class="cheat-hosts">${hosts.toLocaleString()} hosts</div>
      </div>
    </div>
  `).join('');
}

function applyCheat(cidr) {
    const cidrSelect = document.getElementById('cidrSelect');
    const ipInput = document.getElementById('ipInput');

    if (!cidrSelect || !ipInput) return;

    cidrSelect.value = cidr;

    if (ipInput.value) calculate();
}

function calculate() {
    const ipStr = document.getElementById('ipInput').value.trim();
    const cidr = parseInt(document.getElementById('cidrSelect').value);
    const errEl = document.getElementById('errorMsg');

    if (!isValidIp(ipStr)) {
        errEl.style.display = 'block';
        return;
    }

    errEl.style.display = 'none';

    const ip = ipToNum(ipStr);
    const mask = maskFromCidr(cidr);
    const wildcard = (~mask) >>> 0;
    const network = (ip & mask) >>> 0;
    const broadcast = (network | wildcard) >>> 0;

    const firstHost = cidr < 31 ? network + 1 : network;
    const lastHost = cidr < 31 ? broadcast - 1 : broadcast;

    const hostCount = cidr >= 31
        ? (cidr === 32 ? 1 : 2)
        : (Math.pow(2, 32 - cidr) - 2);

    currentResult = {
        ip,
        cidr,
        mask,
        wildcard,
        network,
        broadcast,
        firstHost,
        lastHost,
        hostCount,
    };

    renderCards(currentResult);
    renderBinary(currentResult);
    renderRange(currentResult);
    renderSplitTable();
}

function renderCards(r) {
    const grid = document.getElementById('resultsGrid');

    const cards = [
        {
            label: 'Dirección de Red',
            value: numToIp(r.network),
            sub: 'Red base de la subred',
            cls: 'card-network',
        },
        {
            label: 'Máscara de Subred',
            value: numToIp(r.mask),
            sub: `/${r.cidr} CIDR`,
            cls: 'card-mask',
        },
        {
            label: 'Wildcard',
            value: numToIp(r.wildcard),
            sub: 'Máscara inversa',
            cls: 'card-wildcard',
        },
        {
            label: 'Broadcast',
            value: numToIp(r.broadcast),
            sub: 'Última dirección',
            cls: 'card-broadcast',
        },
        {
            label: 'Primer Host',
            value: numToIp(r.firstHost),
            sub: 'Primera IP utilizable',
            cls: 'card-first',
        },
        {
            label: 'Último Host',
            value: numToIp(r.lastHost),
            sub: 'Última IP utilizable',
            cls: 'card-last',
        },
        {
            label: 'Hosts Utilizables',
            value: formatNum(r.hostCount),
            sub: `fórmula: 2^${32 - r.cidr} - 2`,
            cls: 'card-hosts',
        },
        {
            label: 'Notación CIDR',
            value: `${numToIp(r.network)}/${r.cidr}`,
            sub: 'Notación compacta',
            cls: 'card-cidr',
        },
    ];

    grid.innerHTML = cards.map((c, i) => `
    <div class="result-card ${c.cls}" style="transition-delay:${i * 0.05}s">
      <div class="card-label">${c.label}</div>
      <div class="card-value">${c.value}</div>
      <div class="card-sub">${c.sub}</div>
    </div>
  `).join('');

    setTimeout(() => {
        grid.querySelectorAll('.result-card').forEach(el => el.classList.add('visible'));
    }, 20);
}

function renderBinary(r) {
    const sec = document.getElementById('binarySection');
    const container = document.getElementById('binaryRows');
    const cidr = r.cidr;

    function bitsHTML(n, type) {
        const bits = numToBits(n);

        return [0, 8, 16, 24].map(start => {
            const group = bits.slice(start, start + 8).split('').map((b, idx) => {
                const pos = start + idx;
                let cls = '';

                if (type === 'ip') cls = pos < cidr ? 'bit-1-net' : 'bit-0-host';
                if (type === 'mask') cls = b === '1' ? 'bit-1-mask' : 'bit-0-mask';
                if (type === 'wild') cls = b === '1' ? 'bit-1-wild' : 'bit-0-wild';

                return `<div class="bit ${cls}">${b}</div>`;
            }).join('');

            return `<div class="bit-group">${group}</div>`;
        }).join('');
    }

    const rows = [
        { label: 'IP Host', num: r.ip, type: 'ip' },
        { label: 'Máscara', num: r.mask, type: 'mask' },
        { label: 'Wildcard', num: r.wildcard, type: 'wild' },
        { label: 'Red', num: r.network, type: 'ip' },
    ];

    container.innerHTML = rows.map(row => `
    <div class="binary-row">
      <div class="binary-row-label">${row.label}</div>
      <div class="binary-bits">${bitsHTML(row.num, row.type)}</div>
      <span style="font-family:'Space Mono',monospace;font-size:11px;color:var(--muted);margin-left:8px">
        ${numToIp(row.num)}
      </span>
    </div>
  `).join('');

    sec.classList.add('visible');
}

function renderRange(r) {
    const sec = document.getElementById('rangeSection');

    document.getElementById('labelNet').textContent = `${numToIp(r.network)} (Red)`;
    document.getElementById('labelHosts').textContent = `${formatNum(r.hostCount)} hosts utilizables`;
    document.getElementById('labelBc').textContent = `${numToIp(r.broadcast)} (BC)`;

    sec.classList.add('visible');
}

function renderSplitTable() {
    if (!currentResult) return;

    const r = currentResult;
    const splitN = parseInt(document.getElementById('splitSelect').value);
    const newCidr = r.cidr + Math.log2(splitN);

    const sec = document.getElementById('subnetsSection');
    const wrapper = document.getElementById('subnetsTableWrapper');

    if (newCidr > 32) {
        wrapper.innerHTML = `
      <p style="font-family:'Space Mono',monospace;font-size:12px;color:var(--accent2)">
        ⚠ No es posible dividir /${r.cidr} en ${splitN} subredes.
      </p>
    `;

        sec.classList.add('visible');
        return;
    }

    const newMask = maskFromCidr(newCidr);
    const newWild = (~newMask) >>> 0;
    const blockSize = Math.pow(2, 32 - newCidr);
    const newHosts = newCidr < 31 ? blockSize - 2 : (newCidr === 32 ? 1 : 2);

    let rows = '';

    for (let i = 0; i < splitN; i++) {
        const net = (r.network + i * blockSize) >>> 0;
        const bc = (net + blockSize - 1) >>> 0;
        const fh = newCidr < 31 ? net + 1 : net;
        const lh = newCidr < 31 ? bc - 1 : bc;

        rows += `
      <tr>
        <td class="subnet-num">#${i + 1}</td>
        <td class="td-network">${numToIp(net)}/${newCidr}</td>
        <td>${numToIp(newMask)}</td>
        <td>${numToIp(newWild)}</td>
        <td class="td-first">${numToIp(fh)}</td>
        <td class="td-last">${numToIp(lh)}</td>
        <td class="td-broadcast">${numToIp(bc)}</td>
        <td style="color:var(--host)">${formatNum(newHosts)}</td>
      </tr>
    `;
    }

    wrapper.innerHTML = `
    <div style="overflow-x:auto">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Red / CIDR</th>
            <th>Máscara</th>
            <th>Wildcard</th>
            <th>Primer Host</th>
            <th>Último Host</th>
            <th>Broadcast</th>
            <th>Hosts</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

    sec.classList.add('visible');
}

document.addEventListener('DOMContentLoaded', () => {
    buildCheatsheet();

    const ipInput = document.getElementById('ipInput');

    if (ipInput) {
        ipInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') calculate();
        });

        ipInput.value = '192.168.1.0';
        calculate();
    }
});