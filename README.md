# 🌐 SubnetLab — Network Subnetting & VLSM Calculator

Modern web application for **IPv4 subnetting calculations** and **VLSM (Variable Length Subnet Masking)** visualization.

SubnetLab provides an interactive interface to calculate subnet information, visualize binary representations, split networks into subnets, and perform advanced VLSM planning.

---

## ✨ Features

### IPv4 Subnet Calculator
✔ CIDR / Mask calculation  
✔ Network Address  
✔ Broadcast Address  
✔ First / Last Host  
✔ Wildcard Mask  
✔ Usable Hosts Calculation

### Binary Visualization
✔ 32-bit binary representation  
✔ Network bits highlighting  
✔ Host bits highlighting  
✔ Wildcard visualization

### Subnet Division
✔ Split networks into:

- 2 subnets
- 4 subnets
- 8 subnets
- 16 subnets

### VLSM Calculator
✔ Variable Length Subnet Masking allocation  
✔ Automatic subnet sorting  
✔ Address space optimization  
✔ Efficiency calculation

### Export Options
✔ Export CSV  
✔ Export PDF

### UI / UX
✔ Modern cyber-style interface  
✔ Responsive design  
✔ Animated navigation system  
✔ Scroll spy navigation  
✔ Mobile support

---

## 🛠 Technologies Used

- HTML5
- CSS3
- JavaScript (Vanilla JS)
- html2pdf.js
- Responsive Design

---

## 📂 Project Structure

```txt
SubnetLab/
│
├── index.html
│
├── html/
│   ├── nav.html
│   └── vlsm.html
│
├── javascript/
│   ├── script.js
│   ├── navbar.js
│   └── vlsm.js
│
├── styles/
│   ├── styles.css
│   └── vlsm.css
│
└── README.md
```

---

## 🚀 Installation

Clone repository:

```bash
git clone https://github.com/YOUR-USERNAME/SubnetLab-Network-Calculator.git
```

Enter project folder:

```bash
cd SubnetLab-Network-Calculator
```

Run locally using Live Server or open:

```txt
index.html
```

---

## 📸 Preview

### Main Calculator
- Subnetting calculation
- Binary visualization
- CIDR reference table

### VLSM Module
- Host requirement allocation
- Address planning
- Export functionality

---

## 🎯 Example Usage

Example:

IP Address:

```txt
192.168.1.0
```

CIDR:

```txt
/24
```

Output:

```txt
Network Address: 192.168.1.0
Broadcast: 192.168.1.255
First Host: 192.168.1.1
Last Host: 192.168.1.254
Usable Hosts: 254
```

---

## 📈 Future Improvements

- IPv6 support
- Dark / Light mode toggle
- Saved subnet projects
- REST API integration
- Advanced network planning module

---

## 👨‍💻 Author

**Mauricio Daniel Tello Solano**

Systems Engineering Student | Web Development | AI & Networking

GitHub: https://github.com/mtello-dev

---

## 📄 License

MIT License
